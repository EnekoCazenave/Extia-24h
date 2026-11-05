import type { FastifyRequest, FastifyReply } from 'fastify'
import type { JWTPayload } from '@extia-gaming/shared'
import { prisma } from '../lib/prisma.js'

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = request.cookies['access_token']
  if (!token) {
    reply.code(401).send({ error: 'Unauthorized', statusCode: 401 })
    return
  }
  let payload: JWTPayload
  try {
    payload = request.server.jwt.verify<JWTPayload>(token)
  } catch {
    reply.code(401).send({ error: 'Token invalid or expired', statusCode: 401 })
    return
  }
  const user = await prisma.user.findUnique({where:{id:payload.sub},select:{id:true,email:true,roleId:true}})
  if (!user) {
    reply.code(401).send({error:'Compte indisponible',statusCode:401})
    return
  }
  // Authorization always reflects the current account, even with an older signed token.
  request.user = {...payload,sub:user.id,email:user.email,roleId:user.roleId}
}
