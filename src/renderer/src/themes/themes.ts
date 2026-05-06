export interface Theme {
  id: string
  name: string
  vars: Record<string, string>
}

export const THEMES: Theme[] = [
  {
    id: 'light',
    name: 'Light (Default)',
    vars: {
      '--kode-bg': '#f3f3f3',
      '--kode-surface': '#ffffff',
      '--kode-surface-2': '#f5f5f5',
      '--kode-border': '#e0e0e0',
      '--kode-border-dim': '#ebebeb',
      '--kode-text': '#1a1a1a',
      '--kode-text-dim': '#555555',
      '--kode-text-muted': '#999999',
      '--kode-accent': '#0066b8',
      '--kode-accent-hover': '#0052a3',
      '--kode-accent-text': '#ffffff',
      '--kode-btn': '#1a1a1a',
      '--kode-btn-fg': '#ffffff',
      '--kode-btn-hover': '#333333',
      '--kode-titlebar': '#e8e8e8',
      '--kode-statusbar': '#1a1a1a',
      '--kode-tab-bg': '#ececec',
      '--kode-tab-active': '#ffffff',
      '--kode-input-bg': '#ffffff',
      '--kode-input-border': '#cccccc',
      '--kode-scrollbar': '#cccccc',
      '--kode-selection': 'rgba(0, 102, 184, 0.15)',
      '--kode-error': '#c0392b',
      '--kode-success': '#27ae60',
      '--kode-warning': '#e67e22',
      '--kode-info': '#2980b9',
    }
  },
  {
    id: 'dark',
    name: 'Dark',
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
      '--kode-btn': '#e8e8e8',
      '--kode-btn-fg': '#1a1a1a',
      '--kode-btn-hover': '#ffffff',
      '--kode-titlebar': '#181818',
      '--kode-statusbar': '#181818',
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
      '--kode-btn': '#e0e0e0',
      '--kode-btn-fg': '#141414',
      '--kode-btn-hover': '#ffffff',
      '--kode-titlebar': '#0e0e0e',
      '--kode-statusbar': '#0e0e0e',
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
      '--kode-btn': '#ffffff',
      '--kode-btn-fg': '#000000',
      '--kode-btn-hover': '#e0e0e0',
      '--kode-titlebar': '#000000',
      '--kode-statusbar': '#000000',
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
      '--kode-btn': '#f8f8f2',
      '--kode-btn-fg': '#272822',
      '--kode-btn-hover': '#ffffff',
      '--kode-titlebar': '#1e1f19',
      '--kode-statusbar': '#1e1f19',
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
      '--kode-btn': '#839496',
      '--kode-btn-fg': '#002b36',
      '--kode-btn-hover': '#93a1a1',
      '--kode-titlebar': '#001e27',
      '--kode-statusbar': '#001e27',
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
  },
  {
    id: 'custom',
    name: 'Custom',
    vars: {
      '--kode-bg': '#f3f3f3',
      '--kode-surface': '#ffffff',
      '--kode-surface-2': '#f5f5f5',
      '--kode-border': '#e0e0e0',
      '--kode-border-dim': '#ebebeb',
      '--kode-text': '#1a1a1a',
      '--kode-text-dim': '#555555',
      '--kode-text-muted': '#999999',
      '--kode-accent': '#0066b8',
      '--kode-accent-hover': '#0052a3',
      '--kode-accent-text': '#ffffff',
      '--kode-btn': '#1a1a1a',
      '--kode-btn-fg': '#ffffff',
      '--kode-btn-hover': '#333333',
      '--kode-titlebar': '#e8e8e8',
      '--kode-statusbar': '#1a1a1a',
      '--kode-tab-bg': '#ececec',
      '--kode-tab-active': '#ffffff',
      '--kode-input-bg': '#ffffff',
      '--kode-input-border': '#cccccc',
      '--kode-scrollbar': '#cccccc',
      '--kode-selection': 'rgba(0, 102, 184, 0.15)',
      '--kode-error': '#c0392b',
      '--kode-success': '#27ae60',
      '--kode-warning': '#e67e22',
      '--kode-info': '#2980b9',
    }
  }
]

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function lighten(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount)
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount)
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function darken(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function applyCustomTheme(mainColor: string, accentColor: string): void {
  const root = document.documentElement
  const baseTheme = THEMES.find(t => t.id === 'custom')!
  for (const [key, val] of Object.entries(baseTheme.vars)) {
    root.style.setProperty(key, val)
  }
  root.style.setProperty('--kode-bg', mainColor)
  root.style.setProperty('--kode-surface', lighten(mainColor, 15))
  root.style.setProperty('--kode-surface-2', lighten(mainColor, 8))
  root.style.setProperty('--kode-titlebar', darken(mainColor, 10))
  root.style.setProperty('--kode-statusbar', darken(mainColor, 20))
  root.style.setProperty('--kode-tab-bg', lighten(mainColor, 5))
  root.style.setProperty('--kode-tab-active', lighten(mainColor, 20))
  root.style.setProperty('--kode-accent', accentColor)
  root.style.setProperty('--kode-accent-hover', darken(accentColor, 20))
  root.style.setProperty('--kode-btn', accentColor)
  root.style.setProperty('--kode-btn-fg', '#ffffff')
  root.style.setProperty('--kode-btn-hover', darken(accentColor, 15))
  root.style.setProperty('--kode-selection', `rgba(${hexToRgb(accentColor)}, 0.15)`)
  root.setAttribute('data-theme', 'custom')
  try {
    localStorage.setItem('kode:theme', 'custom')
    localStorage.setItem('kode:customMain', mainColor)
    localStorage.setItem('kode:customAccent', accentColor)
  } catch { /* ignore */ }
}

export function applyTheme(themeId: string, customMain?: string, customAccent?: string): void {
  if (themeId === 'custom') {
    const main = customMain ?? localStorage.getItem('kode:customMain') ?? '#f3f3f3'
    const accent = customAccent ?? localStorage.getItem('kode:customAccent') ?? '#0066b8'
    applyCustomTheme(main, accent)
    return
  }
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0]
  const root = document.documentElement
  for (const [key, val] of Object.entries(theme.vars)) {
    root.style.setProperty(key, val)
  }
  root.setAttribute('data-theme', themeId)
  try { localStorage.setItem('kode:theme', themeId) } catch { /* ignore */ }
}

export function loadSavedTheme(): string {
  try { return localStorage.getItem('kode:theme') ?? 'light' } catch { return 'light' }
}

export function loadCustomColors(): { main: string; accent: string } {
  try {
    return {
      main: localStorage.getItem('kode:customMain') ?? '#f3f3f3',
      accent: localStorage.getItem('kode:customAccent') ?? '#0066b8'
    }
  } catch {
    return { main: '#f3f3f3', accent: '#0066b8' }
  }
}
