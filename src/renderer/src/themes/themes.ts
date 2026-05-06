export interface Theme {
  id: string
  name: string
  vars: Record<string, string>
}

export const THEMES: Theme[] = [
  {
    id: 'dark',
    name: 'Dark (Default)',
    vars: {
      '--kode-bg': '#1e1e1e',
      '--kode-surface': '#252526',
      '--kode-surface-2': '#2d2d2d',
      '--kode-border': '#3a3a3a',
      '--kode-border-dim': '#2d2d2d',
      '--kode-text': '#cccccc',
      '--kode-text-dim': '#8a8a8a',
      '--kode-text-muted': '#5a5a5a',
      '--kode-accent': '#0e639c',
      '--kode-accent-hover': '#1177bb',
      '--kode-accent-text': '#ffffff',
      '--kode-titlebar': '#181818',
      '--kode-statusbar': '#0e639c',
      '--kode-tab-bg': '#2d2d2d',
      '--kode-tab-active': '#1e1e1e',
      '--kode-input-bg': '#3c3c3c',
      '--kode-input-border': '#555555',
      '--kode-scrollbar': '#444444',
      '--kode-selection': 'rgba(14, 99, 156, 0.3)',
      '--kode-error': '#f07070',
      '--kode-success': '#56d364',
      '--kode-warning': '#e2a265',
      '--kode-info': '#4fc3f7',
    }
  },
  {
    id: 'darker',
    name: 'Dark Darker',
    vars: {
      '--kode-bg': '#141414',
      '--kode-surface': '#1a1a1a',
      '--kode-surface-2': '#222222',
      '--kode-border': '#2e2e2e',
      '--kode-border-dim': '#222222',
      '--kode-text': '#d4d4d4',
      '--kode-text-dim': '#7a7a7a',
      '--kode-text-muted': '#4a4a4a',
      '--kode-accent': '#0e639c',
      '--kode-accent-hover': '#1177bb',
      '--kode-accent-text': '#ffffff',
      '--kode-titlebar': '#0e0e0e',
      '--kode-statusbar': '#0e639c',
      '--kode-tab-bg': '#222222',
      '--kode-tab-active': '#141414',
      '--kode-input-bg': '#2a2a2a',
      '--kode-input-border': '#444444',
      '--kode-scrollbar': '#333333',
      '--kode-selection': 'rgba(14, 99, 156, 0.3)',
      '--kode-error': '#f07070',
      '--kode-success': '#56d364',
      '--kode-warning': '#e2a265',
      '--kode-info': '#4fc3f7',
    }
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    vars: {
      '--kode-bg': '#000000',
      '--kode-surface': '#0a0a0a',
      '--kode-surface-2': '#111111',
      '--kode-border': '#6a6a6a',
      '--kode-border-dim': '#444444',
      '--kode-text': '#ffffff',
      '--kode-text-dim': '#cccccc',
      '--kode-text-muted': '#8a8a8a',
      '--kode-accent': '#4fc3f7',
      '--kode-accent-hover': '#81d4fa',
      '--kode-accent-text': '#000000',
      '--kode-titlebar': '#000000',
      '--kode-statusbar': '#006ab1',
      '--kode-tab-bg': '#111111',
      '--kode-tab-active': '#000000',
      '--kode-input-bg': '#111111',
      '--kode-input-border': '#888888',
      '--kode-scrollbar': '#666666',
      '--kode-selection': 'rgba(79, 195, 247, 0.3)',
      '--kode-error': '#ff6b6b',
      '--kode-success': '#69f0ae',
      '--kode-warning': '#ffcc02',
      '--kode-info': '#4fc3f7',
    }
  },
  {
    id: 'monokai',
    name: 'Monokai',
    vars: {
      '--kode-bg': '#272822',
      '--kode-surface': '#2d2e27',
      '--kode-surface-2': '#3a3b35',
      '--kode-border': '#45463e',
      '--kode-border-dim': '#3a3b35',
      '--kode-text': '#f8f8f2',
      '--kode-text-dim': '#90908a',
      '--kode-text-muted': '#5c5c5a',
      '--kode-accent': '#a6e22e',
      '--kode-accent-hover': '#b8f234',
      '--kode-accent-text': '#000000',
      '--kode-titlebar': '#1e1f19',
      '--kode-statusbar': '#75715e',
      '--kode-tab-bg': '#3a3b35',
      '--kode-tab-active': '#272822',
      '--kode-input-bg': '#3a3b35',
      '--kode-input-border': '#55564e',
      '--kode-scrollbar': '#45463e',
      '--kode-selection': 'rgba(166, 226, 46, 0.2)',
      '--kode-error': '#f92672',
      '--kode-success': '#a6e22e',
      '--kode-warning': '#e6db74',
      '--kode-info': '#66d9e8',
    }
  },
  {
    id: 'solarized',
    name: 'Solarized Dark',
    vars: {
      '--kode-bg': '#002b36',
      '--kode-surface': '#073642',
      '--kode-surface-2': '#0d4052',
      '--kode-border': '#154555',
      '--kode-border-dim': '#0d4052',
      '--kode-text': '#839496',
      '--kode-text-dim': '#586e75',
      '--kode-text-muted': '#3a545a',
      '--kode-accent': '#268bd2',
      '--kode-accent-hover': '#2e9ee4',
      '--kode-accent-text': '#ffffff',
      '--kode-titlebar': '#001e27',
      '--kode-statusbar': '#268bd2',
      '--kode-tab-bg': '#0d4052',
      '--kode-tab-active': '#002b36',
      '--kode-input-bg': '#073642',
      '--kode-input-border': '#154555',
      '--kode-scrollbar': '#154555',
      '--kode-selection': 'rgba(38, 139, 210, 0.3)',
      '--kode-error': '#dc322f',
      '--kode-success': '#859900',
      '--kode-warning': '#b58900',
      '--kode-info': '#2aa198',
    }
  }
]

export function applyTheme(themeId: string): void {
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0]
  const root = document.documentElement
  for (const [key, val] of Object.entries(theme.vars)) {
    root.style.setProperty(key, val)
  }
  root.setAttribute('data-theme', themeId)
  try { localStorage.setItem('kode:theme', themeId) } catch { /* ignore */ }
}

export function loadSavedTheme(): string {
  try { return localStorage.getItem('kode:theme') ?? 'dark' } catch { return 'dark' }
}
