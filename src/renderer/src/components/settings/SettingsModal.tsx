import { useSettingsStore } from '../../store/settings'
import { THEMES } from '../../themes/themes'
import './SettingsModal.css'

interface Props {
  onClose: () => void
}

export function SettingsModal({ onClose }: Props): JSX.Element {
  const {
    theme, customMain, customAccent, fontSize, wordWrap, minimap, autoSave, tabSize,
    setTheme, setCustomColors, setFontSize, setWordWrap, setMinimap, setAutoSave, setTabSize
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
                    <ThemePreview vars={t.vars} isCustom={t.id === 'custom'} customMain={customMain} customAccent={customAccent} />
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {theme === 'custom' && (
              <div className="settings-custom-colors">
                <div className="settings-color-row">
                  <label className="settings-label">Background Color</label>
                  <div className="settings-color-pick">
                    <input
                      type="color"
                      value={customMain}
                      onChange={e => setCustomColors(e.target.value, customAccent)}
                      className="settings-color-input"
                    />
                    <span className="settings-color-val">{customMain}</span>
                  </div>
                </div>
                <div className="settings-color-row">
                  <label className="settings-label">Accent Color</label>
                  <div className="settings-color-pick">
                    <input
                      type="color"
                      value={customAccent}
                      onChange={e => setCustomColors(customMain, e.target.value)}
                      className="settings-color-input"
                    />
                    <span className="settings-color-val">{customAccent}</span>
                  </div>
                </div>
              </div>
            )}

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

function ThemePreview({ vars, isCustom, customMain, customAccent }: { vars: Record<string, string>; isCustom?: boolean; customMain?: string; customAccent?: string }): JSX.Element {
  const bg = isCustom ? (customMain ?? vars['--kode-bg']) : vars['--kode-bg']
  const surface = vars['--kode-surface']
  const accent = isCustom ? (customAccent ?? vars['--kode-accent']) : vars['--kode-accent']
  const border = vars['--kode-border']
  const text = vars['--kode-text']
  const textDim = vars['--kode-text-dim']

  return (
    <div className="theme-preview" style={{ background: bg, borderColor: border }}>
      <div className="theme-preview-bar" style={{ background: surface }}>
        <div style={{ background: accent, borderRadius: 2, width: 24, height: 4 }} />
      </div>
      <div className="theme-preview-content">
        <div style={{ background: surface, width: 20, height: '100%', borderRight: `1px solid ${border}` }} />
        <div style={{ flex: 1, padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ background: accent, height: 3, borderRadius: 2, opacity: 0.8, width: '60%' }} />
          <div style={{ background: text, height: 3, borderRadius: 2, opacity: 0.8, width: '100%' }} />
          <div style={{ background: textDim, height: 3, borderRadius: 2, opacity: 0.8, width: '75%' }} />
        </div>
      </div>
    </div>
  )
}
