import { prisma } from '../lib/prisma.js'
import type { UpdateProfileInput } from '@extia-gaming/shared'

export async function getAllUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, login: true },
    orderBy: [{ login: 'asc' }, { id: 'asc' }],
  })
  return users
}

export async function updateUserProfile(userId: number, data: UpdateProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.statisticsConsent !== undefined && {
        statisticsConsent: data.statisticsConsent,
        statisticsConsentUpdatedAt: new Date(),
        statisticsConsentVersion: '2026-10-16',
      }),
      ...(data.login !== undefined && { login: data.login }),
      ...(data.firstname !== undefined && { firstname: data.firstname }),
      ...(data.lastname !== undefined && { lastname: data.lastname }),
    },
    include: { role: true },
  })
  const { password: _, ...userPublic } = user
  return userPublic
}
