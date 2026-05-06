import { create } from 'zustand'

interface LayoutStore {
  explorerOpen: boolean
  terminalOpen: boolean
  aiChatOpen: boolean
  setExplorerOpen: (v: boolean) => void
  setTerminalOpen: (v: boolean) => void
  setAiChatOpen: (v: boolean) => void
}

export const useLayoutStore = create<LayoutStore>(set => ({
  explorerOpen: true,
  terminalOpen: true,
  aiChatOpen: true,
  setExplorerOpen: v => set({ explorerOpen: v }),
  setTerminalOpen: v => set({ terminalOpen: v }),
  setAiChatOpen: v => set({ aiChatOpen: v })
}))
