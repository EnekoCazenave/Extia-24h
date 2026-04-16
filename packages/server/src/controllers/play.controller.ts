import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PlayInput } from '@extia-gaming/shared'
import { submitPlay } from '../services/play.service.js'

export async function play(
  request: FastifyRequest<{ Body: PlayInput }>,
  reply: FastifyReply,
) {
  try {
    const session = await submitPlay(request.user.sub, request.body)
    return reply.code(201).send({ session })
  } catch (err) {
    if (err instanceof Error && err.message === 'GAME_TYPE_NOT_FOUND') {
      return reply.code(404).send({ error: 'Game type not found', statusCode: 404 })
    }
    throw err
  }
}
