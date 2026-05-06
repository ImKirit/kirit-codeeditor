import { useEffect, useState } from 'react'
import { useEditorStore } from './store/editor'
import { useCommandStore } from './store/commands'
import { KodeLayout } from './components/layout/KodeLayout'
import { CommandPalette } from './components/commandpalette/CommandPalette'
import { getLanguage } from './lib/language'
import './App.css'

export default function App(): JSX.Element {
  const { openFiles, activeFileId, openFolder } = useEditorStore()
  const { openPalette, registerCommand } = useCommandStore()
  const activeFile = openFiles.find(f => f.id === activeFileId)

  // Register global commands
  useEffect(() => {
    registerCommand({
      id: 'kode.openFolder',
      label: 'File: Open Folder',
      keybinding: 'Ctrl+K Ctrl+O',
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
  }, [registerCommand, openPalette])

  // Global keyboard shortcuts (when focus is outside Monaco)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        openPalette()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openPalette])

  return (
    <div className="kode-shell">
      <TitleBar />
      <KodeLayout />
      <StatusBar openFolder={openFolder} language={activeFile?.language} />
      <CommandPalette />
    </div>
  )
}

function TitleBar(): JSX.Element {
  return (
    <div className="kode-titlebar">
      <span className="kode-titlebar-title">Kode</span>
    </div>
  )
}

function StatusBar({
  openFolder,
  language
}: {
  openFolder: string | null
  language?: string
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
      <span className="kode-statusbar-item">v0.1.0</span>
    </div>
  )
}
