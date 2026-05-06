import { create } from 'zustand'
import type { Message, Session, Subscription } from '../../../shared/types'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

interface AIStore {
  sessions: Session[]
  activeSessionId: string | null
  subscriptions: Subscription[]
  streamingSessionId: string | null

  // Sessions
  createSession: (opts: { provider: string; model: string; subscriptionId: string }) => Session
  deleteSession: (id: string) => void
  setActiveSession: (id: string | null) => void
  setSessionTitle: (id: string, title: string) => void
  addMessage: (sessionId: string, message: Message) => void
  updateLastMessage: (sessionId: string, patch: Partial<Message>) => void
  setStreaming: (sessionId: string | null) => void

  // Subscriptions
  loadSubscriptions: () => Promise<void>
  addSubscription: (sub: Omit<Subscription, 'id'>) => Promise<void>
  removeSubscription: (id: string) => Promise<void>
}

export const useAIStore = create<AIStore>((set) => ({
  sessions: [],
  activeSessionId: null,
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
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    set(state => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id
    }))
    return session
  },

  deleteSession: id =>
    set(state => ({
      sessions: state.sessions.filter(s => s.id !== id),
      activeSessionId: state.activeSessionId === id
        ? state.sessions.find(s => s.id !== id)?.id ?? null
        : state.activeSessionId
    })),

  setActiveSession: id => set({ activeSessionId: id }),

  setSessionTitle: (id, title) =>
    set(state => ({
      sessions: state.sessions.map(s => s.id === id ? { ...s, title } : s)
    })),

  addMessage: (sessionId, message) =>
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, message], updatedAt: Date.now() }
          : s
      )
    })),

  updateLastMessage: (sessionId, patch) =>
    set(state => ({
      sessions: state.sessions.map(s => {
        if (s.id !== sessionId) return s
        const msgs = [...s.messages]
        if (msgs.length === 0) return s
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...patch }
        return { ...s, messages: msgs }
      })
    })),

  setStreaming: id => set({ streamingSessionId: id }),

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
