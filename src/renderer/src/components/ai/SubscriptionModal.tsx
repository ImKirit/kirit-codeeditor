import { useState } from 'react'
import { useAIStore } from '../../store/ai'
import { PROVIDERS, type ProviderId } from '../../../../shared/types'
import './SubscriptionModal.css'

interface Props {
  onClose: () => void
}

type Step = 'list' | 'chooseProvider' | 'connect'
type AuthMode = 'oauth' | 'apikey'

const PROVIDER_ICONS: Record<ProviderId, string> = {
  claude: '⬡',
  openai: '◎',
  gemini: '✦',
  copilot: '⊕'
}

const PROVIDER_COLORS: Record<ProviderId, string> = {
  claude: '#d4890a',
  openai: '#10a37f',
  gemini: '#4285f4',
  copilot: '#2ea043'
}

const API_KEY_LINKS: Partial<Record<ProviderId, string>> = {
  claude: 'console.anthropic.com/settings/keys',
  openai: 'platform.openai.com/api-keys',
  gemini: 'aistudio.google.com/app/apikey',
  copilot: 'github.com/settings/tokens'
}

const OAUTH_AVAILABLE: Partial<Record<ProviderId, boolean>> = {
  copilot: true
}

export function SubscriptionModal({ onClose }: Props): JSX.Element {
  const { subscriptions, addSubscription, removeSubscription } = useAIStore()
  const [step, setStep] = useState<Step>('list')
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('claude')
  const [authMode, setAuthMode] = useState<AuthMode>('apikey')
  const [label, setLabel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const goConnect = (provider: ProviderId) => {
    setSelectedProvider(provider)
    setLabel(PROVIDERS.find(p => p.id === provider)?.name ?? provider)
    setApiKey('')
    setErr('')
    setAuthMode(OAUTH_AVAILABLE[provider] ? 'oauth' : 'apikey')
    setStep('connect')
  }

  const handleAdd = async () => {
    if (!label.trim()) { setErr('Label is required'); return }
    if (!apiKey.trim()) { setErr('API key is required'); return }
    setSaving(true)
    setErr('')
    try {
      await addSubscription({ provider: selectedProvider, label: label.trim(), apiKey: apiKey.trim() })
      setStep('list')
    } catch (e) {
      setErr(String(e))
    } finally {
      setSaving(false)
    }
  }

  const providerInfo = PROVIDERS.find(p => p.id === selectedProvider)
  const iconColor = PROVIDER_COLORS[selectedProvider]

  return (
    <div className="sub-overlay" onMouseDown={onClose}>
      <div className="sub-modal" onMouseDown={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sub-header">
          <button
            className="sub-back"
            style={{ visibility: step === 'list' ? 'hidden' : 'visible' }}
            onClick={() => setStep(step === 'connect' ? 'chooseProvider' : 'list')}
          >
            ←
          </button>
          <span className="sub-title">
            {step === 'list' ? 'AI Subscriptions'
              : step === 'chooseProvider' ? 'Choose Provider'
              : `Sign in to ${providerInfo?.name}`}
          </span>
          <button className="sub-close" onClick={onClose}>✕</button>
        </div>

        {/* Step: List */}
        {step === 'list' && (
          <div className="sub-body">
            {subscriptions.length === 0 && (
              <div className="sub-empty">
                <div className="sub-empty-icon">⬡</div>
                <div className="sub-empty-text">No AI subscriptions yet</div>
              </div>
            )}
            {subscriptions.map(s => {
              const info = PROVIDERS.find(p => p.id === s.provider)
              const icon = PROVIDER_ICONS[s.provider as ProviderId] ?? '◆'
              const color = PROVIDER_COLORS[s.provider as ProviderId] ?? '#666'
              return (
                <div key={s.id} className="sub-card">
                  <div className="sub-card-icon" style={{ color }}>{icon}</div>
                  <div className="sub-card-info">
                    <div className="sub-card-label">{s.label}</div>
                    <div className="sub-card-provider">{info?.name ?? s.provider}</div>
                  </div>
                  <button
                    className="sub-card-remove"
                    onClick={() => removeSubscription(s.id)}
                  >
                    Remove
                  </button>
                </div>
              )
            })}
            <button
              className="sub-btn-add-new"
              onClick={() => setStep('chooseProvider')}
            >
              + Add Account
            </button>
          </div>
        )}

        {/* Step: Choose provider */}
        {step === 'chooseProvider' && (
          <div className="sub-body">
            <div className="sub-provider-hint">Select an AI provider to connect</div>
            <div className="sub-provider-grid">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  className="sub-provider-card"
                  onClick={() => goConnect(p.id)}
                >
                  <div
                    className="sub-provider-icon"
                    style={{ color: PROVIDER_COLORS[p.id] }}
                  >
                    {PROVIDER_ICONS[p.id]}
                  </div>
                  <div className="sub-provider-name">{p.name}</div>
                  {OAUTH_AVAILABLE[p.id] && (
                    <div className="sub-provider-badge">OAuth</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Connect */}
        {step === 'connect' && (
          <div className="sub-body">
            <div className="sub-provider-header">
              <div className="sub-provider-icon-lg" style={{ color: iconColor }}>
                {PROVIDER_ICONS[selectedProvider]}
              </div>
              <span className="sub-provider-name-lg">{providerInfo?.name}</span>
            </div>

            {/* Auth mode tabs */}
            {OAUTH_AVAILABLE[selectedProvider] && (
              <div className="sub-auth-tabs">
                <button
                  className={`sub-auth-tab${authMode === 'oauth' ? ' active' : ''}`}
                  onClick={() => setAuthMode('oauth')}
                >
                  Sign In
                </button>
                <button
                  className={`sub-auth-tab${authMode === 'apikey' ? ' active' : ''}`}
                  onClick={() => setAuthMode('apikey')}
                >
                  API Key
                </button>
              </div>
            )}

            {authMode === 'oauth' && (
              <div className="sub-oauth">
                <p className="sub-oauth-desc">
                  Sign in with your GitHub account to use GitHub Copilot.
                  You need an active Copilot subscription.
                </p>
                <button
                  className="sub-oauth-btn"
                  style={{ background: PROVIDER_COLORS[selectedProvider] }}
                  onClick={() => {
                    // OAuth flow placeholder — switch to API key with a note
                    setAuthMode('apikey')
                    setErr('GitHub OAuth requires app registration. Use your Copilot API token instead (run: gh auth token)')
                  }}
                >
                  <span>Sign in with GitHub</span>
                </button>
                <button className="sub-link" onClick={() => setAuthMode('apikey')}>
                  Use API key instead
                </button>
              </div>
            )}

            {authMode === 'apikey' && (
              <div className="sub-form">
                <div className="sub-field">
                  <label className="sub-label">Label</label>
                  <input
                    className="sub-input"
                    placeholder={`e.g. "${providerInfo?.name} — personal"`}
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="sub-field">
                  <label className="sub-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>API Key</span>
                    {API_KEY_LINKS[selectedProvider] && (
                      <button
                        className="sub-key-link-btn"
                        onClick={() => window.open(`https://${API_KEY_LINKS[selectedProvider]}`)}
                        type="button"
                      >
                        Get API Key →
                      </button>
                    )}
                  </label>
                  <input
                    className="sub-input"
                    type="password"
                    placeholder={selectedProvider === 'claude' ? 'sk-ant-...' : selectedProvider === 'openai' ? 'sk-...' : 'Your API key'}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                  />
                  <div className="sub-key-hint">
                    Your API key is stored locally and never sent anywhere except the provider.
                  </div>
                </div>
                {err && <div className="sub-err">{err}</div>}
                <button
                  className="sub-btn-connect"
                  style={{ background: PROVIDER_COLORS[selectedProvider] }}
                  onClick={handleAdd}
                  disabled={saving}
                >
                  {saving ? 'Connecting…' : 'Connect'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
