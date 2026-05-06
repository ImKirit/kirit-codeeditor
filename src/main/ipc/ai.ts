import { ipcMain, BrowserWindow, type WebContents } from 'electron'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenAI } from '@google/genai'
import { getSubscriptions, addSubscription, removeSubscription } from '../services/settings'
import type { Subscription } from '../../shared/types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatOpts {
  sessionId: string
  subscriptionId: string
  provider: string
  model: string
  messages: ChatMessage[]
  systemPrompt?: string
}

const activeStreams = new Map<string, AbortController>()

function getKey(subscriptionId: string): string | null {
  return getSubscriptions().find(s => s.id === subscriptionId)?.apiKey ?? null
}

function send(sender: WebContents, sessionId: string, chunk: Record<string, unknown>): void {
  if (!sender.isDestroyed()) sender.send(`ai:chunk:${sessionId}`, chunk)
}

const DEFAULT_SYSTEM = 'You are Kode, an AI assistant integrated into a code editor. Help with coding tasks, explain code, debug issues, and write code. Use the write_to_file tool when the user asks you to create or modify files. Use markdown code blocks with language tags when showing code snippets without writing to file.'

const WRITE_TOOL: Anthropic.Tool = {
  name: 'write_to_file',
  description: 'Write or overwrite a file with the given content. Use this when the user asks you to create, edit, or modify a file.',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File path (relative to workspace root or absolute).'
      },
      content: {
        type: 'string',
        description: 'Complete file content to write.'
      }
    },
    required: ['path', 'content']
  }
}

async function runClaude(opts: ChatOpts, sender: WebContents, apiKey: string, ctrl: AbortController): Promise<void> {
  const { sessionId, model, systemPrompt } = opts
  const client = new Anthropic({ apiKey })

  let messages: Anthropic.MessageParam[] = opts.messages.map(m => ({
    role: m.role,
    content: m.content
  }))

  let inputTokens = 0
  let outputTokens = 0

  // Tool use loop
  while (true) {
    if (ctrl.signal.aborted) break

    const stream = await client.messages.stream(
      {
        model,
        max_tokens: 8192,
        system: systemPrompt ?? DEFAULT_SYSTEM,
        messages,
        tools: [WRITE_TOOL]
      },
      { signal: ctrl.signal }
    )

    for await (const event of stream) {
      if (ctrl.signal.aborted) break
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        send(sender, sessionId, { type: 'text', content: event.delta.text })
      }
    }

    if (ctrl.signal.aborted) break

    const final = await stream.finalMessage()
    inputTokens += final.usage.input_tokens
    outputTokens += final.usage.output_tokens

    if (final.stop_reason !== 'tool_use') {
      send(sender, sessionId, { type: 'done', inputTokens, outputTokens })
      break
    }

    // Process tool calls
    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const block of final.content) {
      if (block.type === 'tool_use' && block.name === 'write_to_file') {
        const input = block.input as { path: string; content: string }
        send(sender, sessionId, { type: 'write_file', path: input.path, content: input.content })
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: `File written successfully: ${input.path}`
        })
      }
    }

    if (toolResults.length === 0) {
      send(sender, sessionId, { type: 'done', inputTokens, outputTokens })
      break
    }

    messages = [
      ...messages,
      { role: 'assistant', content: final.content },
      { role: 'user', content: toolResults }
    ]
  }
}

async function runOpenAI(opts: ChatOpts, sender: WebContents, apiKey: string, ctrl: AbortController): Promise<void> {
  const { sessionId, model, messages, systemPrompt } = opts
  const client = new OpenAI({ apiKey })
  const stream = await client.chat.completions.create(
    {
      model,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt ?? DEFAULT_SYSTEM },
        ...messages
      ]
    },
    { signal: ctrl.signal }
  )
  for await (const chunk of stream) {
    if (ctrl.signal.aborted) break
    const text = chunk.choices[0]?.delta?.content
    if (text) send(sender, sessionId, { type: 'text', content: text })
  }
  send(sender, sessionId, { type: 'done' })
}

async function runCopilot(opts: ChatOpts, sender: WebContents, apiKey: string, ctrl: AbortController): Promise<void> {
  const { sessionId, model, messages, systemPrompt } = opts
  const client = new OpenAI({
    baseURL: 'https://api.githubcopilot.com',
    apiKey,
    defaultHeaders: {
      'Copilot-Integration-Id': 'vscode-chat',
      'Editor-Version': 'vscode/1.95.3'
    }
  })
  const stream = await client.chat.completions.create(
    {
      model,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt ?? DEFAULT_SYSTEM },
        ...messages
      ]
    },
    { signal: ctrl.signal }
  )
  for await (const chunk of stream) {
    if (ctrl.signal.aborted) break
    const text = chunk.choices[0]?.delta?.content
    if (text) send(sender, sessionId, { type: 'text', content: text })
  }
  send(sender, sessionId, { type: 'done' })
}

async function runGemini(opts: ChatOpts, sender: WebContents, apiKey: string, ctrl: AbortController): Promise<void> {
  const { sessionId, model, messages, systemPrompt } = opts
  const ai = new GoogleGenAI({ apiKey })

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  const response = await ai.models.generateContentStream({
    model,
    config: { systemInstruction: systemPrompt ?? DEFAULT_SYSTEM },
    contents
  })

  for await (const chunk of response) {
    if (ctrl.signal.aborted) break
    const text = chunk.text
    if (text) send(sender, sessionId, { type: 'text', content: text })
  }
  send(sender, sessionId, { type: 'done' })
}

export function registerAiHandlers(): void {
  ipcMain.handle('ai:getSubscriptions', (): Subscription[] => getSubscriptions())
  ipcMain.handle('ai:addSubscription', (_, sub: Subscription) => addSubscription(sub))
  ipcMain.handle('ai:removeSubscription', (_, id: string) => removeSubscription(id))

  ipcMain.handle('ai:chat', async (event, opts: ChatOpts): Promise<void> => {
    const { sessionId, subscriptionId, provider } = opts
    const sender = event.sender

    const apiKey = getKey(subscriptionId)
    if (!apiKey) {
      send(sender, sessionId, { type: 'error', error: 'API key not found.' })
      return
    }

    const ctrl = new AbortController()
    activeStreams.set(sessionId, ctrl)

    try {
      if (provider === 'claude') {
        await runClaude(opts, sender, apiKey, ctrl)
      } else if (provider === 'openai') {
        await runOpenAI(opts, sender, apiKey, ctrl)
      } else if (provider === 'gemini') {
        await runGemini(opts, sender, apiKey, ctrl)
      } else if (provider === 'copilot') {
        await runCopilot(opts, sender, apiKey, ctrl)
      } else {
        send(sender, sessionId, { type: 'error', error: `Provider "${provider}" not yet implemented.` })
      }
    } catch (err: unknown) {
      if (!ctrl.signal.aborted) {
        send(sender, sessionId, { type: 'error', error: err instanceof Error ? err.message : String(err) })
      }
    } finally {
      activeStreams.delete(sessionId)
    }
  })

  ipcMain.on('ai:cancel', (_, sessionId: string) => {
    activeStreams.get(sessionId)?.abort()
    activeStreams.delete(sessionId)
  })
}

export function watchWindowForAI(win: BrowserWindow): void {
  win.on('closed', () => {
    for (const ctrl of activeStreams.values()) ctrl.abort()
    activeStreams.clear()
  })
}
