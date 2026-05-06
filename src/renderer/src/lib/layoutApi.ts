import type { DockviewApi } from 'dockview'

let _api: DockviewApi | null = null

export function setLayoutApi(api: DockviewApi): void {
  _api = api
}

export function getLayoutApi(): DockviewApi | null {
  return _api
}

export function openPanel(
  id: string,
  component: string,
  title: string,
  position?: Record<string, unknown>
): void {
  if (!_api) return
  const existing = _api.getPanel(id)
  if (existing) {
    existing.api.setActive()
    return
  }
  _api.addPanel({ id, component, title, ...(position ?? {}) } as never)
}

export function closePanel(id: string): void {
  const panel = _api?.getPanel(id)
  if (panel && _api) _api.removePanel(panel)
}

export function openTerminal(): void {
  openPanel('terminal', 'terminal', 'Terminal', {
    position: { direction: 'below', referencePanel: 'editor' }
  })
}

export function dispatchNewTerminalTab(): void {
  window.dispatchEvent(new CustomEvent('kode:newTerminal'))
}

export function openAIChat(): void {
  openPanel('aiChat', 'aiChat', 'AI', {
    position: { direction: 'right', referencePanel: 'editor' }
  })
}

export function openExplorer(): void {
  openPanel('fileTree', 'fileTree', 'Explorer', {
    position: { direction: 'left', referencePanel: 'editor' }
  })
}

export function openGitPanel(): void {
  openPanel('git', 'git', 'Source Control', {
    position: { direction: 'left', referencePanel: 'editor' }
  })
}
