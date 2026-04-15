import Fastify, { FastifyInstance } from 'fastify'
import cookiePlugin from './plugins/cookie.js'
import corsPlugin from './plugins/cors.js'
import helmetPlugin from './plugins/helmet.js'
import rateLimitPlugin from './plugins/rateLimit.js'
import csrfPlugin from './plugins/csrf.js'
import jwtPlugin from './plugins/jwt.js'

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

  await fastify.register(cookiePlugin)
  await fastify.register(corsPlugin)
  await fastify.register(helmetPlugin)
  await fastify.register(rateLimitPlugin)
  await fastify.register(csrfPlugin)
  await fastify.register(jwtPlugin)

  // Routes registered in Task 7
  fastify.get('/health', async () => ({ status: 'ok' }))

  return fastify
}
