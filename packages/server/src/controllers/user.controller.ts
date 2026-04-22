import type { FastifyRequest, FastifyReply } from 'fastify'
import type { UpdateProfileInput } from '@extia-gaming/shared'
import { updateUserProfile, getAllUsers } from '../services/user.service.js'

export async function updateProfile(
  request: FastifyRequest<{ Body: UpdateProfileInput }>,
  reply: FastifyReply,
) {
  const user = await updateUserProfile(request.user.sub, request.body)
  return reply.send({ user })
}

export async function listUsers(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const users = await getAllUsers()
  return reply.send({ users })
}
