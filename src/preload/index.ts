import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  terminal: {
    create: (opts: { cwd?: string; cols: number; rows: number }): Promise<string> =>
      ipcRenderer.invoke('terminal:create', opts),
    write: (id: string, data: string): void => ipcRenderer.send('terminal:write', id, data),
    resize: (id: string, cols: number, rows: number): void =>
      ipcRenderer.send('terminal:resize', id, cols, rows),
    kill: (id: string): void => ipcRenderer.send('terminal:kill', id),
    onData: (id: string, cb: (data: string) => void): (() => void) => {
      const channel = `terminal:data:${id}`
      const handler = (_: Electron.IpcRendererEvent, data: string): void => cb(data)
      ipcRenderer.on(channel, handler)
      return () => ipcRenderer.removeListener(channel, handler)
    },
    onExit: (id: string, cb: (code: number) => void): (() => void) => {
      const channel = `terminal:exit:${id}`
      const handler = (_: Electron.IpcRendererEvent, code: number): void => cb(code)
      ipcRenderer.on(channel, handler)
      return () => ipcRenderer.removeListener(channel, handler)
    }
  },
  git: {
    branch: (cwd: string): Promise<string | null> => ipcRenderer.invoke('git:branch', cwd),
    status: (cwd: string): Promise<Array<{ path: string; status: string; staged: boolean }>> =>
      ipcRenderer.invoke('git:status', cwd),
    diff: (cwd: string, filePath: string, staged: boolean): Promise<string> =>
      ipcRenderer.invoke('git:diff', cwd, filePath, staged),
    stage: (cwd: string, filePath: string): Promise<void> =>
      ipcRenderer.invoke('git:stage', cwd, filePath),
    unstage: (cwd: string, filePath: string): Promise<void> =>
      ipcRenderer.invoke('git:unstage', cwd, filePath),
    commit: (cwd: string, message: string): Promise<string> =>
      ipcRenderer.invoke('git:commit', cwd, message),
    push: (cwd: string): Promise<string> => ipcRenderer.invoke('git:push', cwd),
    pull: (cwd: string): Promise<string> => ipcRenderer.invoke('git:pull', cwd),
    log: (cwd: string, limit: number): Promise<Array<{ hash: string; message: string; author: string; date: string }>> =>
      ipcRenderer.invoke('git:log', cwd, limit),
    branches: (cwd: string): Promise<Array<{ name: string; current: boolean }>> =>
      ipcRenderer.invoke('git:branches', cwd),
    checkout: (cwd: string, branch: string): Promise<void> =>
      ipcRenderer.invoke('git:checkout', cwd, branch)
  },
  ai: {
    getSubscriptions: (): Promise<import('../shared/types').Subscription[]> =>
      ipcRenderer.invoke('ai:getSubscriptions'),
    addSubscription: (sub: import('../shared/types').Subscription): Promise<void> =>
      ipcRenderer.invoke('ai:addSubscription', sub),
    removeSubscription: (id: string): Promise<void> =>
      ipcRenderer.invoke('ai:removeSubscription', id),
    chat: (opts: {
      sessionId: string
      subscriptionId: string
      provider: string
      model: string
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      systemPrompt?: string
    }): Promise<void> => ipcRenderer.invoke('ai:chat', opts),
    cancel: (sessionId: string): void => ipcRenderer.send('ai:cancel', sessionId),
    onChunk: (
      sessionId: string,
      cb: (chunk: Record<string, unknown>) => void
    ): (() => void) => {
      const channel = `ai:chunk:${sessionId}`
      const handler = (_: Electron.IpcRendererEvent, chunk: Record<string, unknown>): void =>
        cb(chunk)
      ipcRenderer.on(channel, handler)
      return () => ipcRenderer.removeListener(channel, handler)
    }
  },
  search: {
    files: (rootDir: string): Promise<string[]> => ipcRenderer.invoke('search:files', rootDir),
    content: (
      rootDir: string,
      query: string
    ): Promise<Array<{ file: string; line: number; col: number; text: string }>> =>
      ipcRenderer.invoke('search:content', rootDir, query)
  },
  updater: {
    onAvailable: (cb: (info: unknown) => void): (() => void) => {
      const handler = (_: Electron.IpcRendererEvent, info: unknown): void => cb(info)
      ipcRenderer.on('updater:available', handler)
      return () => ipcRenderer.removeListener('updater:available', handler)
    },
    onDownloaded: (cb: () => void): (() => void) => {
      const handler = (): void => cb()
      ipcRenderer.on('updater:downloaded', handler)
      return () => ipcRenderer.removeListener('updater:downloaded', handler)
    },
    download: (): void => ipcRenderer.send('updater:download'),
    install: (): void => ipcRenderer.send('updater:install')
  },
  fs: {
    openFolder: (): Promise<string | null> => ipcRenderer.invoke('fs:openFolder'),
    openFile: (): Promise<string | null> => ipcRenderer.invoke('fs:openFile'),
    readDir: (path: string) => ipcRenderer.invoke('fs:readDir', path),
    readFile: (path: string): Promise<string> => ipcRenderer.invoke('fs:readFile', path),
    writeFile: (path: string, content: string): Promise<void> =>
      ipcRenderer.invoke('fs:writeFile', path, content),
    createFile: (path: string): Promise<void> => ipcRenderer.invoke('fs:createFile', path),
    createDir: (path: string): Promise<void> => ipcRenderer.invoke('fs:createDir', path),
    rename: (oldPath: string, newPath: string): Promise<void> =>
      ipcRenderer.invoke('fs:rename', oldPath, newPath),
    delete: (path: string): Promise<void> => ipcRenderer.invoke('fs:delete', path),
    getRecentFolders: (): Promise<string[]> => ipcRenderer.invoke('fs:getRecentFolders'),
    addRecentFolder: (path: string): Promise<void> => ipcRenderer.invoke('fs:addRecentFolder', path)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}

export type API = typeof api
