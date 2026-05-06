const EXT_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  jsonc: 'json',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  md: 'markdown',
  mdx: 'markdown',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cs: 'csharp',
  php: 'php',
  rb: 'ruby',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  fish: 'shell',
  ps1: 'powershell',
  yml: 'yaml',
  yaml: 'yaml',
  xml: 'xml',
  svg: 'xml',
  sql: 'sql',
  graphql: 'graphql',
  gql: 'graphql',
  toml: 'ini',
  ini: 'ini',
  vue: 'html',
  svelte: 'html',
  tf: 'hcl',
  dockerfile: 'dockerfile',
  makefile: 'makefile'
}

export function getLanguage(filename: string): string {
  const base = filename.split('/').pop()?.split('\\').pop() ?? filename
  const lower = base.toLowerCase()

  // Exact filename matches
  if (lower === 'dockerfile') return 'dockerfile'
  if (lower === 'makefile') return 'makefile'
  if (lower === '.gitignore' || lower === '.gitattributes') return 'plaintext'

  const ext = lower.split('.').pop() ?? ''
  return EXT_MAP[ext] ?? 'plaintext'
}

export function getDisplayName(path: string): string {
  return path.split(/[/\\]/).pop() ?? path
}

interface FileIcon {
  char: string
  color: string
}

const ICON_MAP: Record<string, FileIcon> = {
  typescript:  { char: 'TS', color: '#3178c6' },
  javascript:  { char: 'JS', color: '#f7df1e' },
  json:        { char: '{}', color: '#cbcb41' },
  html:        { char: '◈',  color: '#e34c26' },
  css:         { char: '◈',  color: '#264de4' },
  scss:        { char: '◈',  color: '#cc6699' },
  less:        { char: '◈',  color: '#1d365d' },
  markdown:    { char: 'MD', color: '#519aba' },
  python:      { char: 'PY', color: '#3572a5' },
  rust:        { char: 'RS', color: '#dea584' },
  go:          { char: 'GO', color: '#00add8' },
  java:        { char: 'JV', color: '#b07219' },
  c:           { char: 'C',  color: '#555555' },
  cpp:         { char: 'C+', color: '#f34b7d' },
  csharp:      { char: 'C#', color: '#178600' },
  php:         { char: 'PH', color: '#4f5d95' },
  ruby:        { char: 'RB', color: '#701516' },
  shell:       { char: '$',  color: '#89e051' },
  powershell:  { char: 'PS', color: '#012456' },
  yaml:        { char: '≡',  color: '#cb171e' },
  xml:         { char: '</>', color: '#e34c26' },
  sql:         { char: 'DB', color: '#e38c00' },
  graphql:     { char: 'GQ', color: '#e10098' },
  dockerfile:  { char: '🐳', color: '#384d54' },
  plaintext:   { char: '·',  color: '#6e6e6e' }
}

export function getFileIcon(filename: string): FileIcon {
  const lang = getLanguage(filename)
  return ICON_MAP[lang] ?? { char: '·', color: '#6e6e6e' }
}
