import { create } from 'zustand'
import type { Message, Session, Subscription } from '../../../shared/types'

const STORAGE_KEY = 'kode:sessions'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function saveSessions(sessions: Session[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(-50)))
  } catch { /* ignore */ }
}

function loadSavedSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Session[]
  } catch {
    return []
  }
}

function autoTitle(content: string): string {
  return content.trim().slice(0, 40).replace(/\n/g, ' ') || 'New Chat'
}

interface AIStore {
  sessions: Session[]
  activeSessionId: string | null
  subscriptions: Subscription[]
  streamingSessionId: string | null

  createSession: (opts: { provider: string; model: string; subscriptionId: string }) => Session
  deleteSession: (id: string) => void
  setActiveSession: (id: string | null) => void
  setSessionTitle: (id: string, title: string) => void
  addMessage: (sessionId: string, message: Message) => void
  updateLastMessage: (sessionId: string, patch: Partial<Message>) => void
  setStreaming: (sessionId: string | null) => void
  addChangedFile: (sessionId: string, filePath: string) => void

  loadSubscriptions: () => Promise<void>
  addSubscription: (sub: Omit<Subscription, 'id'>) => Promise<void>
  removeSubscription: (id: string) => Promise<void>
}

const saved = loadSavedSessions()

export const useAIStore = create<AIStore>((set, get) => ({
  sessions: saved,
  activeSessionId: saved[saved.length - 1]?.id ?? null,
  subscriptions: [],
  streamingSessionId: null,

  createSession: ({ provider, model, subscriptionId }) => {
    const session: Session = {
      id: uid(),
      title: 'New Chat',
      provider,
      model,
      subscriptionId,
      messages: [],
      changedFiles: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    set(state => {
      const sessions = [...state.sessions, session]
      saveSessions(sessions)
      return { sessions, activeSessionId: session.id }
    })
    return session
  },

  deleteSession: id =>
    set(state => {
      const sessions = state.sessions.filter(s => s.id !== id)
      saveSessions(sessions)
      return {
        sessions,
        activeSessionId: state.activeSessionId === id
          ? sessions[sessions.length - 1]?.id ?? null
          : state.activeSessionId
      }
    }),

  setActiveSession: id => set({ activeSessionId: id }),

  setSessionTitle: (id, title) =>
    set(state => {
      const sessions = state.sessions.map(s => s.id === id ? { ...s, title } : s)
      saveSessions(sessions)
      return { sessions }
    }),

  addMessage: (sessionId, message) =>
    set(state => {
      const sessions = state.sessions.map(s => {
        if (s.id !== sessionId) return s
        const updated = { ...s, messages: [...s.messages, message], updatedAt: Date.now() }
        // Auto-name session from first user message
        if (s.title === 'New Chat' && message.role === 'user') {
          updated.title = autoTitle(message.content)
        }
        return updated
      })
      saveSessions(sessions)
      return { sessions }
    }),

  updateLastMessage: (sessionId, patch) =>
    set(state => {
      const sessions = state.sessions.map(s => {
        if (s.id !== sessionId) return s
        const msgs = [...s.messages]
        if (msgs.length === 0) return s
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...patch }
        return { ...s, messages: msgs }
      })
      saveSessions(sessions)
      return { sessions }
    }),

  setStreaming: id => set({ streamingSessionId: id }),

  addChangedFile: (sessionId, filePath) =>
    set(state => {
      const sessions = state.sessions.map(s => {
        if (s.id !== sessionId) return s
        if (s.changedFiles.includes(filePath)) return s
        return { ...s, changedFiles: [...s.changedFiles, filePath] }
      })
      saveSessions(sessions)
      return { sessions }
    }),

  loadSubscriptions: async () => {
    const subs = await window.api.ai.getSubscriptions()
    set({ subscriptions: subs })
  },

  addSubscription: async sub => {
    const newSub: Subscription = { ...sub, id: uid() }
    await window.api.ai.addSubscription(newSub)
    set(state => ({ subscriptions: [...state.subscriptions, newSub] }))
  },

  removeSubscription: async id => {
    await window.api.ai.removeSubscription(id)
    set(state => ({ subscriptions: state.subscriptions.filter(s => s.id !== id) }))
  }
}))
