import { useCallback } from 'react'
import { DockviewReact, type DockviewReadyEvent, type IDockviewPanelProps } from 'dockview'
import 'dockview/dist/styles/dockview.css'
import { FileTreePanel } from './panels/FileTreePanel'
import { EditorPanel } from './panels/EditorPanel'
import { AIChatPanel } from './panels/AIChatPanel'
import { TerminalPanel } from './panels/TerminalPanel'
import { GitPanelWrapper } from './panels/GitPanel'
import { setLayoutApi } from '../../lib/layoutApi'
import { useLayoutStore } from '../../store/layout'
import './KodeLayout.css'

const LAYOUT_KEY = 'kode-layout-v1'

const COMPONENTS: Record<string, React.FunctionComponent<IDockviewPanelProps>> = {
  fileTree: FileTreePanel,
  editor: EditorPanel,
  aiChat: AIChatPanel,
  terminal: TerminalPanel,
  git: GitPanelWrapper
}

// Custom tab component for the editor — no close button
function EditorTab(props: IDockviewPanelProps): JSX.Element {
  return (
    <div className="kode-tab-locked">
      <span>{props.api.title}</span>
    </div>
  )
}

const TAB_COMPONENTS: Record<string, React.FunctionComponent<IDockviewPanelProps>> = {
  lockedTab: EditorTab
}

export function KodeLayout(): JSX.Element {
  const { setExplorerOpen, setTerminalOpen, setAiChatOpen, setGitOpen } = useLayoutStore()

  const onReady = useCallback(
    (event: DockviewReadyEvent) => {
      const { api } = event
      setLayoutApi(api)

      // Track panel close events
      api.onDidRemovePanel(panel => {
        if (panel.id === 'fileTree') setExplorerOpen(false)
        else if (panel.id === 'terminal') setTerminalOpen(false)
        else if (panel.id === 'aiChat') setAiChatOpen(false)
        else if (panel.id === 'git') setGitOpen(false)
        else if (panel.id === 'editor') {
          // Editor must never be permanently removed — re-add immediately
          setTimeout(() => {
            api.addPanel({
              id: 'editor',
              component: 'editor',
              tabComponent: 'lockedTab',
              title: 'Editor'
            } as never)
          }, 0)
        }
      })

      api.onDidAddPanel(panel => {
        if (panel.id === 'fileTree') setExplorerOpen(true)
        else if (panel.id === 'terminal') setTerminalOpen(true)
        else if (panel.id === 'aiChat') setAiChatOpen(true)
        else if (panel.id === 'git') setGitOpen(true)
      })

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

      // Default layout
      api.addPanel({
        id: 'editor',
        component: 'editor',
        tabComponent: 'lockedTab',
        title: 'Editor'
      } as never)

      api.addPanel({
        id: 'fileTree',
        component: 'fileTree',
        title: 'Explorer',
        position: { direction: 'left', referencePanel: 'editor' },
        floating: false
      } as never)

      api.addPanel({
        id: 'aiChat',
        component: 'aiChat',
        title: 'AI',
        position: { direction: 'right', referencePanel: 'editor' },
        floating: false
      } as never)

      api.addPanel({
        id: 'terminal',
        component: 'terminal',
        title: 'Terminal',
        position: { direction: 'below', referencePanel: 'editor' },
        floating: false
      } as never)

      try {
        api.getPanel('fileTree')?.group.api.setSize({ width: 240 })
        api.getPanel('aiChat')?.group.api.setSize({ width: 340 })
        api.getPanel('terminal')?.group.api.setSize({ height: 220 })
      } catch {
        // best-effort sizing
      }
    },
    [setExplorerOpen, setTerminalOpen, setAiChatOpen, setGitOpen]
  )

  return (
    <DockviewReact
      className="dockview-theme-dark kode-dockview"
      components={COMPONENTS}
      tabComponents={TAB_COMPONENTS}
      onReady={onReady}
    />
  )
}
