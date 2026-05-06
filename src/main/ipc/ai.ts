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

const DEFAULT_SYSTEM = 'You are Kode, an AI assistant integrated into a code editor. Help with coding tasks, explain code, debug issues, and write code. Use markdown code blocks with language tags when writing code.'

async function runClaude(opts: ChatOpts, sender: WebContents, apiKey: string, ctrl: AbortController): Promise<void> {
  const { sessionId, model, messages, systemPrompt } = opts
  const client = new Anthropic({ apiKey })
  const stream = await client.messages.stream(
    { model, max_tokens: 8192, system: systemPrompt ?? DEFAULT_SYSTEM, messages },
    { signal: ctrl.signal }
  )
  for await (const event of stream) {
    if (ctrl.signal.aborted) break
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      send(sender, sessionId, { type: 'text', content: event.delta.text })
    }
  }
  const final = await stream.finalMessage()
  send(sender, sessionId, { type: 'done', inputTokens: final.usage.input_tokens, outputTokens: final.usage.output_tokens })
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
