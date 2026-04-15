import type { FastifyRequest, FastifyReply } from 'fastify'
import type { JWTPayload } from '@extia-gaming/shared'

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = request.cookies['access_token']
  if (!token) {
    reply.code(401).send({ error: 'Unauthorized', statusCode: 401 })
    return
  }
  try {
    const payload = request.server.jwt.verify<JWTPayload>(token)
    request.user = payload
  } catch {
    reply.code(401).send({ error: 'Token invalid or expired', statusCode: 401 })
  }
}
