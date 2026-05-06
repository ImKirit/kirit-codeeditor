import { ipcMain, BrowserWindow } from 'electron'
import Anthropic from '@anthropic-ai/sdk'
import { getSubscriptions, addSubscription, removeSubscription } from '../services/settings'
import type { Subscription } from '../../shared/types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const activeStreams = new Map<string, AbortController>()

function getKey(subscriptionId: string): string | null {
  const subs = getSubscriptions()
  return subs.find(s => s.id === subscriptionId)?.apiKey ?? null
}

export function registerAiHandlers(): void {
  ipcMain.handle('ai:getSubscriptions', (): Subscription[] => {
    return getSubscriptions()
  })

  ipcMain.handle('ai:addSubscription', (_, sub: Subscription): Promise<void> => {
    return addSubscription(sub)
  })

  ipcMain.handle('ai:removeSubscription', (_, id: string): Promise<void> => {
    return removeSubscription(id)
  })

  ipcMain.handle(
    'ai:chat',
    async (
      event,
      opts: {
        sessionId: string
        subscriptionId: string
        provider: string
        model: string
        messages: ChatMessage[]
        systemPrompt?: string
      }
    ): Promise<void> => {
      const { sessionId, subscriptionId, provider, model, messages, systemPrompt } = opts
      const sender = event.sender

      if (provider !== 'claude') {
        sender.send(`ai:chunk:${sessionId}`, {
          type: 'error',
          error: `Provider "${provider}" not yet implemented.`
        })
        return
      }

      const apiKey = getKey(subscriptionId)
      if (!apiKey) {
        sender.send(`ai:chunk:${sessionId}`, { type: 'error', error: 'API key not found.' })
        return
      }

      const controller = new AbortController()
      activeStreams.set(sessionId, controller)

      try {
        const client = new Anthropic({ apiKey })
        const stream = await client.messages.stream(
          {
            model,
            max_tokens: 8192,
            system: systemPrompt ?? 'You are Kode, an AI assistant integrated into a code editor. Help with coding tasks, explain code, debug issues, and write code.',
            messages
          },
          { signal: controller.signal }
        )

        for await (const event of stream) {
          if (controller.signal.aborted) break
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            if (!sender.isDestroyed()) {
              sender.send(`ai:chunk:${sessionId}`, {
                type: 'text',
                content: event.delta.text
              })
            }
          }
        }

        const final = await stream.finalMessage()
        if (!sender.isDestroyed()) {
          sender.send(`ai:chunk:${sessionId}`, {
            type: 'done',
            inputTokens: final.usage.input_tokens,
            outputTokens: final.usage.output_tokens
          })
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted && !sender.isDestroyed()) {
          const msg = err instanceof Error ? err.message : String(err)
          sender.send(`ai:chunk:${sessionId}`, { type: 'error', error: msg })
        }
      } finally {
        activeStreams.delete(sessionId)
      }
    }
  )

  ipcMain.on('ai:cancel', (_, sessionId: string) => {
    const ctrl = activeStreams.get(sessionId)
    if (ctrl) ctrl.abort()
    activeStreams.delete(sessionId)
  })
}

export function watchWindowForAI(win: BrowserWindow): void {
  win.on('closed', () => {
    for (const ctrl of activeStreams.values()) ctrl.abort()
    activeStreams.clear()
  })
}
