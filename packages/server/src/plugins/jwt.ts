import fp from 'fastify-plugin'
import jwtPlugin from '@fastify/jwt'
import { env } from '../env.js'
import type { JWTPayload } from '@extia-gaming/shared'

declare module 'fastify' {
  interface FastifyRequest {
    user: JWTPayload
  }
}

export default fp(async (fastify) => {
  await fastify.register(jwtPlugin, {
    secret: env.JWT_SECRET,
  })
})
