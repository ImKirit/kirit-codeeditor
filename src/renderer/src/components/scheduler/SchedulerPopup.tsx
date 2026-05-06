import { useState } from 'react'
import { useSchedulerStore } from '../../store/scheduler'
import './SchedulerPopup.css'

interface Props {
  sessionId: string
  onClose: () => void
}

export function SchedulerPopup({ sessionId, onClose }: Props): JSX.Element {
  const { messages, schedule, cancel } = useSchedulerStore()
  const [prompt, setPrompt] = useState('')
  const [timeStr, setTimeStr] = useState(() => {
    const d = new Date(Date.now() + 5 * 60000)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })

  const pending = messages.filter(m => m.sessionId === sessionId && !m.fired)

  const handleSchedule = () => {
    const [h, m] = timeStr.split(':').map(Number)
    const fireAt = new Date()
    fireAt.setHours(h, m, 0, 0)
    if (fireAt.getTime() <= Date.now()) fireAt.setDate(fireAt.getDate() + 1)
    schedule(sessionId, prompt.trim(), fireAt.getTime())
    setPrompt('')
    onClose()
  }

  return (
    <div className="sched-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sched-popup">
        <div className="sched-header">
          <span>Schedule Message</span>
          <button className="sched-close" onClick={onClose}>×</button>
        </div>

        <div className="sched-body">
          {pending.length > 0 && (
            <div className="sched-list">
              {pending.map(m => (
                <div key={m.id} className="sched-item">
                  <span className="sched-item-time">⧗ {new Date(m.fireAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="sched-item-text">{m.prompt}</span>
                  <button className="sched-item-cancel" onClick={() => cancel(m.id)}>×</button>
                </div>
              ))}
            </div>
          )}

          <div className="sched-form">
            <label className="sched-label">Send at</label>
            <input
              type="time"
              className="sched-time-input"
              value={timeStr}
              onChange={e => setTimeStr(e.target.value)}
            />
            <label className="sched-label">Message</label>
            <textarea
              className="sched-msg-input"
              placeholder="Prompt to send automatically…"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={3}
            />
            <button
              className="sched-btn"
              onClick={handleSchedule}
              disabled={!prompt.trim() || !timeStr}
            >
              Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
