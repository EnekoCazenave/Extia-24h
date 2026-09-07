import type { FastifyRequest, FastifyReply } from 'fastify'
import { getGlobalLeaderboard, getTopGamesByScore, getFilteredLeaderboard, retrieveLeaderBoardById } from '../services/leaderboard.service.js'
import type { JWTPayload } from '@extia-gaming/shared'

export async function globalLeaderboard(
  request: FastifyRequest<{ Querystring: { limit?: string } }>,
  reply: FastifyReply,
) {
  const parsed = parseInt(request.query.limit ?? '20', 10)
  const limit = Math.min(isNaN(parsed) ? 20 : parsed, 100)
  const rankings = await getGlobalLeaderboard(limit)
  return reply.send({ rankings })
}

export async function filteredLeaderboard(
  request: FastifyRequest<{ Querystring: { gameId?: string; gameTypeId?: string; team?: string; limit?: string } }>,
  reply: FastifyReply,
) {
  const { gameId, gameTypeId, team, limit } = request.query
  const parsedLimit = Math.min(parseInt(limit ?? '100', 10) || 100, 200)
  const rankings = await getFilteredLeaderboard({
    gameId: gameId ? parseInt(gameId, 10) : undefined,
    gameTypeId: gameTypeId ? parseInt(gameTypeId, 10) : undefined,
    team: team === 'true' ? true : team === 'false' ? false : undefined,
    limit: parsedLimit,
  })
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

export async function getLeaderboardByUserId(
    request: FastifyRequest,
    reply: FastifyReply,
) {
  const userId = (request.user as JWTPayload).sub
  const ranking = await retrieveLeaderBoardById(userId)
  if (!ranking) return reply.code(404).send({error: 'User not found', statusCode: 404})
  return reply.send({ranking})
}
