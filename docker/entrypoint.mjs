import { spawn } from 'node:child_process'

// Construct the URL at runtime so special characters in the password are safe.
const password = process.env.POSTGRES_PASSWORD
if (!password) throw new Error('POSTGRES_PASSWORD is required')
process.env.DATABASE_URL = `postgresql://postgres:${encodeURIComponent(password)}@database:5432/extia_gaming`
delete process.env.POSTGRES_PASSWORD

const [command, ...args] = process.argv.slice(2)
const child = spawn(command, args, { stdio: 'inherit', env: process.env })
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => child.kill(signal))
}
child.on('error', (error) => { console.error(error.message); process.exit(1) })
child.on('exit', (code, signal) => process.exit(code ?? (signal === 'SIGTERM' ? 143 : 1)))
