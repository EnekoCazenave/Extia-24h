import fp from 'fastify-plugin'
import cookie from '@fastify/cookie'

export default fp(async (fastify) => {
  await fastify.register(cookie, {
    secret: process.env.JWT_SECRET!, // signs cookies
    hook: 'onRequest',
  })
})
