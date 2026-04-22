import type { FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from './authenticate.js'

// roleId 2 = admin, roleId 3 = moderator
export async function requireModerator(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply)
  if (reply.sent) return
  if (request.user.roleId !== 2 && request.user.roleId !== 3) {
    return reply.code(403).send({ error: 'Forbidden', statusCode: 403 })
  }
}
