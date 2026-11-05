import { beforeEach, describe, expect, it, vi } from 'vitest'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import { Prisma } from '@prisma/client'
import { moderationRoutes } from '../src/routes/moderation.js'

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  userGame: { deleteMany: vi.fn() },
  gameSessionMember: { deleteMany: vi.fn() },
  gameSession: { deleteMany: vi.fn() },
  $transaction: vi.fn(),
}))
vi.mock('../src/lib/prisma.js', () => ({ prisma: db }))

async function createApp() {
  const app = Fastify()
  await app.register(cookie)
  await app.register(jwt, { secret: 'local-tests-only-secret-at-least-32-chars' })
  await app.register(moderationRoutes)
  await app.ready()
  return app
}

beforeEach(() => {
  vi.resetAllMocks()
  db.user.findUnique.mockResolvedValue({ id: 1, email: 'admin@example.invalid', roleId: 2 })
  db.$transaction.mockImplementation(async work => work(db))
  db.userGame.deleteMany.mockResolvedValue({ count: 5 })
  db.gameSessionMember.deleteMany.mockResolvedValue({ count: 2 })
  db.gameSession.deleteMany.mockResolvedValue({ count: 3 })
})

describe('DELETE /api/moderation/sessions', () => {
  it('refuse les visiteurs, joueurs et modérateurs, même avec un ancien jeton admin', async () => {
    const app = await createApp()
    try {
      const token = app.jwt.sign({ sub: 1, email: 'admin@example.invalid', roleId: 2 })
      expect((await app.inject({ method: 'DELETE', url: '/api/moderation/sessions' })).statusCode).toBe(401)
      for (const roleId of [1, 3]) {
        db.user.findUnique.mockResolvedValue({ id: 1, email: 'user@example.invalid', roleId })
        expect((await app.inject({ method: 'DELETE', url: '/api/moderation/sessions', cookies: { access_token: token } })).statusCode).toBe(403)
      }
      expect(db.$transaction).not.toHaveBeenCalled()
      expect(db.userGame.deleteMany).not.toHaveBeenCalled()
      expect(db.gameSessionMember.deleteMany).not.toHaveBeenCalled()
      expect(db.gameSession.deleteMany).not.toHaveBeenCalled()
    } finally { await app.close() }
  })

  it('supprime tous les crédits, membres puis sessions sans appliquer les filtres de la page', async () => {
    const app = await createApp()
    try {
      const token = app.jwt.sign({ sub: 1, email: 'admin@example.invalid', roleId: 2 })
      const response = await app.inject({ method: 'DELETE', url: '/api/moderation/sessions?gameId=7&status=APPROVED', cookies: { access_token: token } })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ deletedCount: 3 })
      expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: 'Serializable' })
      const deletions = [db.userGame.deleteMany, db.gameSessionMember.deleteMany, db.gameSession.deleteMany]
      for (const deletion of deletions) expect(deletion).toHaveBeenCalledWith({})
      expect(deletions.map(deletion => deletion.mock.invocationCallOrder[0])).toEqual(
        [...deletions.map(deletion => deletion.mock.invocationCallOrder[0])].sort((a, b) => a - b),
      )
    } finally { await app.close() }
  })

  it('remonte une erreur de transaction sans annoncer une suppression réussie', async () => {
    const app = await createApp()
    try {
      db.gameSessionMember.deleteMany.mockRejectedValue(new Error('Database unavailable'))
      const token = app.jwt.sign({ sub: 1, email: 'admin@example.invalid', roleId: 2 })
      const response = await app.inject({ method: 'DELETE', url: '/api/moderation/sessions', cookies: { access_token: token } })
      expect(response.statusCode).toBe(500)
      expect(db.gameSession.deleteMany).not.toHaveBeenCalled()
    } finally { await app.close() }
  })

  it('réessaie après un conflit de sérialisation et accepte une base déjà vide', async () => {
    const app = await createApp()
    try {
      db.$transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('concurrent write', { code: 'P2034', clientVersion: 'test' }))
      db.gameSession.deleteMany.mockResolvedValue({ count: 0 })
      const token = app.jwt.sign({ sub: 1, email: 'admin@example.invalid', roleId: 2 })
      const response = await app.inject({ method: 'DELETE', url: '/api/moderation/sessions', cookies: { access_token: token } })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ deletedCount: 0 })
      expect(db.$transaction).toHaveBeenCalledTimes(2)
    } finally { await app.close() }
  })
})
