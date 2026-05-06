import { ipcMain } from 'electron'
import simpleGit from 'simple-git'

interface GitFile {
  path: string
  status: string
  staged: boolean
}

export function registerGitHandlers(): void {
  ipcMain.handle('git:branch', async (_, cwd: string): Promise<string | null> => {
    try {
      const git = simpleGit(cwd)
      return (await git.revparse(['--abbrev-ref', 'HEAD'])).trim()
    } catch {
      return null
    }
  })

  ipcMain.handle('git:status', async (_, cwd: string): Promise<GitFile[]> => {
    try {
      const git = simpleGit(cwd)
      const status = await git.status()
      const files: GitFile[] = []
      for (const f of status.files) {
        // index = staged, working_dir = unstaged
        if (f.index && f.index !== ' ' && f.index !== '?') {
          files.push({ path: f.path, status: f.index, staged: true })
        }
        if (f.working_dir && f.working_dir !== ' ' && f.working_dir !== '?') {
          files.push({ path: f.path, status: f.working_dir, staged: false })
        }
        if (f.index === '?' && f.working_dir === '?') {
          files.push({ path: f.path, status: '?', staged: false })
        }
      }
      return files
    } catch {
      return []
    }
  })

  ipcMain.handle('git:diff', async (_, cwd: string, filePath: string, staged: boolean): Promise<string> => {
    try {
      const git = simpleGit(cwd)
      if (staged) {
        return await git.diff(['--cached', '--', filePath])
      }
      return await git.diff(['--', filePath])
    } catch {
      return ''
    }
  })

  ipcMain.handle('git:stage', async (_, cwd: string, filePath: string): Promise<void> => {
    const git = simpleGit(cwd)
    await git.add(filePath)
  })

  ipcMain.handle('git:unstage', async (_, cwd: string, filePath: string): Promise<void> => {
    const git = simpleGit(cwd)
    await git.reset(['HEAD', '--', filePath])
  })

  ipcMain.handle('git:commit', async (_, cwd: string, message: string): Promise<string> => {
    try {
      const git = simpleGit(cwd)
      const result = await git.commit(message)
      return result.summary.changes > 0 || result.summary.insertions > 0 || result.summary.deletions > 0
        ? `Committed ${result.summary.changes} file(s)`
        : 'Nothing committed'
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`
    }
  })

  ipcMain.handle('git:push', async (_, cwd: string): Promise<string> => {
    try {
      const git = simpleGit(cwd)
      await git.push()
      return 'Pushed successfully'
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`
    }
  })

  ipcMain.handle('git:pull', async (_, cwd: string): Promise<string> => {
    try {
      const git = simpleGit(cwd)
      const result = await git.pull()
      return `Pulled: ${result.summary.changes} change(s)`
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : String(e)}`
    }
  })

  ipcMain.handle('git:log', async (_, cwd: string, limit: number): Promise<{ hash: string; message: string; author: string; date: string }[]> => {
    try {
      const git = simpleGit(cwd)
      const log = await git.log({ maxCount: limit })
      return log.all.map(c => ({
        hash: c.hash.slice(0, 7),
        message: c.message,
        author: c.author_name,
        date: c.date
      }))
    } catch {
      return []
    }
  })

  ipcMain.handle('git:branches', async (_, cwd: string): Promise<{ name: string; current: boolean }[]> => {
    try {
      const git = simpleGit(cwd)
      const branches = await git.branchLocal()
      return branches.all.map(name => ({ name, current: name === branches.current }))
    } catch {
      return []
    }
  })

  ipcMain.handle('git:checkout', async (_, cwd: string, branch: string): Promise<void> => {
    const git = simpleGit(cwd)
    await git.checkout(branch)
  })
}
