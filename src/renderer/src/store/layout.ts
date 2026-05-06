import { create } from 'zustand'

interface LayoutStore {
  explorerOpen: boolean
  terminalOpen: boolean
  aiChatOpen: boolean
  gitOpen: boolean
  setExplorerOpen: (v: boolean) => void
  setTerminalOpen: (v: boolean) => void
  setAiChatOpen: (v: boolean) => void
  setGitOpen: (v: boolean) => void
}

export const useLayoutStore = create<LayoutStore>(set => ({
  explorerOpen: true,
  terminalOpen: true,
  aiChatOpen: true,
  gitOpen: false,
  setExplorerOpen: v => set({ explorerOpen: v }),
  setTerminalOpen: v => set({ terminalOpen: v }),
  setAiChatOpen: v => set({ aiChatOpen: v }),
  setGitOpen: v => set({ gitOpen: v })
}))
