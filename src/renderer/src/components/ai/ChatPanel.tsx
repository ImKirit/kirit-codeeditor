import { useEffect, useRef, useState, useCallback } from 'react'
import { useAIStore } from '../../store/ai'
import { useEditorStore } from '../../store/editor'
import { useSchedulerStore } from '../../store/scheduler'
import { PROVIDERS, type Session, type Subscription } from '../../../../shared/types'
import { getLanguage } from '../../lib/language'
import { SubscriptionModal } from './SubscriptionModal'
import { SchedulerPopup } from '../scheduler/SchedulerPopup'
import './ChatPanel.css'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const PLAYBACK_CHUNK = 80

function playbackWrite(
  fileId: string,
  content: string,
  autoFollow: boolean,
  onDone: () => void
): () => void {
  let offset = 0
  let animId: ReturnType<typeof setTimeout>

  const step = () => {
    offset = Math.min(offset + PLAYBACK_CHUNK, content.length)
    useEditorStore.getState().updateContent(fileId, content.slice(0, offset))

    if (autoFollow) {
      const line = content.slice(0, offset).split('\n').length
      window.dispatchEvent(new CustomEvent('kode:revealLine', { detail: { line } }))
    }

    if (offset < content.length) {
      animId = setTimeout(step, 16)
    } else {
      onDone()
    }
  }

  animId = setTimeout(step, 16)
  return () => clearTimeout(animId)
}

type PanelTab = 'chat' | 'files'

export function ChatPanel(): JSX.Element {
  const {
    sessions, activeSessionId, subscriptions,
    createSession, deleteSession, setActiveSession,
    setSessionTitle, addMessage, updateLastMessage,
    setStreaming, streamingSessionId, addChangedFile,
    loadSubscriptions
  } = useAIStore()

  const { openFiles, openFolder, openFile, jumpToLine } = useEditorStore()

  const { messages: scheduledMessages } = useSchedulerStore()
  const pendingScheduled = scheduledMessages.filter(m => m.sessionId === (activeSessionId ?? '') && !m.fired)

  const [showSubs, setShowSubs] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [input, setInput] = useState('')
  const [selectedSubId, setSelectedSubId] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [autoFollow, setAutoFollow] = useState(true)
  const [writingFile, setWritingFile] = useState<string | null>(null)
  const [panelTab, setPanelTab] = useState<PanelTab>('chat')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const playbackCleanupRef = useRef<(() => void) | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null
  const isStreaming = streamingSessionId !== null

  useEffect(() => { loadSubscriptions() }, [loadSubscriptions])

  useEffect(() => {
    if (subscriptions.length > 0 && !selectedSubId) {
      const sub = subscriptions[0]
      setSelectedSubId(sub.id)
      const provider = PROVIDERS.find(p => p.id === sub.provider)
      if (provider?.models[0]) setSelectedModel(provider.models[0].id)
    }
  }, [subscriptions, selectedSubId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages.length])

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitle])

  // Listen for scheduled messages firing
  useEffect(() => {
    const handler = (e: Event) => {
      const { sessionId, prompt } = (e as CustomEvent<{ sessionId: string; prompt: string }>).detail
      if (sessionId !== activeSessionId) return
      setInput(prompt)
      // Small delay so the input is set before sending
      setTimeout(() => {
        const state = useAIStore.getState()
        if (state.streamingSessionId) return // don't send if streaming
        const inputEl = document.querySelector('.chat-input') as HTMLTextAreaElement | null
        if (inputEl) {
          inputEl.value = prompt
          inputEl.dispatchEvent(new Event('input', { bubbles: true }))
        }
      }, 100)
    }
    window.addEventListener('kode:scheduledMessage', handler)
    return () => window.removeEventListener('kode:scheduledMessage', handler)
  }, [activeSessionId])

  const resolveFilePath = useCallback((filePath: string): string => {
    if (/^[a-zA-Z]:[\\/]/.test(filePath) || filePath.startsWith('/')) return filePath
    if (openFolder) return openFolder + '\\' + filePath.replace(/\//g, '\\')
    return filePath
  }, [openFolder])

  const handleWriteFile = useCallback(async (rawPath: string, content: string) => {
    const absPath = resolveFilePath(rawPath)
    const name = absPath.split(/[/\\]/).pop() ?? absPath
    const language = getLanguage(name)

    try { await window.api.fs.writeFile(absPath, content) } catch (e) {
      console.error('Failed to write file:', e)
    }

    if (!openFiles.find(f => f.id === absPath)) {
      openFile({ id: absPath, path: absPath, name, content: '', language })
    }

    if (activeSessionId) addChangedFile(activeSessionId, absPath)

    setWritingFile(name)
    playbackCleanupRef.current?.()
    playbackCleanupRef.current = playbackWrite(absPath, content, autoFollow, () => {
      setWritingFile(null)
      playbackCleanupRef.current = null
      useEditorStore.getState().markSaved(absPath)
    })
  }, [openFiles, openFile, resolveFilePath, autoFollow, activeSessionId, addChangedFile])

  const getOrCreateSession = (): Session => {
    if (activeSession) return activeSession
    const sub = subscriptions.find(s => s.id === selectedSubId) ?? subscriptions[0]
    if (!sub) throw new Error('No subscription')
    const provider = PROVIDERS.find(p => p.id === sub.provider)
    const model = selectedModel || provider?.models[0]?.id || 'unknown'
    return createSession({ provider: sub.provider, model, subscriptionId: sub.id })
  }

  const handleNewSession = () => {
    if (!subscriptions.length) { setShowSubs(true); return }
    const sub = subscriptions.find(s => s.id === selectedSubId) ?? subscriptions[0]
    const provider = PROVIDERS.find(p => p.id === sub.provider)
    const model = selectedModel || provider?.models[0]?.id || 'unknown'
    createSession({ provider: sub.provider, model, subscriptionId: sub.id })
    setPanelTab('chat')
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isStreaming) return
    if (subscriptions.length === 0) { setShowSubs(true); return }

    let session: Session
    try { session = getOrCreateSession() } catch { setShowSubs(true); return }

    setInput('')
    setPanelTab('chat')

    addMessage(session.id, { id: uid(), role: 'user', content: text, timestamp: Date.now() })

    const assistantMsgId = uid()
    addMessage(session.id, { id: assistantMsgId, role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true })
    setStreaming(session.id)

    const updatedSession = useAIStore.getState().sessions.find(s => s.id === session.id)!
    const apiMessages = updatedSession.messages
      .filter(m => m.role !== 'system' && !m.isStreaming)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    if (cleanupRef.current) cleanupRef.current()
    cleanupRef.current = window.api.ai.onChunk(session.id, (chunk) => {
      if (chunk.type === 'text' && typeof chunk.content === 'string') {
        const current = useAIStore.getState().sessions
          .find(s => s.id === session.id)?.messages
          .find(m => m.id === assistantMsgId)?.content ?? ''
        updateLastMessage(session.id, { content: current + chunk.content })
      } else if (chunk.type === 'write_file') {
        handleWriteFile(chunk.path as string, chunk.content as string)
        const current = useAIStore.getState().sessions
          .find(s => s.id === session.id)?.messages
          .find(m => m.id === assistantMsgId)?.content ?? ''
        const note = `\n📝 Writing \`${chunk.path}\`…`
        if (!current.includes(note.trim())) {
          updateLastMessage(session.id, { content: current + note })
        }
      } else if (chunk.type === 'done') {
        updateLastMessage(session.id, { isStreaming: false })
        setStreaming(null)
        if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null }
      } else if (chunk.type === 'error') {
        const errMsg = typeof chunk.error === 'string' ? chunk.error : 'Unknown error'
        updateLastMessage(session.id, { content: `Error: ${errMsg}`, isStreaming: false })
        setStreaming(null)
        if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null }
      }
    })

    window.api.ai.chat({
      sessionId: session.id,
      subscriptionId: session.subscriptionId,
      provider: session.provider,
      model: session.model,
      messages: apiMessages
    }).catch(err => {
      updateLastMessage(session.id, { content: `Failed to start chat: ${err}`, isStreaming: false })
      setStreaming(null)
    })
  }

  const cancelStream = () => {
    if (activeSession && streamingSessionId) {
      window.api.ai.cancel(streamingSessionId)
      updateLastMessage(activeSession.id, { isStreaming: false })
      setStreaming(null)
    }
    playbackCleanupRef.current?.()
    playbackCleanupRef.current = null
    setWritingFile(null)
  }

  const startEditTitle = () => {
    if (!activeSession) return
    setTitleDraft(activeSession.title)
    setEditingTitle(true)
  }

  const commitTitle = () => {
    if (activeSession && titleDraft.trim()) {
      setSessionTitle(activeSession.id, titleDraft.trim())
    }
    setEditingTitle(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendMessage() }
  }

  const activeSub: Subscription | undefined = subscriptions.find(s => s.id === selectedSubId)
  const activeProvider = activeSub ? PROVIDERS.find(p => p.id === activeSub.provider) : undefined

  const modelName = activeProvider?.models.find(m => m.id === selectedModel)?.name ?? selectedModel

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-selectors">
          {subscriptions.length > 0 ? (
            <>
              <select className="chat-select" value={selectedSubId} onChange={e => {
                setSelectedSubId(e.target.value)
                const sub = subscriptions.find(s => s.id === e.target.value)
                const prov = PROVIDERS.find(p => p.id === sub?.provider)
                if (prov?.models[0]) setSelectedModel(prov.models[0].id)
              }}>
                {subscriptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </>
          ) : (
            <span className="chat-no-sub">No AI connected</span>
          )}
        </div>
        <div className="chat-header-actions">
          <button
            className={`chat-follow-btn${autoFollow ? ' active' : ''}`}
            onClick={() => setAutoFollow(v => !v)}
            title={autoFollow ? 'Auto-follow: on' : 'Auto-follow: off'}
          >↕</button>
          <button className="chat-header-btn" onClick={handleNewSession} title="New thread">+</button>
          <button className="chat-header-btn" onClick={() => setShowSubs(true)} title="Manage AI accounts">⚙</button>
        </div>
      </div>

      {/* Session tabs */}
      {sessions.length > 0 && (
        <div className="chat-session-tabs">
          {sessions.map(s => (
            <button
              key={s.id}
              className={`chat-session-tab${s.id === activeSessionId ? ' active' : ''}`}
              onClick={() => setActiveSession(s.id)}
              onDoubleClick={() => { setActiveSession(s.id); startEditTitle() }}
              title={s.title}
            >
              <span className="chat-session-tab-text">{s.title}</span>
              {sessions.length > 1 && (
                <button
                  className="chat-session-tab-close"
                  onClick={e => { e.stopPropagation(); deleteSession(s.id) }}
                >×</button>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Panel sub-tabs */}
      {activeSession && (
        <div className="chat-panel-tabs">
          <button
            className={`chat-panel-tab${panelTab === 'chat' ? ' active' : ''}`}
            onClick={() => setPanelTab('chat')}
          >Chat</button>
          <button
            className={`chat-panel-tab${panelTab === 'files' ? ' active' : ''}`}
            onClick={() => setPanelTab('files')}
          >
            Changed Files
            {activeSession.changedFiles.length > 0 && (
              <span className="chat-files-badge">{activeSession.changedFiles.length}</span>
            )}
          </button>
          {editingTitle ? (
            <input
              ref={titleInputRef}
              className="chat-title-input"
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditingTitle(false) }}
            />
          ) : (
            <button className="chat-rename-btn" onClick={startEditTitle} title="Rename thread">✎</button>
          )}
        </div>
      )}

      {/* Writing indicator */}
      {writingFile && (
        <div className="chat-writing-bar">
          <span className="chat-writing-dot" />
          Writing {writingFile}…
        </div>
      )}

      {/* Chat content */}
      {panelTab === 'chat' && (
        <div className="chat-messages">
          {!activeSession && subscriptions.length > 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">✦</div>
              <div className="chat-empty-text">Start a new thread</div>
              <div className="chat-empty-hint">Press + to create a thread, then type below</div>
            </div>
          )}
          {!activeSession && subscriptions.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">✦</div>
              <div className="chat-empty-text">Connect an AI provider</div>
              <div className="chat-empty-hint">Add your API key to get started</div>
              <button className="chat-connect-btn" onClick={() => setShowSubs(true)}>Connect AI</button>
            </div>
          )}
          {activeSession?.messages.map(msg => (
            <div key={msg.id} className={`chat-msg chat-msg--${msg.role}${msg.isStreaming ? ' chat-msg--streaming' : ''}`}>
              <div className="chat-msg-avatar">
                {msg.role === 'user' ? 'Y' : 'AI'}
              </div>
              <div className="chat-msg-body">
                <div className="chat-msg-label">
                  {msg.role === 'user' ? 'You' : (activeProvider?.name ?? 'Agent')}
                  {msg.isStreaming && <span className="chat-msg-cursor" />}
                </div>
                <div className="chat-msg-content">
                  {msg.content || (msg.isStreaming ? <span className="chat-thinking">Thinking…</span> : '')}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {panelTab === 'files' && (
        <div className="chat-files-list">
          {(activeSession?.changedFiles.length ?? 0) === 0 ? (
            <div className="chat-files-empty">No files changed in this session</div>
          ) : (
            activeSession!.changedFiles.map(f => {
              const name = f.split(/[/\\]/).pop() ?? f
              const openedFile = openFiles.find(of => of.id === f)
              return (
                <button
                  key={f}
                  className="chat-file-item"
                  onClick={() => {
                    if (openedFile) useEditorStore.getState().setActiveFile(f)
                    setPanelTab('chat')
                  }}
                  title={f}
                >
                  <span className="chat-file-icon">📄</span>
                  <span className="chat-file-name">{name}</span>
                  {openedFile?.isDirty && <span className="chat-file-dirty">●</span>}
                </button>
              )
            })
          )}
        </div>
      )}

      {/* Input area */}
      <div className="chat-input-area">
        <div className="chat-input-box">
          <textarea
            className="chat-input"
            placeholder="Tell the agent what to build. Shift+Enter for newline."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={isStreaming}
          />
          <div className="chat-input-pills">
            {activeSession && (
              <button
                className={`chat-pill${pendingScheduled.length > 0 ? ' chat-sched-active' : ''}`}
                onClick={() => setShowScheduler(v => !v)}
                title="Schedule message"
              >
                ⧗ {pendingScheduled.length > 0 ? `${pendingScheduled.length} scheduled` : 'Schedule'}
              </button>
            )}
            {activeProvider && (
              <select
                className="chat-pill"
                style={{ border: 'none', background: 'none', cursor: 'pointer', paddingLeft: 0 }}
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                title="Select model"
              >
                {activeProvider.models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
            {!activeProvider && subscriptions.length > 0 && (
              <span style={{ fontSize: 11, opacity: 0.5 }}>{modelName || 'No model'}</span>
            )}
            <button
              className={`chat-follow-btn chat-pill${autoFollow ? ' active' : ''}`}
              onClick={() => setAutoFollow(v => !v)}
              title={autoFollow ? 'Auto-follow on' : 'Auto-follow off'}
              style={{ marginLeft: 0 }}
            >
              ↕ Follow
            </button>
            {isStreaming ? (
              <button className="chat-pill-stop" onClick={cancelStream}>■ Stop</button>
            ) : (
              <button className="chat-pill-send" onClick={sendMessage} disabled={!input.trim()}>
                Send ↑
              </button>
            )}
          </div>
        </div>
      </div>

      {showSubs && <SubscriptionModal onClose={() => setShowSubs(false)} />}
      {showScheduler && activeSession && (
        <SchedulerPopup
          sessionId={activeSession.id}
          onClose={() => setShowScheduler(false)}
        />
      )}
    </div>
  )
}
