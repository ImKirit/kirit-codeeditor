export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
}

export interface OpenFile {
  id: string
  path: string
  name: string
  content: string
  language: string
  isDirty: boolean
}

// ── AI types ─────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system'

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  output?: string
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  toolCalls?: ToolCall[]
  thinking?: string
  isStreaming?: boolean
}

export interface Model {
  id: string
  name: string
  contextLength?: number
}

export interface Session {
  id: string
  title: string
  provider: string
  model: string
  subscriptionId: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface Subscription {
  id: string
  provider: string
  label: string
  apiKey: string
}

export type ProviderId = 'claude' | 'openai' | 'gemini' | 'copilot'

export interface ProviderInfo {
  id: ProviderId
  name: string
  models: Model[]
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    models: [
      { id: 'claude-opus-4-7', name: 'Claude Opus 4.7', contextLength: 200000 },
      { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', contextLength: 200000 },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', contextLength: 200000 }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextLength: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o mini', contextLength: 128000 },
      { id: 'o3', name: 'o3', contextLength: 200000 },
      { id: 'o3-mini', name: 'o3-mini', contextLength: 200000 }
    ]
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', contextLength: 1048576 },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextLength: 1048576 }
    ]
  }
]
