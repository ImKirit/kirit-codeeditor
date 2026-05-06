import { ipcMain } from 'electron'
import { exec } from 'child_process'

export function registerGitHandlers(): void {
  ipcMain.handle('git:branch', (_, cwd: string): Promise<string | null> => {
    return new Promise(resolve => {
      exec('git branch --show-current', { cwd }, (err, stdout) => {
        if (err) resolve(null)
        else resolve(stdout.trim() || null)
      })
    })
  })
}
