import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'

export default fp(async (fastify) => {
  await fastify.register(rateLimit, {
    global: false, // applied per-route, not globally
    max: 100,
    timeWindow: '1 minute',
  })
})
