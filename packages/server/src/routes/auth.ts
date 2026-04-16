import type { FastifyInstance } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { RegisterSchema, LoginSchema } from '@extia-gaming/shared'
import { register, login, refresh, logout } from '../controllers/auth.controller.js'
import { authenticate } from '../hooks/authenticate.js'
import { prisma } from '../lib/prisma.js'

export async function authRoutes(fastify: FastifyInstance) {
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  const f = fastify.withTypeProvider<ZodTypeProvider>()
  const authRateLimit = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }

  f.post('/auth/register', { ...authRateLimit, schema: { body: RegisterSchema } }, register)
  f.post('/auth/login', { ...authRateLimit, schema: { body: LoginSchema } }, login)
  f.post('/auth/refresh', refresh)
  f.post('/auth/logout', logout)

  // Session restore
  f.get('/auth/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.sub },
      include: { role: true },
    })
    if (!user) return reply.code(404).send({ error: 'User not found', statusCode: 404 })
    const { password: _, ...userPublic } = user
    return reply.send({ user: userPublic })
  })
}
