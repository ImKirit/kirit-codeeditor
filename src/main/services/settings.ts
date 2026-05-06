import { app } from 'electron'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

interface Settings {
  recentFolders: string[]
}

let settingsFile: string | null = null

function getSettingsFile(): string {
  if (!settingsFile) {
    settingsFile = join(app.getPath('userData'), 'kode-settings.json')
  }
  return settingsFile
}

let cache: Settings = { recentFolders: [] }

export async function loadSettings(): Promise<void> {
  try {
    const raw = await readFile(getSettingsFile(), 'utf-8')
    cache = { ...cache, ...JSON.parse(raw) }
  } catch {
    // first run — defaults are fine
  }
}

async function persist(): Promise<void> {
  try {
    await mkdir(app.getPath('userData'), { recursive: true })
    await writeFile(getSettingsFile(), JSON.stringify(cache, null, 2), 'utf-8')
  } catch (e) {
    console.error('[settings] save failed:', e)
  }
}

export function getRecentFolders(): string[] {
  return cache.recentFolders
}

export async function addRecentFolder(folderPath: string): Promise<void> {
  cache.recentFolders = [folderPath, ...cache.recentFolders.filter((f) => f !== folderPath)].slice(
    0,
    10
  )
  await persist()
}
