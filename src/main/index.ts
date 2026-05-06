import { app, shell, BrowserWindow, Menu } from 'electron'
import { join } from 'path'
import { registerFsHandlers } from './ipc/fs'
import { registerTerminalHandlers, watchWindowForTerminals } from './ipc/terminal'
import { loadSettings } from './services/settings'

const isDev = process.env['ELECTRON_RENDERER_URL'] !== undefined

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#1e1e1e',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  Menu.setApplicationMenu(null)

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Open DevTools with F12 in dev mode
  if (isDev) {
    mainWindow.webContents.on('before-input-event', (_, input) => {
      if (input.type === 'keyDown' && input.key === 'F12') {
        mainWindow.webContents.toggleDevTools()
      }
    })
  }

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(async () => {
  await loadSettings()

  // Set Windows App User Model ID for proper taskbar grouping
  if (process.platform === 'win32') {
    app.setAppUserModelId('xyz.kirit.kode')
  }

  registerFsHandlers()
  registerTerminalHandlers()

  const win = createWindow()
  watchWindowForTerminals(win)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
