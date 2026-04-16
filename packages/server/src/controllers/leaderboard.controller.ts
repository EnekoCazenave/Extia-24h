import type { FastifyRequest, FastifyReply } from 'fastify'
import { getGlobalLeaderboard, getTopGamesByScore } from '../services/leaderboard.service.js'

export async function globalLeaderboard(
  request: FastifyRequest<{ Querystring: { limit?: string } }>,
  reply: FastifyReply,
) {
  const limit = Math.min(parseInt(request.query.limit ?? '20', 10), 100)
  const rankings = await getGlobalLeaderboard(isNaN(limit) ? 20 : limit)
  return reply.send({ rankings })
}

export async function topGames(
  request: FastifyRequest<{ Querystring: { limit?: string } }>,
  reply: FastifyReply,
) {
  const limit = Math.min(parseInt(request.query.limit ?? '5', 10), 20)
  const games = await getTopGamesByScore(isNaN(limit) ? 5 : limit)
  return reply.send({ games })
}
