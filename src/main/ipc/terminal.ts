import { ipcMain, BrowserWindow } from 'electron'
import * as pty from '@lydell/node-pty'

interface TermSession {
  pty: pty.IPty
  dataListener: () => void
  exitListener: () => void
}

const sessions = new Map<string, TermSession>()
let nextId = 1

function getDefaultShell(): string {
  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'cmd.exe'
  }
  return process.env.SHELL || '/bin/bash'
}

function getDefaultArgs(): string[] {
  if (process.platform === 'win32') {
    const shell = getDefaultShell().toLowerCase()
    if (shell.includes('powershell') || shell.includes('pwsh')) return []
    return []
  }
  return []
}

function getCwd(requestedCwd?: string): string {
  if (requestedCwd) return requestedCwd
  return process.env.HOME || process.env.USERPROFILE || process.cwd()
}

export function registerTerminalHandlers(): void {
  ipcMain.handle(
    'terminal:create',
    (event, { cwd, cols, rows }: { cwd?: string; cols: number; rows: number }) => {
      const id = String(nextId++)
      const shell = getDefaultShell()
      const args = getDefaultArgs()
      const workingDir = getCwd(cwd)

      const term = pty.spawn(shell, args, {
        name: 'xterm-256color',
        cols: cols || 80,
        rows: rows || 24,
        cwd: workingDir,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor'
        } as Record<string, string>
      })

      const sender = event.sender

      const dataDispose = term.onData((data) => {
        if (!sender.isDestroyed()) {
          sender.send(`terminal:data:${id}`, data)
        }
      })

      const exitDispose = term.onExit(({ exitCode }) => {
        if (!sender.isDestroyed()) {
          sender.send(`terminal:exit:${id}`, exitCode)
        }
        sessions.delete(id)
      })

      sessions.set(id, {
        pty: term,
        dataListener: () => dataDispose.dispose(),
        exitListener: () => exitDispose.dispose()
      })

      return id
    }
  )

  ipcMain.on('terminal:write', (_event, id: string, data: string) => {
    const session = sessions.get(id)
    if (session) session.pty.write(data)
  })

  ipcMain.on('terminal:resize', (_event, id: string, cols: number, rows: number) => {
    const session = sessions.get(id)
    if (session) {
      try {
        session.pty.resize(cols, rows)
      } catch {
        // resize can fail if the process already exited
      }
    }
  })

  ipcMain.on('terminal:kill', (_event, id: string) => {
    const session = sessions.get(id)
    if (session) {
      session.dataListener()
      session.exitListener()
      try {
        session.pty.kill()
      } catch {
        // process may already be dead
      }
      sessions.delete(id)
    }
  })
}

export function killAllTerminals(): void {
  for (const [id, session] of sessions) {
    session.dataListener()
    session.exitListener()
    try {
      session.pty.kill()
    } catch {
      /* ignore */
    }
    sessions.delete(id)
  }
}

// Clean up on window close
export function watchWindowForTerminals(win: BrowserWindow): void {
  win.on('closed', () => killAllTerminals())
}
