import { useEditorStore } from '../../store/editor'
import './FileTabs.css'

export function FileTabs(): JSX.Element {
  const { openFiles, activeFileId, setActiveFile, closeFile } = useEditorStore()

  if (!openFiles.length) return <div className="file-tabs file-tabs--empty" />

  return (
    <div className="file-tabs">
      {openFiles.map(file => (
        <div
          key={file.id}
          className={`file-tab${file.id === activeFileId ? ' file-tab--active' : ''}`}
          onClick={() => setActiveFile(file.id)}
        >
          <span className="file-tab-name">{file.name}</span>
          {file.isDirty && <span className="file-tab-dirty" title="Unsaved changes" />}
          <button
            className="file-tab-close"
            onClick={e => {
              e.stopPropagation()
              closeFile(file.id)
            }}
            title="Close"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
