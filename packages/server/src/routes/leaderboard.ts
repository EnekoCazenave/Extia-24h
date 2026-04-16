import type { FastifyInstance } from 'fastify'
import { globalLeaderboard, topGames } from '../controllers/leaderboard.controller.js'

export async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.get('/api/leaderboard', globalLeaderboard)
  fastify.get('/api/leaderboard/top-games', topGames)
}
