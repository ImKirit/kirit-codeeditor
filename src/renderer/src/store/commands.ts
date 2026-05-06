import { create } from 'zustand'

export interface Command {
  id: string
  label: string
  description?: string
  keybinding?: string
  action: () => void | Promise<void>
}

interface CommandStore {
  commands: Command[]
  paletteOpen: boolean
  registerCommand: (cmd: Command) => void
  unregisterCommand: (id: string) => void
  openPalette: () => void
  closePalette: () => void
  executeCommand: (id: string) => void
}

export const useCommandStore = create<CommandStore>((set, get) => ({
  commands: [],
  paletteOpen: false,

  registerCommand: cmd =>
    set(state => ({
      commands: [...state.commands.filter(c => c.id !== cmd.id), cmd]
    })),

  unregisterCommand: id =>
    set(state => ({ commands: state.commands.filter(c => c.id !== id) })),

  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),

  executeCommand: id => {
    const cmd = get().commands.find(c => c.id === id)
    if (cmd) {
      get().closePalette()
      cmd.action()
    }
  }
}))
