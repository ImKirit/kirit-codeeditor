import { useRef, useState } from 'react'
import { useEditorStore } from '../../store/editor'
import { useUIStore } from '../../store/ui'
import { getLanguage } from '../../lib/language'
import './GlobalSearch.css'

interface SearchResult {
  file: string
  line: number
  col: number
  text: string
}

interface FileGroup {
  file: string
  results: SearchResult[]
}

function groupByFile(results: SearchResult[]): FileGroup[] {
  const map = new Map<string, SearchResult[]>()
  for (const r of results) {
    if (!map.has(r.file)) map.set(r.file, [])
    map.get(r.file)!.push(r)
  }
  return Array.from(map.entries()).map(([file, results]) => ({ file, results }))
}

export function GlobalSearch(): JSX.Element | null {
  const { globalSearchOpen, closeGlobalSearch } = useUIStore()
  const { openFolder } = useEditorStore()
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<FileGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!globalSearchOpen) return null

  const runSearch = (q: string) => {
    if (!openFolder || q.length < 2) { setGroups([]); setSearched(false); return }
    setLoading(true)
    window.api.search.content(openFolder, q).then(results => {
      setGroups(groupByFile(results))
      setLoading(false)
      setSearched(true)
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(q), 300)
  }

  const openResult = async (rel: string, line: number) => {
    if (!openFolder) return
    const path = openFolder + '/' + rel
    const name = rel.split('/').pop() ?? rel
    const state = useEditorStore.getState()
    let file = state.openFiles.find(f => f.id === path)
    if (!file) {
      try {
        const content = await window.api.fs.readFile(path)
        state.openFile({ id: path, path, name, content, language: getLanguage(name) })
      } catch { return }
    } else {
      state.setActiveFile(path)
    }
    state.jumpToLine(line)
    closeGlobalSearch()
  }

  const totalMatches = groups.reduce((n, g) => n + g.results.length, 0)

  return (
    <div className="gs-overlay" onMouseDown={() => closeGlobalSearch()}>
      <div className="gs-panel" onMouseDown={e => e.stopPropagation()}>
        <div className="gs-header">
          <span className="gs-title">Search</span>
          <button className="gs-close" onMouseDown={() => closeGlobalSearch()}>✕</button>
        </div>
        <div className="gs-input-row">
          <input
            ref={inputRef}
            autoFocus
            className="gs-input"
            placeholder="Search across files..."
            value={query}
            onChange={handleChange}
            onKeyDown={e => { if (e.key === 'Escape') closeGlobalSearch() }}
          />
        </div>
        {searched && !loading && (
          <div className="gs-summary">
            {totalMatches > 0
              ? `${totalMatches} result${totalMatches !== 1 ? 's' : ''} in ${groups.length} file${groups.length !== 1 ? 's' : ''}`
              : `No results for "${query}"`}
          </div>
        )}
        {loading && <div className="gs-summary">Searching...</div>}
        <div className="gs-results">
          {groups.map(g => (
            <div key={g.file} className="gs-file-group">
              <div className="gs-file-name">{g.file}</div>
              {g.results.map((r, i) => (
                <div
                  key={i}
                  className="gs-result-line"
                  onMouseDown={() => openResult(r.file, r.line)}
                >
                  <span className="gs-line-num">{r.line}</span>
                  <span className="gs-line-text">{r.text}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
