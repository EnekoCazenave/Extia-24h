import type { FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from './authenticate.js'

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply)
  if (reply.sent) return // authenticate already replied with 401
  if (request.user.roleId !== 2) {
    return reply.code(403).send({ error: 'Forbidden', statusCode: 403 })
  }
}
