import { useState, useCallback, useRef, useEffect } from 'react'
import type { IDockviewPanelProps } from 'dockview'
import { TerminalInstance } from '../../terminal/TerminalInstance'
import './TerminalPanel.css'

interface Tab {
  id: string
  label: string
  exited: boolean
}

let globalTabNum = 1

function makeId(): string {
  return `term-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function nextTabLabel(): string {
  return `Terminal ${globalTabNum++}`
}

export function TerminalPanel(_props: IDockviewPanelProps): JSX.Element {
  const initId = useRef(makeId())
  const [tabs, setTabs] = useState<Tab[]>(() => [
    { id: initId.current, label: nextTabLabel(), exited: false }
  ])
  const [activeId, setActiveId] = useState<string>(initId.current)

  const addTab = useCallback(() => {
    const id = makeId()
    const label = nextTabLabel()
    setTabs((prev) => [...prev, { id, label, exited: false }])
    setActiveId(id)
  }, [])

  // Listen for "New Terminal" events from the menu bar
  useEffect(() => {
    window.addEventListener('kode:newTerminal', addTab)
    return () => window.removeEventListener('kode:newTerminal', addTab)
  }, [addTab])

  const closeTab = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      setTabs((prev) => {
        const next = prev.filter((t) => t.id !== id)
        if (next.length === 0) {
          const newId = makeId()
          const label = nextTabLabel()
          setTimeout(() => setActiveId(newId), 0)
          return [{ id: newId, label, exited: false }]
        }
        if (id === activeId) {
          const idx = prev.findIndex((t) => t.id === id)
          const nextActive = next[Math.min(idx, next.length - 1)]
          setTimeout(() => setActiveId(nextActive.id), 0)
        }
        return next
      })
    },
    [activeId]
  )

  const handleExit = useCallback((instanceKey: string) => {
    setTabs((prev) => prev.map((t) => (t.id === instanceKey ? { ...t, exited: true } : t)))
  }, [])

  return (
    <div className="terminal-panel-root">
      <div className="terminal-tabstrip">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`terminal-tab ${tab.id === activeId ? 'active' : ''} ${tab.exited ? 'exited' : ''}`}
            onClick={() => setActiveId(tab.id)}
          >
            <span className="terminal-tab-label">{tab.label}</span>
            <span
              className="terminal-tab-close"
              onClick={(e) => closeTab(tab.id, e)}
              title="Close terminal"
            >
              ×
            </span>
          </div>
        ))}
        <button className="terminal-tab-add" onClick={addTab} title="New terminal">
          +
        </button>
      </div>

      <div className="terminal-body">
        {tabs.map((tab) => (
          <TerminalInstance
            key={tab.id}
            instanceKey={tab.id}
            active={tab.id === activeId}
            onExit={handleExit}
          />
        ))}
      </div>
    </div>
  )
}
