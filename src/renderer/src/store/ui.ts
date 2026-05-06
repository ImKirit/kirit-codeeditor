import { create } from 'zustand'

interface UIStore {
  quickOpenOpen: boolean
  globalSearchOpen: boolean
  openQuickOpen: () => void
  closeQuickOpen: () => void
  openGlobalSearch: () => void
  closeGlobalSearch: () => void
}

export const useUIStore = create<UIStore>(set => ({
  quickOpenOpen: false,
  globalSearchOpen: false,
  openQuickOpen: () => set({ quickOpenOpen: true }),
  closeQuickOpen: () => set({ quickOpenOpen: false }),
  openGlobalSearch: () => set({ globalSearchOpen: true }),
  closeGlobalSearch: () => set({ globalSearchOpen: false })
}))
