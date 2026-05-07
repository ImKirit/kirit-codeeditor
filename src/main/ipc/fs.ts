import { ipcMain, dialog } from 'electron'
import { readdir, readFile, writeFile, mkdir, rename, unlink } from 'fs/promises'
import { join } from 'path'
import type { FileEntry } from '../../shared/types'
import { getRecentFolders, addRecentFolder } from '../services/settings'

export function registerFsHandlers(): void {
  ipcMain.handle('fs:openFolder', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Open Folder'
      })
      if (result.canceled || !result.filePaths.length) return null
      const folderPath = result.filePaths[0]
      addRecentFolder(folderPath).catch(() => {})
      return folderPath
    } catch (e) {
      console.error('openFolder error:', e)
      return null
    }
  })

  ipcMain.handle('fs:openFile', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        title: 'Open File'
      })
      if (result.canceled || !result.filePaths.length) return null
      return result.filePaths[0]
    } catch (e) {
      console.error('openFile error:', e)
      return null
    }
  })

  ipcMain.handle('fs:readDir', async (_, dirPath: string): Promise<FileEntry[]> => {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true })
      return entries
        .map(e => ({ name: e.name, path: join(dirPath, e.name), isDirectory: e.isDirectory() }))
        .sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        })
    } catch {
      return []
    }
  })

  ipcMain.handle('fs:readFile', async (_, filePath: string): Promise<string> => {
    return readFile(filePath, 'utf-8')
  })

  ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string): Promise<void> => {
    await writeFile(filePath, content, 'utf-8')
  })

  ipcMain.handle('fs:createFile', async (_, filePath: string): Promise<void> => {
    await writeFile(filePath, '', 'utf-8')
  })

  ipcMain.handle('fs:createDir', async (_, dirPath: string): Promise<void> => {
    await mkdir(dirPath, { recursive: true })
  })

  ipcMain.handle('fs:rename', async (_, oldPath: string, newPath: string): Promise<void> => {
    await rename(oldPath, newPath)
  })

  ipcMain.handle('fs:delete', async (_, filePath: string): Promise<void> => {
    await unlink(filePath)
  })

  ipcMain.handle('fs:getRecentFolders', (): string[] => {
    return getRecentFolders()
  })

  ipcMain.handle('fs:addRecentFolder', async (_, folderPath: string): Promise<void> => {
    await addRecentFolder(folderPath)
  })
}
