import { create } from 'zustand'
import { applyTheme, loadSavedTheme } from '../themes/themes'

interface SettingsState {
  theme: string
  fontSize: number
  wordWrap: boolean
  minimap: boolean
  autoSave: boolean
  tabSize: number

  setTheme: (id: string) => void
  setFontSize: (n: number) => void
  setWordWrap: (v: boolean) => void
  setMinimap: (v: boolean) => void
  setAutoSave: (v: boolean) => void
  setTabSize: (n: number) => void
}

function load<T>(key: string, def: T): T {
  try {
    const v = localStorage.getItem(`kode:settings:${key}`)
    return v !== null ? JSON.parse(v) : def
  } catch { return def }
}

function save(key: string, val: unknown): void {
  try { localStorage.setItem(`kode:settings:${key}`, JSON.stringify(val)) } catch { /* ignore */ }
}

export const useSettingsStore = create<SettingsState>(set => ({
  theme: loadSavedTheme(),
  fontSize: load('fontSize', 13),
  wordWrap: load('wordWrap', false),
  minimap: load('minimap', true),
  autoSave: load('autoSave', false),
  tabSize: load('tabSize', 2),

  setTheme: id => { applyTheme(id); save('theme', id); set({ theme: id }) },
  setFontSize: n => { save('fontSize', n); set({ fontSize: n }) },
  setWordWrap: v => { save('wordWrap', v); set({ wordWrap: v }) },
  setMinimap: v => { save('minimap', v); set({ minimap: v }) },
  setAutoSave: v => { save('autoSave', v); set({ autoSave: v }) },
  setTabSize: n => { save('tabSize', n); set({ tabSize: n }) }
}))
