import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.js'
import { gameRoutes } from './games.js'
import { leaderboardRoutes } from './leaderboard.js'
import { playRoutes } from './play.js'
import { userRoutes } from './users.js'
import { adminRoutes } from './admin.js'
import { moderationRoutes } from './moderation.js'
import { uploadRoutes } from './upload.js'
import { associationRoutes } from './association.js'

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes)
  await fastify.register(gameRoutes)
  await fastify.register(leaderboardRoutes)
  await fastify.register(playRoutes)
  await fastify.register(userRoutes)
  await fastify.register(adminRoutes)
  await fastify.register(moderationRoutes)
  await fastify.register(uploadRoutes)
  await fastify.register(associationRoutes)
}
