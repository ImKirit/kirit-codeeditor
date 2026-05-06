import type { IDockviewPanelProps } from 'dockview'

export function AIChatPanel(_props: IDockviewPanelProps): JSX.Element {
  return (
    <div className="ai-panel">
      <div className="ai-panel-body">
        <div className="ai-panel-icon">&#9670;</div>
        <p className="ai-panel-text">
          Connect an AI subscription
          <br />
          to get started.
        </p>
        <button className="ai-panel-btn">Connect AI</button>
      </div>
    </div>
  )
}
