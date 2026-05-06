import { create } from 'zustand'
import type { OpenFile } from '../../../shared/types'

interface EditorStore {
  openFolder: string | null
  openFiles: OpenFile[]
  activeFileId: string | null
  cursorLine: number
  cursorCol: number
  targetLine: number | null

  setOpenFolder: (path: string | null) => void
  openFile: (file: Omit<OpenFile, 'isDirty'>) => void
  closeFile: (id: string) => void
  setActiveFile: (id: string) => void
  updateContent: (id: string, content: string) => void
  markSaved: (id: string) => void
  setCursor: (line: number, col: number) => void
  jumpToLine: (line: number) => void
  clearTargetLine: () => void
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  openFolder: null,
  openFiles: [],
  activeFileId: null,
  cursorLine: 1,
  cursorCol: 1,
  targetLine: null,

  setOpenFolder: path => set({ openFolder: path }),

  openFile: file => {
    const existing = get().openFiles.find(f => f.id === file.id)
    if (existing) {
      set({ activeFileId: file.id })
      return
    }
    set(state => ({
      openFiles: [...state.openFiles, { ...file, isDirty: false }],
      activeFileId: file.id
    }))
  },

  closeFile: id => {
    set(state => {
      const next = state.openFiles.filter(f => f.id !== id)
      let nextActive = state.activeFileId
      if (state.activeFileId === id) {
        const idx = state.openFiles.findIndex(f => f.id === id)
        nextActive = next[Math.min(idx, next.length - 1)]?.id ?? null
      }
      return { openFiles: next, activeFileId: nextActive }
    })
  },

  setActiveFile: id => set({ activeFileId: id }),

  updateContent: (id, content) =>
    set(state => ({
      openFiles: state.openFiles.map(f => (f.id === id ? { ...f, content, isDirty: true } : f))
    })),

  markSaved: id =>
    set(state => ({
      openFiles: state.openFiles.map(f => (f.id === id ? { ...f, isDirty: false } : f))
    })),

  setCursor: (line, col) => set({ cursorLine: line, cursorCol: col }),
  jumpToLine: line => set({ targetLine: line }),
  clearTargetLine: () => set({ targetLine: null })
}))
