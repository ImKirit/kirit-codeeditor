import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../store/editor'
import { useUIStore } from '../../store/ui'
import { getLanguage } from '../../lib/language'
import './QuickOpen.css'

function score(query: string, path: string): number {
  const name = path.split('/').pop() ?? path
  const q = query.toLowerCase()
  const n = name.toLowerCase()
  const p = path.toLowerCase()
  if (n === q) return 5
  if (n.startsWith(q)) return 4
  if (n.includes(q)) return 3
  if (p.includes(q)) return 2
  // subsequence on name
  let qi = 0
  for (let i = 0; i < n.length && qi < q.length; i++) {
    if (n[i] === q[qi]) qi++
  }
  return qi === q.length ? 1 : -1
}

export function QuickOpen(): JSX.Element | null {
  const { quickOpenOpen, closeQuickOpen } = useUIStore()
  const { openFolder } = useEditorStore()
  const [query, setQuery] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!quickOpenOpen) return
    setQuery('')
    setActiveIdx(0)
    setTimeout(() => inputRef.current?.focus(), 0)
    if (openFolder) {
      window.api.search.files(openFolder).then(setFiles)
    }
  }, [quickOpenOpen, openFolder])

  if (!quickOpenOpen) return null

  const filtered =
    query.trim() === ''
      ? files.slice(0, 100).map(f => ({ path: f, score: 0 }))
      : files
          .map(f => ({ path: f, score: score(query, f) }))
          .filter(f => f.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 100)

  const safeIdx = Math.min(activeIdx, Math.max(0, filtered.length - 1))

  const openFile = async (rel: string) => {
    if (!openFolder) return
    closeQuickOpen()
    const path = openFolder + '/' + rel
    const name = rel.split('/').pop() ?? rel
    try {
      const content = await window.api.fs.readFile(path)
      useEditorStore.getState().openFile({ id: path, path, name, content, language: getLanguage(name) })
    } catch (e) {
      console.error('Failed to open file:', e)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeQuickOpen()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.min(safeIdx + 1, filtered.length - 1)
      setActiveIdx(next)
      ;(listRef.current?.children[next] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = Math.max(safeIdx - 1, 0)
      setActiveIdx(prev)
      ;(listRef.current?.children[prev] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter') {
      if (filtered[safeIdx]) openFile(filtered[safeIdx].path)
    }
  }

  return (
    <div className="qo-overlay" onMouseDown={() => closeQuickOpen()}>
      <div className="qo-modal" onMouseDown={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="qo-input"
          placeholder="Go to file..."
          value={query}
          onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
          onKeyDown={handleKeyDown}
        />
        <div className="qo-list" ref={listRef}>
          {filtered.map((f, i) => {
            const parts = f.path.split('/')
            const name = parts.pop() ?? f.path
            const dir = parts.join('/')
            return (
              <div
                key={f.path}
                className={`qo-item${i === safeIdx ? ' qo-item--active' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={() => openFile(f.path)}
              >
                <span className="qo-item-name">{name}</span>
                {dir && <span className="qo-item-dir">{dir}</span>}
              </div>
            )
          })}
          {filtered.length === 0 && query && (
            <div className="qo-empty">No files match &ldquo;{query}&rdquo;</div>
          )}
        </div>
      </div>
    </div>
  )
}
