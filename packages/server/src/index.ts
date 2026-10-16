import 'dotenv/config'
import { buildApp } from './app.js'
import { env } from './env.js'
import { ensureInitialAdmin } from './services/bootstrap.service.js'

try {
  const adminStatus = await ensureInitialAdmin()
  const app = await buildApp()
  app.log.info({ adminStatus }, 'Administrator initialization complete')
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  console.error(err)
  process.exit(1)
}
