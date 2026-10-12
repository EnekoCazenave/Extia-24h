import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { UpdateProfileSchema } from '@extia-gaming/shared'
import { updateProfile, listUsers } from '../controllers/user.controller.js'
import { authenticate } from '../hooks/authenticate.js'

export async function userRoutes(fastify: FastifyInstance) {
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.put<RouteOf<typeof updateProfile>>('/api/users/me', {
    preHandler: [authenticate],
    schema: { body: UpdateProfileSchema },
  }, updateProfile)

  f.get<RouteOf<typeof listUsers>>('/api/users', { preHandler: [authenticate] }, listUsers)
}

type RouteOf<T> = T extends (request: FastifyRequest<infer R>, reply: FastifyReply) => unknown ? R : never
