import { useEffect, useState, useCallback } from 'react'
import { useEditorStore } from '../../store/editor'
import './GitPanel.css'

interface GitFile {
  path: string
  status: string
  staged: boolean
}

interface Commit {
  hash: string
  message: string
  author: string
  date: string
}

type GitTab = 'changes' | 'history'

function statusLabel(s: string): string {
  if (s === 'M') return 'M'
  if (s === 'A' || s === '?') return 'A'
  if (s === 'D') return 'D'
  if (s === 'R') return 'R'
  return s
}

function statusClass(s: string): string {
  if (s === 'M') return 'git-status-m'
  if (s === 'A' || s === '?') return 'git-status-a'
  if (s === 'D') return 'git-status-d'
  return 'git-status-m'
}

export function GitPanel(): JSX.Element {
  const { openFolder } = useEditorStore()
  const [tab, setTab] = useState<GitTab>('changes')
  const [files, setFiles] = useState<GitFile[]>([])
  const [commits, setCommits] = useState<Commit[]>([])
  const [commitMsg, setCommitMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [selectedFile, setSelectedFile] = useState<GitFile | null>(null)
  const [diff, setDiff] = useState('')

  const refresh = useCallback(async () => {
    if (!openFolder) { setFiles([]); return }
    const result = await window.api.git.status(openFolder)
    setFiles(result)
  }, [openFolder])

  const loadHistory = useCallback(async () => {
    if (!openFolder) { setCommits([]); return }
    const result = await window.api.git.log(openFolder, 30)
    setCommits(result)
  }, [openFolder])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab, loadHistory])

  useEffect(() => {
    if (!selectedFile || !openFolder) { setDiff(''); return }
    window.api.git.diff(openFolder, selectedFile.path, selectedFile.staged).then(setDiff)
  }, [selectedFile, openFolder])

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    setTimeout(() => setFeedback(''), 3000)
  }

  const handleStage = async (f: GitFile) => {
    if (!openFolder) return
    await window.api.git.stage(openFolder, f.path)
    refresh()
  }

  const handleUnstage = async (f: GitFile) => {
    if (!openFolder) return
    await window.api.git.unstage(openFolder, f.path)
    refresh()
  }

  const handleStageAll = async () => {
    if (!openFolder) return
    for (const f of files.filter(f => !f.staged)) {
      await window.api.git.stage(openFolder, f.path)
    }
    refresh()
  }

  const handleCommit = async () => {
    if (!openFolder || !commitMsg.trim()) return
    setBusy(true)
    const result = await window.api.git.commit(openFolder, commitMsg.trim())
    setCommitMsg('')
    refresh()
    showFeedback(result)
    setBusy(false)
  }

  const handlePush = async () => {
    if (!openFolder) return
    setBusy(true)
    const result = await window.api.git.push(openFolder)
    showFeedback(result)
    setBusy(false)
  }

  const handlePull = async () => {
    if (!openFolder) return
    setBusy(true)
    const result = await window.api.git.pull(openFolder)
    refresh()
    showFeedback(result)
    setBusy(false)
  }

  const staged = files.filter(f => f.staged)
  const unstaged = files.filter(f => !f.staged)

  if (!openFolder) {
    return (
      <div className="git-panel">
        <div className="git-empty">No folder open</div>
      </div>
    )
  }

  return (
    <div className="git-panel">
      <div className="git-header">
        <button className={`git-tab${tab === 'changes' ? ' active' : ''}`} onClick={() => setTab('changes')}>
          Changes {files.length > 0 && <span className="git-badge">{files.length}</span>}
        </button>
        <button className={`git-tab${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>History</button>
        <button className="git-icon-btn" onClick={refresh} title="Refresh">↺</button>
      </div>

      {feedback && <div className="git-feedback">{feedback}</div>}

      {tab === 'changes' && (
        <div className="git-changes">
          {/* Staged */}
          {staged.length > 0 && (
            <div className="git-section">
              <div className="git-section-title">
                <span>Staged Changes ({staged.length})</span>
              </div>
              {staged.map(f => (
                <div
                  key={f.path + '-s'}
                  className={`git-file${selectedFile === f ? ' selected' : ''}`}
                  onClick={() => setSelectedFile(selectedFile === f ? null : f)}
                >
                  <span className={`git-status ${statusClass(f.status)}`}>{statusLabel(f.status)}</span>
                  <span className="git-file-path" title={f.path}>{f.path.split(/[/\\]/).pop()}</span>
                  <button className="git-file-btn" onClick={e => { e.stopPropagation(); handleUnstage(f) }} title="Unstage">−</button>
                </div>
              ))}
            </div>
          )}

          {/* Unstaged */}
          {unstaged.length > 0 && (
            <div className="git-section">
              <div className="git-section-title">
                <span>Changes ({unstaged.length})</span>
                <button className="git-text-btn" onClick={handleStageAll}>Stage All</button>
              </div>
              {unstaged.map(f => (
                <div
                  key={f.path + '-u'}
                  className={`git-file${selectedFile === f ? ' selected' : ''}`}
                  onClick={() => setSelectedFile(selectedFile === f ? null : f)}
                >
                  <span className={`git-status ${statusClass(f.status)}`}>{statusLabel(f.status)}</span>
                  <span className="git-file-path" title={f.path}>{f.path.split(/[/\\]/).pop()}</span>
                  <button className="git-file-btn" onClick={e => { e.stopPropagation(); handleStage(f) }} title="Stage">+</button>
                </div>
              ))}
            </div>
          )}

          {files.length === 0 && (
            <div className="git-empty-state">No changes</div>
          )}

          {/* Diff view */}
          {selectedFile && diff && (
            <div className="git-diff">
              <div className="git-diff-title">{selectedFile.path}</div>
              <pre className="git-diff-content">{diff}</pre>
            </div>
          )}

          {/* Commit area */}
          <div className="git-commit-area">
            <textarea
              className="git-commit-input"
              placeholder="Commit message (required)"
              value={commitMsg}
              onChange={e => setCommitMsg(e.target.value)}
              rows={2}
            />
            <div className="git-commit-actions">
              <button
                className="git-btn git-btn-primary"
                onClick={handleCommit}
                disabled={busy || !commitMsg.trim() || staged.length === 0}
              >
                Commit{staged.length > 0 ? ` (${staged.length})` : ''}
              </button>
              <button className="git-btn" onClick={handlePull} disabled={busy}>Pull</button>
              <button className="git-btn" onClick={handlePush} disabled={busy}>Push</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="git-history">
          {commits.length === 0 ? (
            <div className="git-empty-state">No commits</div>
          ) : (
            commits.map(c => (
              <div key={c.hash} className="git-commit">
                <div className="git-commit-hash">{c.hash}</div>
                <div className="git-commit-msg">{c.message}</div>
                <div className="git-commit-meta">{c.author} · {new Date(c.date).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
