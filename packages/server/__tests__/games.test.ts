import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildApp } from '../src/app.js'

vi.mock('@prisma/client', () => {
  const mockPrisma = {
    videoGame: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    userGame: {
      groupBy: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  }
  return { PrismaClient: vi.fn(() => mockPrisma) }
})

describe('GET /api/games', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 200 with game list', async () => {
    const { PrismaClient } = await import('@prisma/client')
    const mockPrisma = new (PrismaClient as any)()
    mockPrisma.videoGame.findMany.mockResolvedValue([
      { id: 1, nom: 'League of Legends', imageUrl: null, happyHourStart: null, happyHourEnd: null, gameTypes: [] },
    ])
    mockPrisma.userGame.groupBy.mockResolvedValue([])

    const app = await buildApp({ logger: false })
    await app.ready()
    const res = await app.inject({ method: 'GET', url: '/api/games' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(Array.isArray(body.games)).toBe(true)
    await app.close()
  })
})

describe('GET /api/games/:id', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns 404 when game not found', async () => {
    const { PrismaClient } = await import('@prisma/client')
    const mockPrisma = new (PrismaClient as any)()
    mockPrisma.videoGame.findUnique.mockResolvedValue(null)

    const app = await buildApp({ logger: false })
    await app.ready()
    const res = await app.inject({ method: 'GET', url: '/api/games/999' })
    expect(res.statusCode).toBe(404)
    await app.close()
  })

  it('returns 400 for non-numeric id', async () => {
    const app = await buildApp({ logger: false })
    await app.ready()
    const res = await app.inject({ method: 'GET', url: '/api/games/notanumber' })
    expect(res.statusCode).toBe(400)
    await app.close()
  })
})
