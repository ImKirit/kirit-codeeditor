import { ipcMain, BrowserWindow } from 'electron'

const LOGIN_URLS: Record<string, string> = {
  claude: 'https://claude.ai',
  copilot: 'https://github.com/login'
}

// Cookie names that signal a successful login
const SESSION_COOKIES: Record<string, string[]> = {
  claude: ['sessionKey', 'CH_SESSION', '__Secure-next-auth.session-token'],
  copilot: ['user_session', '__Host-user_session_same_site']
}

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:login', async (event, provider: string): Promise<string | null> => {
    const loginUrl = LOGIN_URLS[provider]
    if (!loginUrl) return null

    const cookieNames = SESSION_COOKIES[provider] ?? []
    const parent = BrowserWindow.fromWebContents(event.sender) ?? undefined

    const authWin = new BrowserWindow({
      width: 1024,
      height: 700,
      parent,
      modal: false,
      title: `Sign in`,
      webPreferences: {
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    await authWin.loadURL(loginUrl)

    return new Promise<string | null>(resolve => {
      let resolved = false

      const tryExtract = async (): Promise<void> => {
        if (resolved || authWin.isDestroyed()) return
        try {
          const allCookies = await authWin.webContents.session.cookies.get({ url: loginUrl })
          for (const name of cookieNames) {
            const match = allCookies.find(c => c.name === name)
            if (match) {
              resolved = true
              // Build a full cookie string containing all cookies for the domain
              const cookieStr = allCookies.map(c => `${c.name}=${c.value}`).join('; ')
              authWin.close()
              resolve(cookieStr)
              return
            }
          }
        } catch { /* ignore */ }
      }

      authWin.webContents.on('did-finish-load', tryExtract)
      authWin.webContents.on('did-navigate', tryExtract)
      authWin.webContents.on('did-navigate-in-page', tryExtract)

      authWin.on('closed', () => {
        if (!resolved) resolve(null)
      })
    })
  })
}
