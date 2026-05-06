import { useEffect, useRef, useState, useCallback } from 'react'
import { useEditorStore } from '../../store/editor'
import { useCommandStore } from '../../store/commands'
import { useUIStore } from '../../store/ui'
import { useLayoutStore } from '../../store/layout'
import {
  openTerminal, closePanel, dispatchNewTerminalTab,
  openAIChat, openExplorer, openGitPanel
} from '../../lib/layoutApi'
import './MenuBar.css'

interface MenuItem {
  label?: string
  shortcut?: string
  separator?: boolean
  disabled?: boolean
  action?: () => void
  checked?: boolean
}

interface MenuDef {
  label: string
  items: MenuItem[]
}

export function MenuBar({ onSettings }: { onSettings?: () => void }): JSX.Element {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 })
  const barRef = useRef<HTMLDivElement>(null)

  const { openFolder, activeFileId, openFiles, closeFile, markSaved } = useEditorStore()
  const { openPalette } = useCommandStore()
  const { openQuickOpen, openGlobalSearch } = useUIStore()
  const { explorerOpen, terminalOpen, aiChatOpen, gitOpen } = useLayoutStore()

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeFile = openFiles.find(f => f.id === activeFileId)

  const menus: MenuDef[] = [
    {
      label: 'File',
      items: [
        {
          label: 'Open Folder…',
          shortcut: 'Ctrl+K O',
          action: async () => {
            const path = await window.api.fs.openFolder()
            if (path) {
              useEditorStore.getState().setOpenFolder(path)
              window.api.fs.addRecentFolder(path)
            }
          }
        },
        {
          label: 'Open File…',
          shortcut: 'Ctrl+O',
          action: async () => {
            const path = await window.api.fs.openFile()
            if (!path) return
            const name = path.split(/[/\\]/).pop() ?? path
            const { getLanguage } = await import('../../lib/language')
            try {
              const content = await window.api.fs.readFile(path)
              useEditorStore.getState().openFile({ id: path, path, name, content, language: getLanguage(name) })
            } catch { /* ignore */ }
          }
        },
        {
          label: 'Close Folder',
          disabled: !openFolder,
          action: () => useEditorStore.getState().setOpenFolder(null)
        },
        { separator: true },
        {
          label: 'Save',
          shortcut: 'Ctrl+S',
          disabled: !activeFile,
          action: async () => {
            if (!activeFile) return
            await window.api.fs.writeFile(activeFile.path, activeFile.content)
            markSaved(activeFile.id)
          }
        },
        {
          label: 'Close Tab',
          shortcut: 'Ctrl+W',
          disabled: !activeFileId,
          action: () => { if (activeFileId) closeFile(activeFileId) }
        }
      ]
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', shortcut: 'Ctrl+Z' },
        { label: 'Redo', shortcut: 'Ctrl+Y' },
        { separator: true },
        { label: 'Cut', shortcut: 'Ctrl+X' },
        { label: 'Copy', shortcut: 'Ctrl+C' },
        { label: 'Paste', shortcut: 'Ctrl+V' },
        { separator: true },
        { label: 'Find', shortcut: 'Ctrl+F' },
        { label: 'Replace', shortcut: 'Ctrl+H' }
      ]
    },
    {
      label: 'View',
      items: [
        {
          label: 'Explorer',
          checked: explorerOpen,
          action: () => explorerOpen ? closePanel('fileTree') : openExplorer()
        },
        {
          label: 'Source Control',
          checked: gitOpen,
          action: () => gitOpen ? closePanel('git') : openGitPanel()
        },
        {
          label: 'AI Chat',
          checked: aiChatOpen,
          action: () => aiChatOpen ? closePanel('aiChat') : openAIChat()
        },
        {
          label: 'Terminal',
          shortcut: 'Ctrl+`',
          checked: terminalOpen,
          action: () => terminalOpen ? closePanel('terminal') : openTerminal()
        },
        { separator: true },
        {
          label: 'Command Palette',
          shortcut: 'Ctrl+Shift+P',
          action: () => openPalette()
        },
        {
          label: 'Go to File…',
          shortcut: 'Ctrl+P',
          action: () => openQuickOpen()
        },
        {
          label: 'Search',
          shortcut: 'Ctrl+Shift+F',
          action: () => openGlobalSearch()
        }
      ]
    },
    {
      label: 'Terminal',
      items: [
        {
          label: 'New Terminal',
          action: () => {
            if (!terminalOpen) openTerminal()
            else dispatchNewTerminalTab()
          }
        },
        {
          label: 'Close Terminal',
          disabled: !terminalOpen,
          action: () => closePanel('terminal')
        }
      ]
    },
    {
      label: 'Help',
      items: [
        {
          label: 'Settings',
          shortcut: 'Ctrl+,',
          action: () => onSettings?.()
        },
        { separator: true },
        {
          label: 'GitHub Repository',
          action: () => {}
        },
        { separator: true },
        { label: 'About Kode', action: () => {} }
      ]
    }
  ]

  const handleItem = (item: MenuItem) => {
    if (item.disabled || item.separator) return
    setOpenMenu(null)
    item.action?.()
  }

  const handleLabelClick = useCallback((label: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setDropdownPos({ left: rect.left, top: rect.bottom })
    setOpenMenu(prev => prev === label ? null : label)
  }, [])

  const handleLabelHover = useCallback((label: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenu !== null) {
      const rect = e.currentTarget.getBoundingClientRect()
      setDropdownPos({ left: rect.left, top: rect.bottom })
      setOpenMenu(label)
    }
  }, [openMenu])

  return (
    <div className="menubar" ref={barRef}>
      {menus.map(menu => (
        <div
          key={menu.label}
          className={`menubar-menu${openMenu === menu.label ? ' open' : ''}`}
        >
          <button
            className="menubar-label"
            onClick={e => handleLabelClick(menu.label, e)}
            onMouseEnter={e => handleLabelHover(menu.label, e)}
          >
            {menu.label}
          </button>
          {openMenu === menu.label && (
            <div
              className="menubar-dropdown"
              style={{ left: dropdownPos.left, top: dropdownPos.top }}
            >
              {menu.items.map((item, i) =>
                item.separator ? (
                  <div key={i} className="menubar-separator" />
                ) : (
                  <button
                    key={i}
                    className={`menubar-item${item.disabled ? ' disabled' : ''}`}
                    onClick={() => handleItem(item)}
                  >
                    <span className="menubar-item-label">
                      {item.checked !== undefined && (
                        <span className="menubar-item-check">{item.checked ? '✓' : ' '}</span>
                      )}
                      {item.label}
                    </span>
                    {item.shortcut && (
                      <span className="menubar-item-shortcut">{item.shortcut}</span>
                    )}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
