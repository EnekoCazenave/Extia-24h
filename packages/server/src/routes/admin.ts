import type { FastifyInstance } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { CreateGameSchema, CreateGameTypeSchema, UpdateHappyHourSchema, GrantBonusSchema } from '@extia-gaming/shared'
import { handleCreateGame, handleAddGameType, handleUpdateHappyHour, handleGrantBonus } from '../controllers/admin.controller.js'
import { requireAdmin } from '../hooks/requireAdmin.js'

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  const adminGuard = { preHandler: [requireAdmin] }

  f.post('/api/admin/games', { ...adminGuard, schema: { body: CreateGameSchema } }, handleCreateGame)
  f.post('/api/admin/games/:id/game-types', { ...adminGuard, schema: { body: CreateGameTypeSchema } }, handleAddGameType)
  f.put('/api/admin/games/:id/happy-hour', { ...adminGuard, schema: { body: UpdateHappyHourSchema } }, handleUpdateHappyHour)
  f.post('/api/admin/bonuses', { ...adminGuard, schema: { body: GrantBonusSchema } }, handleGrantBonus)
}
