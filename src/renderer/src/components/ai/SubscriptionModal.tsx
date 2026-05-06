import { useState } from 'react'
import { useAIStore } from '../../store/ai'
import { PROVIDERS, type ProviderId } from '../../../../shared/types'
import './SubscriptionModal.css'

interface Props {
  onClose: () => void
}

export function SubscriptionModal({ onClose }: Props): JSX.Element {
  const { subscriptions, addSubscription, removeSubscription } = useAIStore()
  const [provider, setProvider] = useState<ProviderId>(PROVIDERS[0].id)
  const [label, setLabel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const handleAdd = async () => {
    if (!label.trim()) { setErr('Label is required'); return }
    if (!apiKey.trim()) { setErr('API key is required'); return }
    setSaving(true)
    setErr('')
    try {
      await addSubscription({ provider, label: label.trim(), apiKey: apiKey.trim() })
      setLabel('')
      setApiKey('')
    } catch (e) {
      setErr(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="sub-overlay" onMouseDown={onClose}>
      <div className="sub-modal" onMouseDown={e => e.stopPropagation()}>
        <div className="sub-header">
          <span className="sub-title">Manage Subscriptions</span>
          <button className="sub-close" onClick={onClose}>✕</button>
        </div>

        {subscriptions.length > 0 && (
          <div className="sub-list">
            {subscriptions.map(s => {
              const info = PROVIDERS.find(p => p.id === s.provider)
              return (
                <div key={s.id} className="sub-item">
                  <span className="sub-item-label">{s.label}</span>
                  <span className="sub-item-provider">{info?.name ?? s.provider}</span>
                  <button
                    className="sub-item-remove"
                    onClick={() => removeSubscription(s.id)}
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="sub-form">
          <div className="sub-form-title">Add New Subscription</div>
          <div className="sub-field">
            <label className="sub-label">Provider</label>
            <select
              className="sub-select"
              value={provider}
              onChange={e => setProvider(e.target.value as ProviderId)}
            >
              {PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="sub-field">
            <label className="sub-label">Label</label>
            <input
              className="sub-input"
              placeholder='e.g. "Claude — work"'
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
          </div>
          <div className="sub-field">
            <label className="sub-label">API Key</label>
            <input
              className="sub-input"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
          </div>
          {err && <div className="sub-err">{err}</div>}
          <button
            className="sub-btn-add"
            onClick={handleAdd}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Add Subscription'}
          </button>
        </div>
      </div>
    </div>
  )
}
