import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.js'

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes)
}
