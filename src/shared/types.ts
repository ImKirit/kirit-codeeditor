export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
}

export interface OpenFile {
  id: string
  path: string
  name: string
  content: string
  language: string
  isDirty: boolean
}
