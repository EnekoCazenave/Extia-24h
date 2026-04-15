import Fastify, { FastifyInstance } from 'fastify'

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

  // Plugins registered in later tasks — stubs for now
  // await fastify.register(import('./plugins/cookie.js'))
  // await fastify.register(import('./plugins/cors.js'))
  // await fastify.register(import('./plugins/helmet.js'))
  // await fastify.register(import('./plugins/jwt.js'))
  // await fastify.register(import('./plugins/rateLimit.js'))
  // await fastify.register(import('./plugins/csrf.js'))
  // await fastify.register(import('./routes/index.js'))

  fastify.get('/health', async () => ({ status: 'ok' }))

  return fastify
}
