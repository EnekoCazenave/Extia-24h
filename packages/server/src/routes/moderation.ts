import type { FastifyInstance } from 'fastify'
import { requireModerator } from '../hooks/requireModerator.js'
import { listSessions, approve, reject } from '../controllers/moderation.controller.js'

export async function moderationRoutes(fastify: FastifyInstance) {
  fastify.get('/api/moderation/sessions', { preHandler: [requireModerator] }, listSessions)
  fastify.patch('/api/moderation/sessions/:id/approve', { preHandler: [requireModerator] }, approve)
  fastify.patch('/api/moderation/sessions/:id/reject', { preHandler: [requireModerator] }, reject)
}
