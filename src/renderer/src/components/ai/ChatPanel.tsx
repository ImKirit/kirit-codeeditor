import { useEffect, useRef, useState } from 'react'
import { useAIStore } from '../../store/ai'
import { PROVIDERS, type Session, type Subscription } from '../../../../shared/types'
import { SubscriptionModal } from './SubscriptionModal'
import './ChatPanel.css'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function ChatPanel(): JSX.Element {
  const {
    sessions, activeSessionId, subscriptions,
    createSession, setActiveSession, addMessage, loadSubscriptions
  } = useAIStore()

  const [showSubs, setShowSubs] = useState(false)
  const [input, setInput] = useState('')
  const [selectedSubId, setSelectedSubId] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null

  useEffect(() => {
    loadSubscriptions()
  }, [loadSubscriptions])

  // Default selection when subscriptions load
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

  const getOrCreateSession = (): Session => {
    if (activeSession) return activeSession
    const sub = subscriptions.find(s => s.id === selectedSubId) ?? subscriptions[0]
    if (!sub) throw new Error('No subscription')
    const provider = PROVIDERS.find(p => p.id === sub.provider)
    const model = selectedModel || provider?.models[0]?.id || 'unknown'
    return createSession({ provider: sub.provider, model, subscriptionId: sub.id })
  }

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return
    if (subscriptions.length === 0) { setShowSubs(true); return }

    let session: Session
    try { session = getOrCreateSession() } catch { setShowSubs(true); return }

    setInput('')

    addMessage(session.id, {
      id: uid(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    })

    // Placeholder until Phase 8 wires up actual AI
    setTimeout(() => {
        const providerName = PROVIDERS.find(p => p.id === session.provider)?.name ?? session.provider
      addMessage(session.id, {
        id: uid(),
        role: 'assistant',
        content: `[${providerName} · ${session.model}] AI integration coming in the next phase. Your message was: "${text}"`,
        timestamp: Date.now()
      })
    }, 200)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      sendMessage()
    }
  }

  const activeSub: Subscription | undefined = subscriptions.find(s => s.id === selectedSubId)
  const activeProvider = activeSub ? PROVIDERS.find(p => p.id === activeSub.provider) : undefined

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-selectors">
          {subscriptions.length > 0 ? (
            <>
              <select
                className="chat-select"
                value={selectedSubId}
                onChange={e => {
                  setSelectedSubId(e.target.value)
                  const sub = subscriptions.find(s => s.id === e.target.value)
                  const prov = PROVIDERS.find(p => p.id === sub?.provider)
                  if (prov?.models[0]) setSelectedModel(prov.models[0].id)
                }}
              >
                {subscriptions.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              {activeProvider && (
                <select
                  className="chat-select"
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                >
                  {activeProvider.models.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              )}
            </>
          ) : (
            <span className="chat-no-sub">No subscription</span>
          )}
        </div>
        <button className="chat-header-btn" onClick={() => setShowSubs(true)} title="Manage subscriptions">
          ⚙
        </button>
      </div>

      {/* Session tabs */}
      {sessions.length > 1 && (
        <div className="chat-session-tabs">
          {sessions.map(s => (
            <button
              key={s.id}
              className={`chat-session-tab${s.id === activeSessionId ? ' active' : ''}`}
              onClick={() => setActiveSession(s.id)}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {!activeSession && subscriptions.length > 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">&#9670;</div>
            <div className="chat-empty-text">Start a conversation</div>
            <div className="chat-empty-hint">Ctrl+Enter to send</div>
          </div>
        )}
        {!activeSession && subscriptions.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">&#9670;</div>
            <div className="chat-empty-text">Connect an AI provider</div>
            <button className="chat-connect-btn" onClick={() => setShowSubs(true)}>
              Add Subscription
            </button>
          </div>
        )}
        {activeSession?.messages.map(msg => (
          <div key={msg.id} className={`chat-msg chat-msg--${msg.role}`}>
            <div className="chat-msg-label">
              {msg.role === 'user' ? 'You' : (activeProvider?.name ?? 'Assistant')}
            </div>
            <div className="chat-msg-content">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <textarea
          className="chat-input"
          placeholder="Ask anything… (Ctrl+Enter to send)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
        />
        <button
          className="chat-send-btn"
          onClick={sendMessage}
          disabled={!input.trim()}
        >
          ↑
        </button>
      </div>

      {showSubs && <SubscriptionModal onClose={() => setShowSubs(false)} />}
    </div>
  )
}
