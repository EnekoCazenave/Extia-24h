import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PlayInput } from '@extia-gaming/shared'
import { ScoringError } from '@extia-gaming/shared'
import { submitPlay, getEditableSession, PlaySessionError } from '../services/play.service.js'

export async function play(
  request: FastifyRequest<{ Body: PlayInput; Params?: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const session = await submitPlay(request.user.sub, request.body, request.params?.id ? Number(request.params.id) : undefined)
    return reply.code(request.params?.id ? 200 : 201).send({ session })
  } catch (err) {
    if (err instanceof PlaySessionError) return reply.code(err.statusCode).send({error:err.message,statusCode:err.statusCode})
    if (err instanceof ScoringError) return reply.code(400).send({ error: err.message, statusCode: 400 })
    if (err instanceof Error && err.message === 'GAME_TYPE_NOT_FOUND') {
      return reply.code(404).send({ error: 'Game type not found', statusCode: 404 })
    }
    if (err instanceof Error && err.message === 'CALCUL_TYPE_MISMATCH') {
      return reply.code(400).send({ error: 'Calcul type mismatch with game type configuration', statusCode: 400 })
    }
    throw err
  }
}

export async function editablePlay(request: FastifyRequest<{Params:{id:string}}>, reply: FastifyReply) {
  try { return reply.send({session:await getEditableSession(request.user.sub,Number(request.params.id))}) }
  catch (error) {
    if(error instanceof PlaySessionError) return reply.code(error.statusCode).send({error:error.message,statusCode:error.statusCode})
    throw error
  }
}
