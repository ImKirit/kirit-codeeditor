import { useEffect, useRef, useState } from 'react'
import { useCommandStore, type Command } from '../../store/commands'
import './CommandPalette.css'

function score(query: string, label: string): number {
  const q = query.toLowerCase()
  const l = label.toLowerCase()
  if (l === q) return 4
  if (l.startsWith(q)) return 3
  if (l.includes(q)) return 2
  // subsequence check
  let qi = 0
  for (let i = 0; i < l.length && qi < q.length; i++) {
    if (l[i] === q[qi]) qi++
  }
  return qi === q.length ? 1 : -1
}

export function CommandPalette(): JSX.Element | null {
  const { paletteOpen, commands, closePalette, executeCommand } = useCommandStore()
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (paletteOpen) {
      setQuery('')
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [paletteOpen])

  if (!paletteOpen) return null

  const filtered: Array<Command & { score: number }> = commands
    .map(cmd => ({ ...cmd, score: score(query, cmd.label) }))
    .filter(cmd => cmd.score >= 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))

  const safeIdx = Math.min(activeIdx, Math.max(0, filtered.length - 1))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closePalette()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.min(safeIdx + 1, filtered.length - 1)
      setActiveIdx(next)
      scrollItemIntoView(next)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = Math.max(safeIdx - 1, 0)
      setActiveIdx(prev)
      scrollItemIntoView(prev)
    } else if (e.key === 'Enter') {
      if (filtered[safeIdx]) executeCommand(filtered[safeIdx].id)
    }
  }

  const scrollItemIntoView = (idx: number) => {
    const item = listRef.current?.children[idx] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <div className="cp-overlay" onMouseDown={() => closePalette()}>
      <div className="cp-modal" onMouseDown={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cp-input"
          placeholder="Type a command..."
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setActiveIdx(0)
          }}
          onKeyDown={handleKeyDown}
        />
        {filtered.length > 0 && (
          <div className="cp-list" ref={listRef}>
            {filtered.map((cmd, i) => (
              <div
                key={cmd.id}
                className={`cp-item${i === safeIdx ? ' cp-item--active' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={() => executeCommand(cmd.id)}
              >
                <span className="cp-item-label">{cmd.label}</span>
                {cmd.keybinding && (
                  <span className="cp-item-kbd">{cmd.keybinding}</span>
                )}
              </div>
            ))}
          </div>
        )}
        {filtered.length === 0 && query && (
          <div className="cp-empty">No commands match &ldquo;{query}&rdquo;</div>
        )}
      </div>
    </div>
  )
}
