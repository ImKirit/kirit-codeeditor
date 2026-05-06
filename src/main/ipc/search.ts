import { ipcMain } from 'electron'
import { readdirSync, statSync, readFileSync } from 'fs'
import { join, relative } from 'path'

const IGNORE_DIRS = new Set([
  '.git', 'node_modules', '.next', 'dist', 'out', 'build', '.cache',
  '__pycache__', '.pytest_cache', 'target', 'vendor', '.venv', 'venv'
])

const MAX_FILE_SIZE = 1024 * 512 // 512 KB

function walkFiles(dir: string, base: string, results: string[] = []): string[] {
  let entries: string[]
  try { entries = readdirSync(dir) } catch { return results }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry) || entry.startsWith('.')) continue
    const full = join(dir, entry)
    let stat
    try { stat = statSync(full) } catch { continue }
    if (stat.isDirectory()) {
      walkFiles(full, base, results)
    } else {
      results.push(relative(base, full).replace(/\\/g, '/'))
    }
    if (results.length >= 5000) break
  }
  return results
}

export interface SearchResult {
  file: string
  line: number
  col: number
  text: string
}

export function registerSearchHandlers(): void {
  ipcMain.handle('search:files', (_, rootDir: string): string[] => {
    return walkFiles(rootDir, rootDir)
  })

  ipcMain.handle(
    'search:content',
    (_, rootDir: string, query: string): SearchResult[] => {
      if (!query || query.length < 2) return []
      const files = walkFiles(rootDir, rootDir)
      const results: SearchResult[] = []
      const q = query.toLowerCase()

      for (const rel of files) {
        const full = join(rootDir, rel)
        let stat
        try { stat = statSync(full) } catch { continue }
        if (stat.size > MAX_FILE_SIZE) continue

        let content: string
        try { content = readFileSync(full, 'utf8') } catch { continue }

        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const lower = lines[i].toLowerCase()
          const col = lower.indexOf(q)
          if (col !== -1) {
            results.push({ file: rel, line: i + 1, col: col + 1, text: lines[i].trim() })
            if (results.length >= 500) return results
          }
        }
      }
      return results
    }
  )
}
