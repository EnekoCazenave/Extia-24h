import type { FastifyInstance } from 'fastify'
import { globalLeaderboard, topGames, filteredLeaderboard, getLeaderboardByUserId } from '../controllers/leaderboard.controller.js'
import {authenticate} from "../hooks/authenticate.js";

export async function leaderboardRoutes(fastify: FastifyInstance) {

  const authenticatedGuard = { preHandler: [authenticate] }

  fastify.get('/api/leaderboard', globalLeaderboard)
  fastify.get('/api/leaderboard/top-games', topGames)
  fastify.get('/api/leaderboard/players', filteredLeaderboard)

  fastify.get('/api/leaderboard/me', authenticatedGuard, getLeaderboardByUserId)
}
