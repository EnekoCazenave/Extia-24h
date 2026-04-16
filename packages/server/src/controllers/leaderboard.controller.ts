import type { FastifyRequest, FastifyReply } from 'fastify'
import { getGlobalLeaderboard, getTopGamesByScore } from '../services/leaderboard.service.js'

export async function globalLeaderboard(
  request: FastifyRequest<{ Querystring: { limit?: string } }>,
  reply: FastifyReply,
) {
  const parsed = parseInt(request.query.limit ?? '20', 10)
  const limit = Math.min(isNaN(parsed) ? 20 : parsed, 100)
  const rankings = await getGlobalLeaderboard(limit)
  return reply.send({ rankings })
}

export async function topGames(
  request: FastifyRequest<{ Querystring: { limit?: string } }>,
  reply: FastifyReply,
) {
  const parsed = parseInt(request.query.limit ?? '5', 10)
  const limit = Math.min(isNaN(parsed) ? 5 : parsed, 20)
  const games = await getTopGamesByScore(limit)
  return reply.send({ games })
}
