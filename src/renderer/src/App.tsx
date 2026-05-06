import { useEffect, useState } from 'react'
import { useEditorStore } from './store/editor'
import { useCommandStore } from './store/commands'
import { useUIStore } from './store/ui'
import { useSettingsStore } from './store/settings'
import { applyTheme, loadSavedTheme } from './themes/themes'
import { KodeLayout } from './components/layout/KodeLayout'
import { CommandPalette } from './components/commandpalette/CommandPalette'
import { QuickOpen } from './components/search/QuickOpen'
import { GlobalSearch } from './components/search/GlobalSearch'
import { MenuBar } from './components/menubar/MenuBar'
import { SettingsModal } from './components/settings/SettingsModal'
import { getLanguage } from './lib/language'
import './App.css'

// Apply saved theme immediately on load
applyTheme(loadSavedTheme())

export default function App(): JSX.Element {
  const { openFiles, activeFileId, openFolder } = useEditorStore()
  const { openPalette, registerCommand } = useCommandStore()
  const { openQuickOpen, openGlobalSearch } = useUIStore()
  const activeFile = openFiles.find(f => f.id === activeFileId)
  const [showSettings, setShowSettings] = useState(false)

  // Register global commands
  useEffect(() => {
    registerCommand({
      id: 'kode.openFolder',
      label: 'File: Open Folder',
      keybinding: 'Ctrl+K O',
      action: async () => {
        const path = await window.api.fs.openFolder()
        if (path) {
          useEditorStore.getState().setOpenFolder(path)
          window.api.fs.addRecentFolder(path)
        }
      }
    })
    registerCommand({
      id: 'kode.openFile',
      label: 'File: Open File',
      keybinding: 'Ctrl+O',
      action: async () => {
        const path = await window.api.fs.openFile()
        if (!path) return
        const name = path.split(/[/\\]/).pop() ?? path
        try {
          const content = await window.api.fs.readFile(path)
          useEditorStore.getState().openFile({ id: path, path, name, content, language: getLanguage(name) })
        } catch (e) {
          console.error('Failed to open file:', e)
        }
      }
    })
    registerCommand({
      id: 'kode.saveFile',
      label: 'File: Save',
      keybinding: 'Ctrl+S',
      action: async () => {
        const { openFiles, activeFileId } = useEditorStore.getState()
        const file = openFiles.find(f => f.id === activeFileId)
        if (!file) return
        await window.api.fs.writeFile(file.path, file.content)
        useEditorStore.getState().markSaved(file.id)
      }
    })
    registerCommand({
      id: 'kode.closeTab',
      label: 'View: Close Tab',
      keybinding: 'Ctrl+W',
      action: () => {
        const { activeFileId } = useEditorStore.getState()
        if (activeFileId) useEditorStore.getState().closeFile(activeFileId)
      }
    })
    registerCommand({
      id: 'kode.commandPalette',
      label: 'View: Command Palette',
      keybinding: 'Ctrl+Shift+P',
      action: () => openPalette()
    })
    registerCommand({
      id: 'kode.quickOpen',
      label: 'File: Go to File',
      keybinding: 'Ctrl+P',
      action: () => openQuickOpen()
    })
    registerCommand({
      id: 'kode.globalSearch',
      label: 'View: Search',
      keybinding: 'Ctrl+Shift+F',
      action: () => openGlobalSearch()
    })
    registerCommand({
      id: 'kode.settings',
      label: 'Preferences: Open Settings',
      keybinding: 'Ctrl+,',
      action: () => setShowSettings(true)
    })
  }, [registerCommand, openPalette, openQuickOpen, openGlobalSearch])

  // Global keyboard shortcuts (when focus is outside Monaco)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.shiftKey && e.key === 'P') { e.preventDefault(); openPalette() }
      else if (ctrl && !e.shiftKey && e.key === 'p') { e.preventDefault(); openQuickOpen() }
      else if (ctrl && e.shiftKey && e.key === 'F') { e.preventDefault(); openGlobalSearch() }
      else if (ctrl && e.key === ',') { e.preventDefault(); setShowSettings(true) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openPalette, openQuickOpen, openGlobalSearch])

  return (
    <div className="kode-shell">
      <TitleBar onSettings={() => setShowSettings(true)} />
      <KodeLayout />
      <StatusBar openFolder={openFolder} language={activeFile?.language} onSettings={() => setShowSettings(true)} />
      <CommandPalette />
      <QuickOpen />
      <GlobalSearch />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}

function TitleBar({ onSettings }: { onSettings: () => void }): JSX.Element {
  return (
    <div className="kode-titlebar">
      <MenuBar onSettings={onSettings} />
      <span className="kode-titlebar-title">Kode</span>
    </div>
  )
}

function StatusBar({
  openFolder,
  language,
  onSettings
}: {
  openFolder: string | null
  language?: string
  onSettings: () => void
}): JSX.Element {
  const { cursorLine, cursorCol, activeFileId } = useEditorStore()
  const [branch, setBranch] = useState<string | null>(null)

  useEffect(() => {
    if (!openFolder) { setBranch(null); return }
    let cancelled = false
    window.api.git.branch(openFolder).then(b => {
      if (!cancelled) setBranch(b)
    })
    return () => { cancelled = true }
  }, [openFolder])

  return (
    <div className="kode-statusbar">
      {branch && (
        <span className="kode-statusbar-item kode-statusbar-branch">
          ⎇ {branch}
        </span>
      )}
      {openFolder && (
        <span className="kode-statusbar-item">
          {openFolder.split(/[/\\]/).pop()}
        </span>
      )}

      <span className="kode-statusbar-spacer" />

      {activeFileId && (
        <>
          <span className="kode-statusbar-item">Ln {cursorLine}, Col {cursorCol}</span>
          <span className="kode-statusbar-item">UTF-8</span>
          <span className="kode-statusbar-item">Spaces: 2</span>
        </>
      )}
      {language && <span className="kode-statusbar-item">{language}</span>}
      <span
        className="kode-statusbar-item"
        onClick={onSettings}
        style={{ cursor: 'pointer' }}
        title="Open Settings (Ctrl+,)"
      >
        ⚙ v0.1.0
      </span>
    </div>
  )
}
