import type { IDockviewPanelProps } from 'dockview'
import { CodeEditor } from '../../editor/CodeEditor'

export function EditorPanel(_props: IDockviewPanelProps): JSX.Element {
  return <CodeEditor />
}
