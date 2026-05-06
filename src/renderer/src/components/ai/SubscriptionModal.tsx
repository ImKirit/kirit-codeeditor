import { useState } from 'react'
import { useAIStore } from '../../store/ai'
import { PROVIDERS, type ProviderId } from '../../../../shared/types'
import './SubscriptionModal.css'

interface Props {
  onClose: () => void
}

type Step = 'list' | 'chooseProvider' | 'connect'

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

const SIGN_IN_URLS: Record<ProviderId, string> = {
  claude: 'https://console.anthropic.com/settings/keys',
  openai: 'https://platform.openai.com/api-keys',
  gemini: 'https://aistudio.google.com/app/apikey',
  copilot: 'https://github.com/settings/tokens'
}

const SIGN_IN_LABELS: Record<ProviderId, string> = {
  claude: 'Open Claude Console',
  openai: 'Open OpenAI Platform',
  gemini: 'Open Google AI Studio',
  copilot: 'Open GitHub Settings'
}

const KEY_PLACEHOLDERS: Record<ProviderId, string> = {
  claude: 'sk-ant-api03-...',
  openai: 'sk-proj-...',
  gemini: 'AIza...',
  copilot: 'ghp_...'
}

export function SubscriptionModal({ onClose }: Props): JSX.Element {
  const { subscriptions, addSubscription, removeSubscription } = useAIStore()
  const [step, setStep] = useState<Step>('list')
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('claude')
  const [label, setLabel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [browserOpened, setBrowserOpened] = useState(false)

  const goConnect = (provider: ProviderId) => {
    setSelectedProvider(provider)
    setLabel(PROVIDERS.find(p => p.id === provider)?.name ?? provider)
    setApiKey('')
    setErr('')
    setBrowserOpened(false)
    setStep('connect')
  }

  const handleOpenBrowser = () => {
    window.open(SIGN_IN_URLS[selectedProvider])
    setBrowserOpened(true)
  }

  const handleAdd = async () => {
    if (!label.trim()) { setErr('Label is required'); return }
    if (!apiKey.trim()) { setErr('API key is required'); return }
    setSaving(true)
    setErr('')
    try {
      await addSubscription({ provider: selectedProvider, label: label.trim(), apiKey: apiKey.trim() })
      setStep('list')
      setBrowserOpened(false)
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
                <div className="sub-empty-hint">Connect an AI provider to start coding with AI</div>
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
                    <div className="sub-card-provider">{info?.name ?? s.provider} · Connected</div>
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
                <div className="sub-connect-sub">Sign in to connect your account</div>
              </div>
            </div>

            {/* Step 1: Open browser */}
            <div className="sub-step">
              <div className="sub-step-num">1</div>
              <div className="sub-step-body">
                <div className="sub-step-title">Sign in to get your API key</div>
                <div className="sub-step-desc">
                  {browserOpened
                    ? 'Browser opened — create or copy an API key, then paste it below.'
                    : `Opens ${providerInfo?.name} in your browser where you can create or copy an API key.`}
                </div>
                <button
                  className="sub-signin-btn"
                  style={{ background: iconColor }}
                  onClick={handleOpenBrowser}
                >
                  {browserOpened ? '↗ Reopen' : `↗ ${SIGN_IN_LABELS[selectedProvider]}`}
                </button>
              </div>
            </div>

            {/* Step 2: Paste key */}
            <div className={`sub-step${!browserOpened ? ' sub-step--dim' : ''}`}>
              <div className="sub-step-num">2</div>
              <div className="sub-step-body">
                <div className="sub-step-title">Paste your API key</div>
                <div className="sub-field">
                  <label className="sub-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Account name</span>
                  </label>
                  <input
                    className="sub-input"
                    placeholder={`e.g. "${providerInfo?.name} — personal"`}
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    disabled={!browserOpened}
                  />
                </div>
                <div className="sub-field">
                  <label className="sub-label">API Key</label>
                  <input
                    className="sub-input"
                    type="password"
                    placeholder={browserOpened ? KEY_PLACEHOLDERS[selectedProvider] : 'Open browser first →'}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                    disabled={!browserOpened}
                    autoFocus={browserOpened}
                  />
                  <div className="sub-key-hint">
                    Your key is stored locally in your OS keychain and never leaves this device.
                  </div>
                </div>
              </div>
            </div>

            {err && <div className="sub-err">{err}</div>}

            <button
              className="sub-btn-connect"
              style={{ background: browserOpened ? iconColor : undefined }}
              onClick={handleAdd}
              disabled={saving || !browserOpened || !apiKey.trim()}
            >
              {saving ? 'Connecting…' : 'Connect Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
