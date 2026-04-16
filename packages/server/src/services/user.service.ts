import { prisma } from '../lib/prisma.js'
import type { UpdateProfileInput } from '@extia-gaming/shared'

export async function updateUserProfile(userId: number, data: UpdateProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.login !== undefined && { login: data.login }),
      ...(data.firstname !== undefined && { firstname: data.firstname }),
      ...(data.lastname !== undefined && { lastname: data.lastname }),
    },
    include: { role: true },
  })
  const { password: _, ...userPublic } = user
  return userPublic
}
