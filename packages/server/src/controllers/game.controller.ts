import type { FastifyRequest, FastifyReply } from 'fastify'
import { listGamesWithScores, getGameDetail } from '../services/game.service.js'

export async function listGames(_request: FastifyRequest, reply: FastifyReply) {
  const games = await listGamesWithScores()
  return reply.send({ games })
}

export async function getGame(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const id = parseInt(request.params.id, 10)
  if (isNaN(id)) return reply.code(400).send({ error: 'Invalid game id', statusCode: 400 })

  const game = await getGameDetail(id)
  if (!game) return reply.code(404).send({ error: 'Game not found', statusCode: 404 })

  return reply.send({ game })
}
