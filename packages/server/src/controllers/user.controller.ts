import type { FastifyRequest, FastifyReply } from 'fastify'
import type { UpdateProfileInput } from '@extia-gaming/shared'
import { updateUserProfile } from '../services/user.service.js'

export async function updateProfile(
  request: FastifyRequest<{ Body: UpdateProfileInput }>,
  reply: FastifyReply,
) {
  const user = await updateUserProfile(request.user.sub, request.body)
  return reply.send({ user })
}
