import type { FastifyInstance } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { UpdateProfileSchema } from '@extia-gaming/shared'
import { updateProfile } from '../controllers/user.controller.js'
import { authenticate } from '../hooks/authenticate.js'

export async function userRoutes(fastify: FastifyInstance) {
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.put('/api/users/me', {
    preHandler: [authenticate],
    schema: { body: UpdateProfileSchema },
  }, updateProfile)
}
