import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.js'
import { gameRoutes } from './games.js'

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes)
  await fastify.register(gameRoutes)
}
