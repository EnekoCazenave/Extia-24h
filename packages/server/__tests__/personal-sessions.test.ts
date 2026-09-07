import {beforeEach, describe, expect, it, vi} from 'vitest'
import {buildApp} from '../src/app.js'

const db = vi.hoisted(() => ({$queryRaw: vi.fn(), gameSession: {findMany: vi.fn()}}))
vi.mock('../src/lib/prisma.js', () => ({prisma: db}))

describe('Personal sessions', () => {
  beforeEach(() => { vi.resetAllMocks(); db.$queryRaw.mockResolvedValue([{rank: 1n, userId: 7, totalScore: 0n}]) })

  it('paginates only the authenticated user submissions and returns credited points', async () => {
    db.gameSession.findMany.mockResolvedValue(Array.from({length: 21}, (_, id) => ({
      id, createdAt: new Date('2026-09-07'), status: 'APPROVED', score: 50,
      gameType: {name: 'Solo', videoGame: {nom: 'Jeu'}}, userGames: [{score: 100}],
    })))
    const app = await buildApp({logger: false})
    try {
      await app.ready()
      const token = app.jwt.sign({sub: 7, email: 'test@test.fr', roleId: 1})
      const response = await app.inject({method: 'GET', url: '/api/leaderboard/me?page=2&userId=8', cookies: {access_token: token}})
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({page: 2, hasNextPage: true})
      expect(response.json().sessions).toHaveLength(20)
      expect(response.json().sessions[0]).toMatchObject({submittedScore: 50, creditedPoints: 100})
      expect(db.gameSession.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {submitterId: 7}, skip: 20, take: 21,
        orderBy: [{createdAt: 'desc'}, {id: 'desc'}],
        select: expect.objectContaining({userGames: {where: {userId: 7}, select: {score: true}}}),
      }))
    } finally { await app.close() }
  })

  it.each(['0', '-1', '1.5', 'abc', '100001'])('rejects invalid page %s', async (page) => {
    const app = await buildApp({logger: false})
    try {
      await app.ready()
      const token = app.jwt.sign({sub: 7, email: 'test@test.fr', roleId: 1})
      const response = await app.inject({method: 'GET', url: `/api/leaderboard/me?page=${page}`, cookies: {access_token: token}})
      expect(response.statusCode).toBe(400)
      expect(db.gameSession.findMany).not.toHaveBeenCalled()
    } finally { await app.close() }
  })

  it('requires authentication', async () => {
    const app = await buildApp({logger: false})
    try {
      expect((await app.inject({method: 'GET', url: '/api/leaderboard/me'})).statusCode).toBe(401)
      expect(db.gameSession.findMany).not.toHaveBeenCalled()
    } finally { await app.close() }
  })
})
