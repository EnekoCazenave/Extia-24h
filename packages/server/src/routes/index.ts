import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.js'
import { gameRoutes } from './games.js'
import { leaderboardRoutes } from './leaderboard.js'
import { playRoutes } from './play.js'
import { userRoutes } from './users.js'

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes)
  await fastify.register(gameRoutes)
  await fastify.register(leaderboardRoutes)
  await fastify.register(playRoutes)
  await fastify.register(userRoutes)
}
