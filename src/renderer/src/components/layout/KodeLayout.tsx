import { useCallback } from 'react'
import { DockviewReact, type DockviewReadyEvent, type IDockviewPanelProps } from 'dockview'
import 'dockview/dist/styles/dockview.css'
import { FileTreePanel } from './panels/FileTreePanel'
import { EditorPanel } from './panels/EditorPanel'
import { AIChatPanel } from './panels/AIChatPanel'
import { TerminalPanel } from './panels/TerminalPanel'
import './KodeLayout.css'

const LAYOUT_KEY = 'kode-layout-v1'

const COMPONENTS: Record<string, React.FunctionComponent<IDockviewPanelProps>> = {
  fileTree: FileTreePanel,
  editor: EditorPanel,
  aiChat: AIChatPanel,
  terminal: TerminalPanel
}

export function KodeLayout(): JSX.Element {
  const onReady = useCallback((event: DockviewReadyEvent) => {
    const { api } = event

    // Persist layout on every change
    api.onDidLayoutChange(() => {
      try {
        localStorage.setItem(LAYOUT_KEY, JSON.stringify(api.toJSON()))
      } catch {
        // storage quota exceeded — non-fatal
      }
    })

    // Restore saved layout
    const saved = localStorage.getItem(LAYOUT_KEY)
    if (saved) {
      try {
        api.fromJSON(JSON.parse(saved))
        return
      } catch {
        localStorage.removeItem(LAYOUT_KEY)
      }
    }

    // Default layout: editor fills space, then we add panels around it
    api.addPanel({
      id: 'editor',
      component: 'editor',
      title: 'Editor'
    } as any)

    api.addPanel({
      id: 'fileTree',
      component: 'fileTree',
      title: 'Explorer',
      position: { direction: 'left', referencePanel: 'editor' },
      floating: false
    } as any)

    api.addPanel({
      id: 'aiChat',
      component: 'aiChat',
      title: 'AI',
      position: { direction: 'right', referencePanel: 'editor' },
      floating: false
    } as any)

    api.addPanel({
      id: 'terminal',
      component: 'terminal',
      title: 'Terminal',
      position: { direction: 'below', referencePanel: 'editor' },
      floating: false
    } as any)

    // Size the panels after adding them — dockview exposes panel group sizing
    // via the group's view. We resize groups by accessing their layout.
    // The built-in drag handles handle all subsequent resizing.
    try {
      const groups = api.groups
      // fileTree group — constrain to ~240px width
      const fileTreePanel = api.getPanel('fileTree')
      if (fileTreePanel) {
        fileTreePanel.group.api.setSize({ width: 240 })
      }
      const aiChatPanel = api.getPanel('aiChat')
      if (aiChatPanel) {
        aiChatPanel.group.api.setSize({ width: 340 })
      }
      const terminalPanel = api.getPanel('terminal')
      if (terminalPanel) {
        terminalPanel.group.api.setSize({ height: 220 })
      }
      void groups // avoid lint warning
    } catch {
      // sizing is best-effort — layout still works without it
    }
  }, [])

  return (
    <DockviewReact
      className="dockview-theme-dark kode-dockview"
      components={COMPONENTS}
      onReady={onReady}
    />
  )
}
