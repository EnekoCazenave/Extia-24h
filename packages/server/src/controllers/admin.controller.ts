import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CreateGameInput, CreateGameTypeInput, UpdateHappyHourInput, GrantBonusInput } from '@extia-gaming/shared'
import { createGame, addGameType, updateHappyHour, grantBonus } from '../services/admin.service.js'

export async function handleCreateGame(
  request: FastifyRequest<{ Body: CreateGameInput }>,
  reply: FastifyReply,
) {
  const game = await createGame(request.body)
  return reply.code(201).send({ game })
}

export async function handleAddGameType(
  request: FastifyRequest<{ Params: { id: string }; Body: CreateGameTypeInput }>,
  reply: FastifyReply,
) {
  const videoGameId = parseInt(request.params.id, 10)
  if (isNaN(videoGameId)) return reply.code(400).send({ error: 'Invalid game id', statusCode: 400 })
  try {
    const gameType = await addGameType(videoGameId, request.body)
    return reply.code(201).send({ gameType })
  } catch (err) {
    if (err instanceof Error && err.message === 'GAME_NOT_FOUND') {
      return reply.code(404).send({ error: 'Game not found', statusCode: 404 })
    }
    throw err
  }
}

export async function handleUpdateHappyHour(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateHappyHourInput }>,
  reply: FastifyReply,
) {
  const videoGameId = parseInt(request.params.id, 10)
  if (isNaN(videoGameId)) return reply.code(400).send({ error: 'Invalid game id', statusCode: 400 })
  try {
    const game = await updateHappyHour(videoGameId, request.body)
    return reply.send({ game })
  } catch (err) {
    if (err instanceof Error && err.message === 'GAME_NOT_FOUND') {
      return reply.code(404).send({ error: 'Game not found', statusCode: 404 })
    }
    throw err
  }
}

export async function handleGrantBonus(
  request: FastifyRequest<{ Body: GrantBonusInput }>,
  reply: FastifyReply,
) {
  try {
    const bonus = await grantBonus(request.user.sub, request.body)
    return reply.code(201).send({ bonus })
  } catch (err) {
    if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
      return reply.code(404).send({ error: 'User not found', statusCode: 404 })
    }
    throw err
  }
}
