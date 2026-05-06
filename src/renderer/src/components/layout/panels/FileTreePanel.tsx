import type { IDockviewPanelProps } from 'dockview'
import { useCallback } from 'react'
import { FileTree } from '../../filetree/FileTree'
import { useEditorStore } from '../../../store/editor'

export function FileTreePanel(_props: IDockviewPanelProps): JSX.Element {
  const { openFolder, setOpenFolder } = useEditorStore()

  const handleOpenFolder = useCallback(async () => {
    const path = await window.api.fs.openFolder()
    if (path) setOpenFolder(path)
  }, [setOpenFolder])

  if (!openFolder) {
    return (
      <div className="panel-empty">
        <p className="panel-empty-text">No folder open.</p>
        <button className="panel-empty-btn" onClick={handleOpenFolder}>
          Open Folder
        </button>
      </div>
    )
  }

  return <FileTree rootPath={openFolder} />
}
