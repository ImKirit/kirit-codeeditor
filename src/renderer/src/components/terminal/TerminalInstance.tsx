import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

interface Props {
  /** Stable React key / component identity — not the PTY ID */
  instanceKey: string
  active: boolean
  onExit: (key: string) => void
}

export function TerminalInstance({ instanceKey, active, onExit }: Props): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const ptyIdRef = useRef<string | null>(null)
  const cleanupRef = useRef<Array<() => void>>([])

  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false

    const xterm = new Terminal({
      theme: {
        background: '#1a1a1a',
        foreground: '#cccccc',
        cursor: '#ffffff',
        selectionBackground: 'rgba(14, 99, 156, 0.35)',
        black: '#1e1e1e',
        red: '#f44747',
        green: '#4ec9b0',
        yellow: '#dcdcaa',
        blue: '#569cd6',
        magenta: '#c586c0',
        cyan: '#4ec9b0',
        white: '#d4d4d4',
        brightBlack: '#555555',
        brightRed: '#f44747',
        brightGreen: '#6a9955',
        brightYellow: '#dcdcaa',
        brightBlue: '#569cd6',
        brightMagenta: '#c586c0',
        brightCyan: '#4fc1ff',
        brightWhite: '#ffffff'
      },
      fontFamily: "'Cascadia Code', 'JetBrains Mono', Consolas, 'Courier New', monospace",
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 5000,
      allowTransparency: true,
      allowProposedApi: true
    })

    const fitAddon = new FitAddon()
    xterm.loadAddon(fitAddon)
    xterm.loadAddon(new WebLinksAddon())
    xterm.open(containerRef.current)

    xtermRef.current = xterm
    fitRef.current = fitAddon

    requestAnimationFrame(() => {
      if (destroyed) return
      fitAddon.fit()
      const { cols, rows } = xterm

      window.api.terminal
        .create({ cols, rows })
        .then((ptyId) => {
          if (destroyed) {
            window.api.terminal.kill(ptyId)
            return
          }
          ptyIdRef.current = ptyId

          const inputDispose = xterm.onData((data) => window.api.terminal.write(ptyId, data))
          const resizeDispose = xterm.onResize(({ cols, rows }) =>
            window.api.terminal.resize(ptyId, cols, rows)
          )
          const offData = window.api.terminal.onData(ptyId, (data) => xterm.write(data))
          const offExit = window.api.terminal.onExit(ptyId, () => {
            xterm.write('\r\n\x1b[90m[Process exited]\x1b[0m\r\n')
            onExit(instanceKey)
          })

          cleanupRef.current.push(
            () => inputDispose.dispose(),
            () => resizeDispose.dispose(),
            offData,
            offExit
          )
        })
        .catch(console.error)
    })

    return () => {
      destroyed = true
      cleanupRef.current.forEach((fn) => fn())
      cleanupRef.current = []
      if (ptyIdRef.current) {
        window.api.terminal.kill(ptyIdRef.current)
        ptyIdRef.current = null
      }
      xterm.dispose()
      xtermRef.current = null
      fitRef.current = null
    }
  }, [instanceKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fit when the tab becomes active or container resizes
  useEffect(() => {
    if (!active || !fitRef.current) return
    const fit = (): void => {
      if (!fitRef.current) return
      try {
        fitRef.current.fit()
      } catch {
        /* panel not visible yet */
      }
    }
    fit()
    const ro = new ResizeObserver(fit)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [active])

  // Focus when tab becomes active
  useEffect(() => {
    if (active) {
      setTimeout(() => xtermRef.current?.focus(), 50)
    }
  }, [active])

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: active ? 'flex' : 'none',
        padding: '4px 6px',
        minHeight: 0,
        boxSizing: 'border-box'
      }}
    />
  )
}
