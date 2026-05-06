import { useCallback, useEffect, useRef } from 'react'
import MonacoEditor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import type * as Monaco from 'monaco-editor'
import { useEditorStore } from '../../store/editor'
import { useCommandStore } from '../../store/commands'
import { useUIStore } from '../../store/ui'
import { useSettingsStore } from '../../store/settings'
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
  theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'vs' : 'vs-dark',
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
  const { openFiles, activeFileId, updateContent, markSaved, targetLine, clearTargetLine } = useEditorStore()
  const { fontSize, wordWrap, minimap, tabSize, theme } = useSettingsStore()
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const activeFile = openFiles.find(f => f.id === activeFileId)

  // Apply settings changes to the live editor
  useEffect(() => {
    editorRef.current?.updateOptions({
      fontSize,
      wordWrap: wordWrap ? 'on' : 'off',
      minimap: { enabled: minimap },
      tabSize
    })
  }, [fontSize, wordWrap, minimap, tabSize])

  // Switch Monaco theme when app theme changes
  useEffect(() => {
    const monacoTheme = theme === 'light' ? 'vs' : 'vs-dark'
    monaco.editor.setTheme(monacoTheme)
  }, [theme])

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

      // Ctrl+P — quick open file (override Monaco's go-to-line)
      editor.addCommand(
        // eslint-disable-next-line no-bitwise
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP,
        () => useUIStore.getState().openQuickOpen()
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

  // Jump to line when requested (e.g. from search results)
  useEffect(() => {
    if (targetLine !== null && editorRef.current) {
      editorRef.current.revealLineInCenter(targetLine)
      editorRef.current.setPosition({ lineNumber: targetLine, column: 1 })
      clearTargetLine()
    }
  }, [targetLine, clearTargetLine])

  // Auto-follow: listen for direct reveal events during AI writing
  useEffect(() => {
    const handler = (e: Event) => {
      const line = (e as CustomEvent<{ line: number }>).detail?.line
      if (line && editorRef.current) {
        editorRef.current.revealLine(line, 1 /* Immediate */)
      }
    }
    window.addEventListener('kode:revealLine', handler)
    return () => window.removeEventListener('kode:revealLine', handler)
  }, [])

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
    if (path) {
      useEditorStore.getState().setOpenFolder(path)
      window.api.fs.addRecentFolder(path)
    }
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
      <div className="editor-welcome-header">
        <div className="editor-welcome-logo">Kode</div>
        <div className="editor-welcome-version">v0.1.0 · AI-Native Code Editor</div>
      </div>

      <div className="editor-welcome-grid">
        <div className="editor-welcome-section">
          <div className="editor-welcome-section-title">Start</div>
          <button className="editor-welcome-btn" onClick={handleOpenFolder}>
            Open Folder <span className="editor-welcome-kbd">Ctrl+K O</span>
          </button>
          <button className="editor-welcome-btn" onClick={handleOpenFile}>
            Open File <span className="editor-welcome-kbd">Ctrl+O</span>
          </button>
        </div>

        <div className="editor-welcome-section">
          <div className="editor-welcome-section-title">Quick Access</div>
          <div className="editor-welcome-tip">
            <span>Command Palette</span>
            <span className="editor-welcome-tip-key">Ctrl+Shift+P</span>
          </div>
          <div className="editor-welcome-tip">
            <span>Go to File</span>
            <span className="editor-welcome-tip-key">Ctrl+P</span>
          </div>
          <div className="editor-welcome-tip">
            <span>Find in Files</span>
            <span className="editor-welcome-tip-key">Ctrl+Shift+F</span>
          </div>
          <div className="editor-welcome-tip">
            <span>Settings</span>
            <span className="editor-welcome-tip-key">Ctrl+,</span>
          </div>
        </div>
      </div>
    </div>
  )
}
