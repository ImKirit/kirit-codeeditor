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
