import { useState, useCallback, useEffect } from 'react'
import type { FileEntry } from '../../../../shared/types'
import { useEditorStore } from '../../store/editor'
import { getLanguage, getDisplayName, getFileIcon } from '../../lib/language'
import './FileTree.css'

interface FileTreeProps {
  rootPath: string
}

export function FileTree({ rootPath }: FileTreeProps): JSX.Element {
  const [entries, setEntries] = useState<FileEntry[]>([])

  useEffect(() => {
    setEntries([])
    window.api.fs.readDir(rootPath).then(setEntries).catch(() => setEntries([]))
  }, [rootPath])

  const rootName = getDisplayName(rootPath)

  return (
    <div className="file-tree">
      <div className="file-tree-root-label">{rootName.toUpperCase()}</div>
      <FileEntries entries={entries} depth={0} parentPath={rootPath} onRefresh={path => {
        window.api.fs.readDir(path).then(e => {
          if (path === rootPath) setEntries(e)
        })
      }} />
    </div>
  )
}

interface FileEntriesProps {
  entries: FileEntry[]
  depth: number
  parentPath: string
  onRefresh: (path: string) => void
}

function FileEntries({ entries, depth, onRefresh }: FileEntriesProps): JSX.Element {
  return (
    <>
      {entries.map(entry =>
        entry.isDirectory ? (
          <DirectoryRow key={entry.path} entry={entry} depth={depth} onRefresh={onRefresh} />
        ) : (
          <FileRow key={entry.path} entry={entry} depth={depth} />
        )
      )}
    </>
  )
}

function DirectoryRow({
  entry,
  depth,
  onRefresh
}: {
  entry: FileEntry
  depth: number
  onRefresh: (path: string) => void
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const [children, setChildren] = useState<FileEntry[]>([])

  const toggle = useCallback(async () => {
    if (!open && children.length === 0) {
      const result = await window.api.fs.readDir(entry.path)
      setChildren(result)
    }
    setOpen(o => !o)
  }, [open, children.length, entry.path])

  return (
    <>
      <div
        className="file-tree-row file-tree-dir"
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={toggle}
      >
        <span className="file-tree-chevron">{open ? '▾' : '▸'}</span>
        <span className="file-tree-icon file-tree-icon-dir">{open ? '📂' : '📁'}</span>
        <span className="file-tree-name">{entry.name}</span>
      </div>
      {open && (
        <FileEntries entries={children} depth={depth + 1} parentPath={entry.path} onRefresh={onRefresh} />
      )}
    </>
  )
}

function FileRow({ entry, depth }: { entry: FileEntry; depth: number }): JSX.Element {
  const { openFile, setActiveFile, openFiles } = useEditorStore()
  const isOpen = openFiles.some(f => f.id === entry.path)

  const handleClick = useCallback(async () => {
    const existing = openFiles.find(f => f.id === entry.path)
    if (existing) {
      setActiveFile(entry.path)
      return
    }
    try {
      const content = await window.api.fs.readFile(entry.path)
      openFile({
        id: entry.path,
        path: entry.path,
        name: entry.name,
        content,
        language: getLanguage(entry.name)
      })
    } catch (e) {
      console.error('Failed to open file:', e)
    }
  }, [entry, openFiles, openFile, setActiveFile])

  const icon = getFileIcon(entry.name)

  return (
    <div
      className={`file-tree-row file-tree-file${isOpen ? ' file-tree-file--open' : ''}`}
      style={{ paddingLeft: 8 + depth * 12 + 14 }}
      onClick={handleClick}
    >
      <span className="file-tree-file-icon" style={{ color: icon.color }}>{icon.char}</span>
      <span className="file-tree-name">{entry.name}</span>
    </div>
  )
}
