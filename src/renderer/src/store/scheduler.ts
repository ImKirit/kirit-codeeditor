import { create } from 'zustand'

export interface ScheduledMessage {
  id: string
  sessionId: string
  prompt: string
  fireAt: number
  fired: boolean
}

interface SchedulerStore {
  messages: ScheduledMessage[]
  schedule: (sessionId: string, prompt: string, fireAt: number) => void
  cancel: (id: string) => void
  markFired: (id: string) => void
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export const useSchedulerStore = create<SchedulerStore>((set, get) => ({
  messages: [],

  schedule: (sessionId, prompt, fireAt) => {
    const id = uid()
    const msg: ScheduledMessage = { id, sessionId, prompt, fireAt, fired: false }

    const delay = Math.max(0, fireAt - Date.now())
    const timer = setTimeout(() => {
      get().markFired(id)
      // Dispatch event so the chat panel can pick it up
      window.dispatchEvent(new CustomEvent('kode:scheduledMessage', {
        detail: { sessionId, prompt }
      }))
    }, delay)

    timers.set(id, timer)
    set(state => ({ messages: [...state.messages, msg] }))
  },

  cancel: id => {
    const timer = timers.get(id)
    if (timer) { clearTimeout(timer); timers.delete(id) }
    set(state => ({ messages: state.messages.filter(m => m.id !== id) }))
  },

  markFired: id => {
    timers.delete(id)
    set(state => ({
      messages: state.messages.map(m => m.id === id ? { ...m, fired: true } : m)
    }))
    // Clean up fired messages after 10 seconds
    setTimeout(() => {
      set(state => ({ messages: state.messages.filter(m => m.id !== id) }))
    }, 10000)
  }
}))
