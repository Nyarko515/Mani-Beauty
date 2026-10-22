import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import dotenv from 'dotenv'

const rootDir = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const localEnvPath = path.join(rootDir, '.env.local')
const defaultEnvPath = path.join(rootDir, '.env')

// Use an ignored .env.local for localhost test keys and callback URLs. Vite
// already follows this convention; loading it here keeps the API in sync.
dotenv.config({
  path: existsSync(localEnvPath) ? localEnvPath : defaultEnvPath,
  override: true,
})

const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const tsxCli = fileURLToPath(new URL('../node_modules/tsx/dist/cli.mjs', import.meta.url))

const children = [
  spawn(process.execPath, [tsxCli, 'watch', 'server/app.js'], { stdio: 'inherit', env: process.env }),
  spawn(process.execPath, [viteCli, '--configLoader', 'runner'], { stdio: 'inherit', env: process.env }),
]

let shuttingDown = false
function shutdown(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true
  children.forEach((child) => {
    if (!child.killed) child.kill()
  })
  process.exit(exitCode)
}

children.forEach((child) => {
  child.on('error', (error) => {
    console.error(error)
    shutdown(1)
  })

  child.on('exit', (code) => {
    if (!shuttingDown && code) shutdown(code)
  })
})

process.on('SIGINT', () => shutdown())
process.on('SIGTERM', () => shutdown())
