import type { FastifyInstance } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { PlayInputSchema } from '@extia-gaming/shared'
import { play } from '../controllers/play.controller.js'
import { authenticate } from '../hooks/authenticate.js'

export async function playRoutes(fastify: FastifyInstance) {
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.post('/api/play', {
    preHandler: [authenticate],
    schema: { body: PlayInputSchema },
  }, play)
}
