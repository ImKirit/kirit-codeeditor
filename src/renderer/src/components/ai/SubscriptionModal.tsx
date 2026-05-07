import { useState } from 'react'
import { useAIStore } from '../../store/ai'
import { PROVIDERS, type ProviderId } from '../../../../shared/types'
import './SubscriptionModal.css'

interface Props {
  onClose: () => void
}

type Step = 'list' | 'chooseProvider' | 'connect'
type ConnectMode = 'account' | 'apikey'

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

// Providers that support account-based login (browser OAuth)
const ACCOUNT_LOGIN_SUPPORTED: Partial<Record<ProviderId, true>> = {
  claude: true,
  copilot: true
}

const ACCOUNT_LOGIN_DESC: Partial<Record<ProviderId, string>> = {
  claude: 'Sign in with your Claude account and use your subscription limits — no API billing.',
  copilot: 'Sign in with GitHub to use your Copilot subscription.'
}

const KEY_PLACEHOLDERS: Record<ProviderId, string> = {
  claude: 'sk-ant-api03-...',
  openai: 'sk-proj-...',
  gemini: 'AIza...',
  copilot: 'ghp_...'
}

const API_KEY_URLS: Partial<Record<ProviderId, string>> = {
  claude: 'https://console.anthropic.com/settings/keys',
  openai: 'https://platform.openai.com/api-keys',
  gemini: 'https://aistudio.google.com/app/apikey',
  copilot: 'https://github.com/settings/tokens'
}

export function SubscriptionModal({ onClose }: Props): JSX.Element {
  const { subscriptions, addSubscription, removeSubscription } = useAIStore()
  const [step, setStep] = useState<Step>('list')
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('claude')
  const [mode, setMode] = useState<ConnectMode>('account')
  const [label, setLabel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const goConnect = (provider: ProviderId) => {
    setSelectedProvider(provider)
    setLabel(PROVIDERS.find(p => p.id === provider)?.name ?? provider)
    setApiKey('')
    setErr('')
    setMode(ACCOUNT_LOGIN_SUPPORTED[provider] ? 'account' : 'apikey')
    setStep('connect')
  }

  const handleAccountLogin = async () => {
    setSaving(true)
    setErr('')
    try {
      const token = await window.api.auth.login(selectedProvider)
      if (!token) {
        setErr('Login cancelled or failed. Try again.')
        return
      }
      await addSubscription({
        provider: selectedProvider,
        label: label.trim() || (PROVIDERS.find(p => p.id === selectedProvider)?.name ?? selectedProvider),
        authType: 'account',
        sessionToken: token
      })
      setStep('list')
    } catch (e) {
      setErr(String(e))
    } finally {
      setSaving(false)
    }
  }

  const handleApiKey = async () => {
    if (!label.trim()) { setErr('Label is required'); return }
    if (!apiKey.trim()) { setErr('API key is required'); return }
    setSaving(true)
    setErr('')
    try {
      await addSubscription({
        provider: selectedProvider,
        label: label.trim(),
        authType: 'apikey',
        apiKey: apiKey.trim()
      })
      setStep('list')
    } catch (e) {
      setErr(String(e))
    } finally {
      setSaving(false)
    }
  }

  const providerInfo = PROVIDERS.find(p => p.id === selectedProvider)
  const iconColor = PROVIDER_COLORS[selectedProvider]
  const supportsAccountLogin = !!ACCOUNT_LOGIN_SUPPORTED[selectedProvider]

  const backTarget = (): Step => step === 'connect' ? 'chooseProvider' : 'list'

  return (
    <div className="sub-overlay" onMouseDown={onClose}>
      <div className="sub-modal" onMouseDown={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sub-header">
          <button
            className="sub-back"
            style={{ visibility: step === 'list' ? 'hidden' : 'visible' }}
            onClick={() => setStep(backTarget())}
          >←</button>
          <span className="sub-title">
            {step === 'list' ? 'AI Accounts'
              : step === 'chooseProvider' ? 'Choose Provider'
              : `Connect ${providerInfo?.name}`}
          </span>
          <button className="sub-close" onClick={onClose}>✕</button>
        </div>

        {/* Step: List */}
        {step === 'list' && (
          <div className="sub-body">
            {subscriptions.length === 0 && (
              <div className="sub-empty">
                <div className="sub-empty-icon">⬡</div>
                <div className="sub-empty-text">No AI accounts connected</div>
                <div className="sub-empty-hint">Connect a provider to start using AI</div>
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
                    <div className="sub-card-provider">
                      {info?.name ?? s.provider}
                      {' · '}
                      <span className={`sub-card-auth-badge sub-card-auth-badge--${s.authType ?? 'apikey'}`}>
                        {s.authType === 'account' ? 'Account' : 'API Key'}
                      </span>
                    </div>
                  </div>
                  <button className="sub-card-remove" onClick={() => removeSubscription(s.id)}>
                    Disconnect
                  </button>
                </div>
              )
            })}
            <button className="sub-btn-add-new" onClick={() => setStep('chooseProvider')}>
              + Connect Account
            </button>
          </div>
        )}

        {/* Step: Choose provider */}
        {step === 'chooseProvider' && (
          <div className="sub-body">
            <div className="sub-provider-hint">Select an AI provider to connect</div>
            <div className="sub-provider-grid">
              {PROVIDERS.map(p => (
                <button key={p.id} className="sub-provider-card" onClick={() => goConnect(p.id)}>
                  <div className="sub-provider-icon" style={{ color: PROVIDER_COLORS[p.id] }}>
                    {PROVIDER_ICONS[p.id]}
                  </div>
                  <div className="sub-provider-name">{p.name}</div>
                  {ACCOUNT_LOGIN_SUPPORTED[p.id] && (
                    <div className="sub-provider-badge">Account</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Connect */}
        {step === 'connect' && (
          <div className="sub-body">
            <div className="sub-connect-header">
              <div className="sub-connect-icon" style={{ color: iconColor }}>
                {PROVIDER_ICONS[selectedProvider]}
              </div>
              <div>
                <div className="sub-connect-name">{providerInfo?.name}</div>
                <div className="sub-connect-sub">Choose how to connect</div>
              </div>
            </div>

            {/* Mode tabs — only shown if provider supports both */}
            {supportsAccountLogin && (
              <div className="sub-mode-tabs">
                <button
                  className={`sub-mode-tab${mode === 'account' ? ' active' : ''}`}
                  onClick={() => { setMode('account'); setErr('') }}
                >
                  Account Login
                  <span className="sub-mode-recommended">Recommended</span>
                </button>
                <button
                  className={`sub-mode-tab${mode === 'apikey' ? ' active' : ''}`}
                  onClick={() => { setMode('apikey'); setErr('') }}
                >
                  API Key
                </button>
              </div>
            )}

            {/* Account login mode */}
            {mode === 'account' && (
              <div className="sub-account-body">
                <div className="sub-account-desc">
                  {ACCOUNT_LOGIN_DESC[selectedProvider] ?? 'Sign in with your account.'}
                </div>
                <div className="sub-field">
                  <label className="sub-label">Account name</label>
                  <input
                    className="sub-input"
                    placeholder={`e.g. "${providerInfo?.name} — personal"`}
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    autoFocus
                  />
                </div>
                {err && <div className="sub-err">{err}</div>}
                <button
                  className="sub-signin-btn"
                  style={{ background: iconColor }}
                  onClick={handleAccountLogin}
                  disabled={saving}
                >
                  {saving
                    ? 'Opening browser…'
                    : selectedProvider === 'copilot'
                      ? '↗ Sign in with GitHub'
                      : `↗ Sign in to ${providerInfo?.name}`}
                </button>
                <div className="sub-account-note">
                  A browser window will open — sign in, then return here.
                </div>
              </div>
            )}

            {/* API key mode */}
            {mode === 'apikey' && (
              <div className="sub-form">
                <div className="sub-field">
                  <label className="sub-label">Label</label>
                  <input
                    className="sub-input"
                    placeholder={`e.g. "${providerInfo?.name} — personal"`}
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    autoFocus={!supportsAccountLogin}
                  />
                </div>
                <div className="sub-field">
                  <label className="sub-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>API Key</span>
                    {API_KEY_URLS[selectedProvider] && (
                      <button
                        className="sub-key-link-btn"
                        type="button"
                        onClick={() => window.open(API_KEY_URLS[selectedProvider])}
                      >
                        Get API Key →
                      </button>
                    )}
                  </label>
                  <input
                    className="sub-input"
                    type="password"
                    placeholder={KEY_PLACEHOLDERS[selectedProvider]}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleApiKey() }}
                    autoFocus={!supportsAccountLogin}
                  />
                  <div className="sub-key-hint">
                    Stored locally in your OS keychain. Never leaves this device.
                  </div>
                </div>
                {err && <div className="sub-err">{err}</div>}
                <button
                  className="sub-btn-connect"
                  style={{ background: iconColor }}
                  onClick={handleApiKey}
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
