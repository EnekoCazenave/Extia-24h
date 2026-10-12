import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { CreateGameSchema, UpdateGameSchema, CreateGameTypeSchema, UpdateGameTypeSchema, UpdateHappyHourSchema, GrantBonusSchema } from '@extia-gaming/shared'
import { handleCreateGame, handleUpdateGame, handleDeleteGame, handleAddGameType, handleUpdateGameType, handleDeleteGameType, handleUpdateHappyHour, handleGrantBonus } from '../controllers/admin.controller.js'
import { requireAdmin } from '../hooks/requireAdmin.js'

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  const adminGuard = { preHandler: [requireAdmin] }

  f.post<RouteOf<typeof handleCreateGame>>('/api/admin/games', { ...adminGuard, schema: { body: CreateGameSchema } }, handleCreateGame)
  f.put<RouteOf<typeof handleUpdateGame>>('/api/admin/games/:id', { ...adminGuard, schema: { body: UpdateGameSchema } }, handleUpdateGame)
  f.delete<RouteOf<typeof handleDeleteGame>>('/api/admin/games/:id', adminGuard, handleDeleteGame)
  f.post<RouteOf<typeof handleAddGameType>>('/api/admin/games/:id/game-types', { ...adminGuard, schema: { body: CreateGameTypeSchema } }, handleAddGameType)
  f.put<RouteOf<typeof handleUpdateGameType>>('/api/admin/game-types/:gameTypeId', { ...adminGuard, schema: { body: UpdateGameTypeSchema } }, handleUpdateGameType)
  f.delete<RouteOf<typeof handleDeleteGameType>>('/api/admin/game-types/:gameTypeId', adminGuard, handleDeleteGameType)
  f.put<RouteOf<typeof handleUpdateHappyHour>>('/api/admin/games/:id/happy-hour', { ...adminGuard, schema: { body: UpdateHappyHourSchema } }, handleUpdateHappyHour)
  f.post<RouteOf<typeof handleGrantBonus>>('/api/admin/bonuses', { ...adminGuard, schema: { body: GrantBonusSchema } }, handleGrantBonus)
}

type RouteOf<T> = T extends (request: FastifyRequest<infer R>, reply: FastifyReply) => unknown ? R : never
