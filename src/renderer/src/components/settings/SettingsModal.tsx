import { useSettingsStore } from '../../store/settings'
import { THEMES } from '../../themes/themes'
import './SettingsModal.css'

interface Props {
  onClose: () => void
}

export function SettingsModal({ onClose }: Props): JSX.Element {
  const {
    theme, fontSize, wordWrap, minimap, autoSave, tabSize,
    setTheme, setFontSize, setWordWrap, setMinimap, setAutoSave, setTabSize
  } = useSettingsStore()

  return (
    <div className="settings-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="settings-modal">
        <div className="settings-header">
          <span>Settings</span>
          <button className="settings-close" onClick={onClose}>×</button>
        </div>

        <div className="settings-body">
          {/* Theme */}
          <section className="settings-section">
            <div className="settings-section-title">Appearance</div>

            <div className="settings-row">
              <label className="settings-label">Color Theme</label>
              <div className="settings-theme-grid">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    className={`settings-theme-btn${theme === t.id ? ' active' : ''}`}
                    onClick={() => setTheme(t.id)}
                  >
                    <ThemePreview vars={t.vars} />
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-row">
              <label className="settings-label">Font Size</label>
              <div className="settings-inline">
                <input
                  type="range"
                  className="settings-slider"
                  min={10}
                  max={20}
                  value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))}
                />
                <span className="settings-value">{fontSize}px</span>
              </div>
            </div>

            <div className="settings-row">
              <label className="settings-label">Minimap</label>
              <Toggle value={minimap} onChange={setMinimap} />
            </div>
          </section>

          {/* Editor */}
          <section className="settings-section">
            <div className="settings-section-title">Editor</div>

            <div className="settings-row">
              <label className="settings-label">Word Wrap</label>
              <Toggle value={wordWrap} onChange={setWordWrap} />
            </div>

            <div className="settings-row">
              <label className="settings-label">Tab Size</label>
              <select
                className="settings-select"
                value={tabSize}
                onChange={e => setTabSize(Number(e.target.value))}
              >
                {[2, 4, 8].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="settings-row">
              <label className="settings-label">Auto Save</label>
              <Toggle value={autoSave} onChange={setAutoSave} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }): JSX.Element {
  return (
    <button
      className={`settings-toggle${value ? ' on' : ''}`}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    >
      <span className="settings-toggle-thumb" />
    </button>
  )
}

function ThemePreview({ vars }: { vars: Record<string, string> }): JSX.Element {
  return (
    <div
      className="theme-preview"
      style={{
        background: vars['--kode-bg'],
        borderColor: vars['--kode-border'],
      }}
    >
      <div className="theme-preview-bar" style={{ background: vars['--kode-surface'] }}>
        <div style={{ background: vars['--kode-accent'], borderRadius: 2, width: 24, height: 4 }} />
      </div>
      <div className="theme-preview-content">
        <div style={{ background: vars['--kode-surface'], width: 20, height: '100%', borderRight: `1px solid ${vars['--kode-border']}` }} />
        <div style={{ flex: 1, padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {['--kode-accent', '--kode-text', '--kode-text-dim'].map(v => (
            <div key={v} style={{ background: vars[v], height: 3, borderRadius: 2, opacity: 0.8, width: v === '--kode-accent' ? '60%' : v === '--kode-text' ? '100%' : '75%' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
