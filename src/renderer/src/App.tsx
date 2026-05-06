import { useEditorStore } from './store/editor'
import { KodeLayout } from './components/layout/KodeLayout'
import './App.css'

export default function App(): JSX.Element {
  const { openFiles, activeFileId, openFolder } = useEditorStore()
  const activeFile = openFiles.find(f => f.id === activeFileId)

  return (
    <div className="kode-shell">
      <TitleBar />
      <KodeLayout />
      <StatusBar openFolder={openFolder} language={activeFile?.language} />
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
  return (
    <div className="kode-statusbar">
      <span className="kode-statusbar-item">Kode</span>
      {openFolder && (
        <span className="kode-statusbar-item">{openFolder.split(/[/\\]/).pop()}</span>
      )}
      {language && <span className="kode-statusbar-item">{language}</span>}
      <span className="kode-statusbar-item right">v0.1.0</span>
    </div>
  )
}
