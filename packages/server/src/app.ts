import Fastify, { FastifyInstance } from 'fastify'
import staticPlugin from '@fastify/static'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cookiePlugin from './plugins/cookie.js'
import corsPlugin from './plugins/cors.js'
import helmetPlugin from './plugins/helmet.js'
import rateLimitPlugin from './plugins/rateLimit.js'
import csrfPlugin from './plugins/csrf.js'
import jwtPlugin from './plugins/jwt.js'
import { registerRoutes } from './routes/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.resolve(__dirname, '../uploads')

export interface BuildOptions {
  logger?: boolean | object
}

export async function buildApp(opts: BuildOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: opts.logger ?? {
      level: 'info',
      transport: { target: 'pino-pretty' },
    },
  })

  await fastify.register(staticPlugin, { root: UPLOADS_DIR, prefix: '/uploads/' })
  await fastify.register(cookiePlugin)
  await fastify.register(corsPlugin)
  await fastify.register(helmetPlugin)
  await fastify.register(rateLimitPlugin)
  await fastify.register(csrfPlugin)
  await fastify.register(jwtPlugin)
  await fastify.register(registerRoutes)

  fastify.get('/health', async () => ({ status: 'ok' }))

  return fastify
}
