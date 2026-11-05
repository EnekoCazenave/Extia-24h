import { describe, it, expect, vi } from 'vitest'
import { RulesConfigSchema, PlayInputSchema } from '@extia-gaming/shared'
vi.mock('../src/lib/prisma.js', () => ({ prisma: { $transaction: vi.fn() } }))
vi.mock('../src/services/honor.service.js', () => ({ honorProgress: vi.fn().mockResolvedValue({}) }))
import { prisma } from '../src/lib/prisma.js'
import { submitPlay } from '../src/services/play.service.js'
import { settleEvent } from '../src/services/event-scoring.service.js'
import { approveSessionInTransaction } from '../src/services/moderation.service.js'

async function approve(options: { version?: number; cap?: number; previous?: number; method?: 'COUNTER' | 'PROGRESSION'; factor?: number; won?: number } = {}) {
  const progression = options.method === 'PROGRESSION'
  const config = RulesConfigSchema.parse({ type: 'RULES', method: options.method ?? 'COUNTER', items: [{ key: 'badge', label: 'Badge', points: progression ? 1.1 : 10 }], completionBonus: progression ? 0.1 : 20 })
  const input = PlayInputSchema.parse({ gameTypeId: 1, calculType: 'RULES', values: progression ? { start: 0, end: 1, resumed: 0, completed: options.won ?? 1 } : { item_badge: 1, completed: 1 } })
  const session = { id: 1, submitterId: 1, teamMembers: [], status: 'PENDING', createdAt: new Date(), score: 30, gameTypeId: 1,
    scoringData: { version: options.version, config, input, happyHourMultiplier: options.factor ?? 1 },
    gameType: { calculConfig: config, videoGameId: 1, maxPointsPerUser: options.cap ?? null, videoGame: {} } }
  const tx = { siteSettings: {findUnique: vi.fn().mockResolvedValue({proofRequired:false})}, gameSession: { findUnique: vi.fn().mockResolvedValue(session), updateMany: vi.fn().mockResolvedValue({ count: 1 }), update: vi.fn() }, userGame: { aggregate: vi.fn().mockResolvedValue({ _sum: { score: options.previous ?? 0 } }), findMany: vi.fn().mockResolvedValue([]), create: vi.fn() } }
  await approveSessionInTransaction(tx as never, 1)
  return tx
}

describe('Real approval seam without database', () => {
  it('reproduces Pokemon +2 via remaining cap and records its cause', async () => {
    const tx = await approve({ version: 2, cap: 100, previous: 98 })
    expect(tx.userGame.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ score: 2 }) }))
    expect(tx.gameSession.update.mock.calls[0][0].data.scoringData.credits[0]).toMatchObject({ calculated: 30, requested: 30, score: 2, limits: [{ scope: 'type', maximum: 100, previous: 98, remaining: 2 }] })
  })
  it('awards full Pokemon objectives plus completion when no cap applies', async () => {
    const tx = await approve({ version: 2 })
    expect(tx.userGame.create.mock.calls[0][0].data.score).toBe(30)
  })
  it('keeps explicit Clair Obscur completion and rounds after happy hour', async () => {
    const tx = await approve({ version: 2, method: 'PROGRESSION', factor: 2 })
    expect(tx.userGame.create.mock.calls[0][0].data.score).toBe(3)
    expect(tx.gameSession.update.mock.calls[0][0].data.scoringData.credits[0].calculated).toBeCloseTo(2.4)
    const incomplete = await approve({ version: 2, method: 'PROGRESSION', factor: 2, won: 0 })
    expect(incomplete.gameSession.update.mock.calls[0][0].data.scoringData.credits[0].calculated).toBeCloseTo(2.2)
    const legacy = await approve({ method: 'PROGRESSION', factor: 2 })
    expect(legacy.userGame.create.mock.calls[0][0].data.score).toBe(2.4)
    expect(legacy.gameSession.update).not.toHaveBeenCalled()
  })
  it('does not credit a fractional legacy remainder for a v2 declaration', async () => {
    const tx = await approve({ version: 2, cap: 100, previous: 97.5 })
    expect(tx.userGame.create.mock.calls[0][0].data.score).toBe(2)
  })
})


describe('Submission and event entry points without database', () => {
  it('freezes version 2 and raw awards; the stored total matches the final individual gains', async () => {
    const config = { type: 'NUMBER', multiplier: 1.1 }
    let snapshot: unknown
    const gameType = { id: 1, calculType: 'NUMBER', calculConfig: config, team: false, videoGameId: 1, videoGame: { happyHourStart: new Date(Date.now() - 60000), happyHourEnd: new Date(Date.now() + 60000) } }
    const tx = { siteSettings: {findUnique: vi.fn().mockResolvedValue({proofRequired:false})}, gameType: { findUnique: vi.fn().mockResolvedValue(gameType) }, gameSession: {
      create: vi.fn().mockImplementation(async ({ data }) => { snapshot = data.scoringData; return { id: 1 } }),
      findUnique: vi.fn().mockImplementation(async () => ({ id: 1, submitterId: 1, teamMembers: [], status: 'PENDING', gameTypeId: 1, createdAt: new Date(), gameType, scoringData: snapshot })),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }), update: vi.fn(),
    }, userGame: { create: vi.fn() } }
    vi.mocked(prisma.$transaction).mockImplementation(async (work: any) => work(tx))
    await submitPlay(1, PlayInputSchema.parse({ gameTypeId: 1, calculType: 'NUMBER', value: 1 }))
    expect(tx.gameSession.create.mock.calls[0][0].data).toMatchObject({ score: 3, scoringData: { version: 2, awards: [{ userId: 1, score: 1.1 }], happyHourMultiplier: 2 } })
    expect(tx.userGame.create.mock.calls[0][0].data.score).toBe(3)
  })
  it('rounds event pot awards individually on settlement', async () => {
    const tx = { event: { findUnique: vi.fn().mockResolvedValue({ endsAt: new Date(Date.now() - 60000), settledAt: null, pointsEarned: 1, winnerShare: 0.05, userEvents: [{ userId: 1 }, { userId: 2 }, { userId: 3 }] }), update: vi.fn() }, eventAward: { createMany: vi.fn() } }
    vi.mocked(prisma.$transaction).mockImplementation(async (work: any) => work(tx))
    expect((await settleEvent(1, 1)).map(award => award.score)).toEqual([2, 1, 1])
    expect(tx.eventAward.createMany).toHaveBeenCalledOnce()
  })
})
