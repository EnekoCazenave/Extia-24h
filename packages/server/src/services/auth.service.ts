import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import type { LoginInput, RegisterInput } from '@extia-gaming/shared'

type RegisterData = Omit<RegisterInput, 'consentAccepted'>

export async function registerUser(input: RegisterData) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new Error('EMAIL_TAKEN')

  const hashedPassword = await bcrypt.hash(input.password, 12)

  const user = await prisma.user.create({
    data: {
      login: input.login,
      email: input.email,
      password: hashedPassword,
      firstname: input.firstname,
      lastname: input.lastname,
      intern: input.intern,
      roleId: 1,
    },
    include: { role: true },
  })

  const { password: _, ...userPublic } = user
  return userPublic
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { role: true },
  })
  if (!user) throw new Error('INVALID_CREDENTIALS')

  const valid = await bcrypt.compare(input.password, user.password)
  if (!valid) throw new Error('INVALID_CREDENTIALS')

  const { password: _, ...userPublic } = user
  return userPublic
}

export async function createRefreshToken(userId: number): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await prisma.refreshToken.create({ data: { token, userId, expiresAt } })
  return token
}

export async function rotateRefreshToken(oldToken: string) {
  const record = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
    include: { user: { include: { role: true } } },
  })
  if (!record || record.expiresAt < new Date()) {
    throw new Error('INVALID_REFRESH_TOKEN')
  }

  await prisma.refreshToken.delete({ where: { token: oldToken } })

  const newToken = await createRefreshToken(record.userId)
  const { password: _, ...userPublic } = record.user
  return { user: userPublic, newToken }
}

export async function revokeRefreshToken(token: string) {
  await prisma.refreshToken
    .delete({ where: { token } })
    .catch(() => {/* already gone — ignore */})
}
