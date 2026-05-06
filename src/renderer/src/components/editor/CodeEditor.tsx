import { useCallback, useEffect, useRef } from 'react'
import MonacoEditor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import type * as Monaco from 'monaco-editor'
import { useEditorStore } from '../../store/editor'
import { useCommandStore } from '../../store/commands'
import { getLanguage } from '../../lib/language'
import { FileTabs } from './FileTabs'
import './CodeEditor.css'

// Use the already-bundled monaco-editor instead of loading from CDN
loader.config({ monaco })

// Wire up bundled workers (Vite ?worker syntax)
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  }
}

const EDITOR_OPTIONS: Monaco.editor.IStandaloneEditorConstructionOptions = {
  theme: 'vs-dark',
  fontSize: 13,
  fontFamily: "'Cascadia Code', 'JetBrains Mono', 'Fira Code', Consolas, monospace",
  fontLigatures: true,
  lineHeight: 20,
  tabSize: 2,
  minimap: { enabled: true, scale: 1 },
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  renderLineHighlight: 'gutter',
  padding: { top: 8, bottom: 8 },
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  automaticLayout: true,
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: true },
  suggest: { preview: true },
  wordWrap: 'off'
}

export function CodeEditor(): JSX.Element {
  const { openFiles, activeFileId, updateContent, markSaved } = useEditorStore()
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const activeFile = openFiles.find(f => f.id === activeFileId)

  const handleEditorMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor) => {
      editorRef.current = editor

      // Ctrl+S to save
      editor.addCommand(
        // eslint-disable-next-line no-bitwise
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        async () => {
          const file = useEditorStore.getState().openFiles.find(f => f.id === activeFileId)
          if (!file) return
          try {
            await window.api.fs.writeFile(file.path, file.content)
            markSaved(file.id)
          } catch (e) {
            console.error('Save failed:', e)
          }
        }
      )

      // Ctrl+Shift+P — open command palette (override Monaco's format shortcut)
      editor.addCommand(
        // eslint-disable-next-line no-bitwise
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
        () => useCommandStore.getState().openPalette()
      )

      // Track cursor position for status bar
      editor.onDidChangeCursorPosition(e => {
        useEditorStore.getState().setCursor(e.position.lineNumber, e.position.column)
      })
    },
    [activeFileId, markSaved]
  )

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (activeFileId && value !== undefined) {
        updateContent(activeFileId, value)
      }
    },
    [activeFileId, updateContent]
  )

  // Keep focus on editor when switching tabs
  useEffect(() => {
    editorRef.current?.focus()
  }, [activeFileId])

  return (
    <div className="code-editor-wrap">
      <FileTabs />
      <div className="code-editor-body">
        {activeFile ? (
          <MonacoEditor
            key={activeFile.id}
            defaultValue={activeFile.content}
            language={activeFile.language}
            options={EDITOR_OPTIONS}
            onMount={handleEditorMount}
            onChange={handleChange}
          />
        ) : (
          <EditorWelcome />
        )}
      </div>
    </div>
  )
}

function EditorWelcome(): JSX.Element {
  const { openFolder } = useEditorStore()

  const handleOpenFolder = async () => {
    const path = await window.api.fs.openFolder()
    if (path) useEditorStore.getState().setOpenFolder(path)
  }

  const handleOpenFile = async () => {
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

  return (
    <div className="editor-welcome">
      <div className="editor-welcome-logo">Kode</div>
      <div className="editor-welcome-sub">
        {openFolder ? 'Select a file from the explorer' : 'Open a folder or file to begin'}
      </div>
      {!openFolder && (
        <div className="editor-welcome-actions">
          <button className="editor-welcome-btn" onClick={handleOpenFolder}>
            Open Folder <span className="editor-welcome-kbd">Ctrl+K Ctrl+O</span>
          </button>
          <button className="editor-welcome-btn" onClick={handleOpenFile}>
            Open File <span className="editor-welcome-kbd">Ctrl+O</span>
          </button>
        </div>
      )}
    </div>
  )
}
