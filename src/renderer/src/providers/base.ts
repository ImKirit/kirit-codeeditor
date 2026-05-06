import type { Message, Model, Session } from '../../../shared/types'

export interface StreamChunk {
  type: 'text' | 'thinking' | 'tool_call' | 'tool_result' | 'done' | 'error'
  content?: string
  toolCallId?: string
  toolName?: string
  toolInput?: Record<string, unknown>
  toolOutput?: string
  error?: string
}

export interface AIProvider {
  readonly id: string
  readonly name: string
  models(): Model[]
  chat(
    session: Session,
    messages: Message[],
    apiKey: string,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void>
  cancelStream(sessionId: string): void
}
