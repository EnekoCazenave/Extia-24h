import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { PlayInputSchema } from '@extia-gaming/shared'
import { play } from '../controllers/play.controller.js'
import { authenticate } from '../hooks/authenticate.js'

export async function playRoutes(fastify: FastifyInstance) {
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.post<RouteOf<typeof play>>('/api/play', {
    preHandler: [authenticate],
    schema: { body: PlayInputSchema },
  }, play)
}

type RouteOf<T> = T extends (request: FastifyRequest<infer R>, reply: FastifyReply) => unknown ? R : never
