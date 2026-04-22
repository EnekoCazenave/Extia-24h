import type { FastifyRequest, FastifyReply } from 'fastify'
import { getSessions, approveSession, rejectSession } from '../services/moderation.service.js'

export async function listSessions(
  request: FastifyRequest<{ Querystring: { gameId?: string; status?: string } }>,
  reply: FastifyReply,
) {
  const gameId = request.query.gameId ? parseInt(request.query.gameId, 10) : undefined
  const { status } = request.query
  const sessions = await getSessions(gameId, status)
  return reply.send({ sessions })
}

export async function approve(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    await approveSession(parseInt(request.params.id, 10))
    return reply.send({ ok: true })
  } catch (err) {
    if (err instanceof Error && err.message === 'SESSION_NOT_FOUND') {
      return reply.code(404).send({ error: 'Session not found', statusCode: 404 })
    }
    if (err instanceof Error && err.message === 'SESSION_NOT_PENDING') {
      return reply.code(409).send({ error: 'Session is not pending', statusCode: 409 })
    }
    throw err
  }
}

export async function reject(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    await rejectSession(parseInt(request.params.id, 10))
    return reply.send({ ok: true })
  } catch (err) {
    if (err instanceof Error && err.message === 'SESSION_NOT_FOUND') {
      return reply.code(404).send({ error: 'Session not found', statusCode: 404 })
    }
    if (err instanceof Error && err.message === 'SESSION_NOT_PENDING') {
      return reply.code(409).send({ error: 'Session is not pending', statusCode: 409 })
    }
    throw err
  }
}
