// Ensures ELECTRON_RUN_AS_NODE is fully unset before launching electron-vite.
// An empty-string value still counts as "set" on Windows; delete() is the only safe way.
import { spawn } from 'child_process'

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

// On Windows, invoke via cmd.exe so .cmd scripts work without shell:true (which would re-inherit env)
const isWin = process.platform === 'win32'
const [cmd, args] = isWin
  ? ['cmd', ['/c', 'electron-vite', 'dev']]
  : ['electron-vite', ['dev']]

const proc = spawn(cmd, args, {
  stdio: 'inherit',
  env
})

proc.on('close', (code) => process.exit(code ?? 0))
