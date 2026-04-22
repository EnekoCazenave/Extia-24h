import type { FastifyRequest, FastifyReply } from 'fastify'
import type { RegisterInput, LoginInput } from '@extia-gaming/shared'
import {
  registerUser,
  loginUser,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from '../services/auth.service.js'
import { env } from '../env.js'

const COOKIE_BASE = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
}

function setTokenCookies(reply: FastifyReply, accessToken: string, refreshToken: string) {
  reply
    .setCookie('access_token', accessToken, { ...COOKIE_BASE, maxAge: 900 }) // 15min
    .setCookie('refresh_token', refreshToken, { ...COOKIE_BASE, maxAge: 604800 }) // 7d
}

export async function register(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply,
) {
  try {
    const { consentAccepted: _, ...userData } = request.body
    const user = await registerUser(userData)
    const accessToken = request.server.jwt.sign(
      { sub: user.id, email: user.email, roleId: user.roleId },
      { expiresIn: env.JWT_EXPIRES_IN },
    )
    const refreshToken = await createRefreshToken(user.id)
    setTokenCookies(reply, accessToken, refreshToken)
    return reply.code(201).send({ user })
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      return reply.code(409).send({ error: 'Email already in use', statusCode: 409 })
    }
    throw err
  }
}

export async function login(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply,
) {
  try {
    const user = await loginUser(request.body)
    const accessToken = request.server.jwt.sign(
      { sub: user.id, email: user.email, roleId: user.roleId },
      { expiresIn: env.JWT_EXPIRES_IN },
    )
    const refreshToken = await createRefreshToken(user.id)
    setTokenCookies(reply, accessToken, refreshToken)
    return reply.send({ user })
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      return reply.code(401).send({ error: 'Invalid credentials', statusCode: 401 })
    }
    throw err
  }
}

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  const oldToken = request.cookies['refresh_token']
  if (!oldToken) {
    return reply.code(401).send({ error: 'No refresh token', statusCode: 401 })
  }
  try {
    const { user, newToken } = await rotateRefreshToken(oldToken)
    const accessToken = request.server.jwt.sign(
      { sub: user.id, email: user.email, roleId: user.roleId },
      { expiresIn: env.JWT_EXPIRES_IN },
    )
    setTokenCookies(reply, accessToken, newToken)
    return reply.send({ ok: true })
  } catch {
    return reply.code(401).send({ error: 'Invalid or expired refresh token', statusCode: 401 })
  }
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies['refresh_token']
  if (token) await revokeRefreshToken(token)

  reply
    .clearCookie('access_token', { path: '/' })
    .clearCookie('refresh_token', { path: '/' })
  return reply.send({ ok: true })
}
