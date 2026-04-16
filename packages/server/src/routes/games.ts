import type { FastifyInstance } from 'fastify'
import { listGames, getGame } from '../controllers/game.controller.js'

export async function gameRoutes(fastify: FastifyInstance) {
  fastify.get('/api/games', listGames)
  fastify.get('/api/games/:id', getGame)
}
