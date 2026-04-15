import fp from 'fastify-plugin'
import csrf from '@fastify/csrf-protection'

export default fp(async (fastify) => {
  await fastify.register(csrf, {
    sessionPlugin: '@fastify/cookie',
    cookieOpts: { signed: true, httpOnly: false, sameSite: 'strict' },
  })
})
