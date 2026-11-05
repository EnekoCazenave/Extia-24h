import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Prisma } from '@prisma/client'
import { PlayInputSchema, RulesConfigSchema, type RuleValues } from '@extia-gaming/shared'
import { approveSessionInTransaction } from '../src/services/moderation.service.js'

vi.mock('../src/lib/prisma.js', () => ({ prisma: {} }))

describe('Crédit des paliers Clair Obscur', () => {
  const config = RulesConfigSchema.parse({ type: 'RULES', method: 'PROGRESSION', items: [
    { key: 'a', label: 'A', points: 10 }, { key: 'b', label: 'B', points: 20 },
  ], completionBonus: 100, resumedMultiplier: 0.5 })
  const input = (values: RuleValues) => PlayInputSchema.parse({ gameTypeId: 1, calculType: 'RULES', values })
  const tx = {
    siteSettings: { findUnique: vi.fn() },
    gameSession: { findUnique: vi.fn(), updateMany: vi.fn() },
    userGame: { findMany: vi.fn(), aggregate: vi.fn(), create: vi.fn() },
  }

  beforeEach(() => {
    vi.resetAllMocks()
    tx.siteSettings.findUnique.mockResolvedValue({ proofRequired: false })
    tx.gameSession.updateMany.mockResolvedValue({ count: 1 })
    tx.userGame.findMany.mockResolvedValue([])
    tx.userGame.aggregate.mockResolvedValue({ _sum: { score: 0 } })
  })

  async function approve(values: RuleValues, overrides: { config?: object; factor?: number; limit?: number; members?: number[] } = {}) {
    const frozenConfig = { ...config, ...overrides.config }
    const session = { id: 2, status: 'PENDING', submitterId: 7, gameTypeId: 1, createdAt: new Date(),
      teamMembers: (overrides.members ?? []).map(userId => ({ userId })),
      gameType: { videoGameId: 1, videoGame: {}, maxPointsPerUser: overrides.limit ?? null, calculConfig: frozenConfig },
      scoringData: { config: frozenConfig, input: input(values), happyHourMultiplier: overrides.factor ?? 1 },
    }
    tx.gameSession.findUnique.mockResolvedValue(session)
    await approveSessionInTransaction(tx as unknown as Prisma.TransactionClient, session.id)
    return tx.userGame.create.mock.calls.map(([args]) => args.data.score)
  }

  it.each([
    ['départ sans fin', { start: 0, end: 1, resumed: 0, completed: 0 }, 10],
    ['intervalle intermédiaire', { start: 1, end: 2, resumed: 0, completed: 0 }, 20],
    ['dernier palier sans histoire terminée', { start: 0, end: 2, resumed: 0, completed: 0 }, 30],
    ['histoire complète', { start: 0, end: 2, resumed: 0, completed: 1 }, 130],
    ['reprise', { start: 0, end: 2, resumed: 1, completed: 1 }, 15],
    ['fin sans début crédité', { start: 1, end: 2, resumed: 0, completed: 1 }, 20],
  ] as const)('%s : crédite les points du participant', async (_name, values, expected) => {
    expect(await approve(values)).toEqual([expected])
  })

  it.each([0, 1])('progression en plusieurs sessions, fin déclarée = %i', async completed => {
    tx.userGame.findMany.mockResolvedValue([{ gameSession: { scoringData: { input: input({ start: 0, end: 1, resumed: 0, completed: 0 }) } } }])
    expect(await approve({ start: 1, end: 2, resumed: 0, completed })).toEqual([completed ? 120 : 20])
  })

  it('applique les coefficients et la happy hour au bonus historique', async () => {
    tx.userGame.findMany.mockResolvedValue([{ gameSession: { scoringData: { input: input({ start: 0, end: 1, resumed: 0, completed: 0 }) } } }])
    expect(await approve({ start: 1, end: 2, resumed: 0, completed: 1 }, { factor: 2,
      config: { participantCoefficients: [{ participants: 2, coefficient: 1.5 }] }, members: [8],
    })).toEqual([360, 360])
  })

  it('conserve le calcul des anciennes déclarations en attente sans champ de fin', async () => {
    expect(await approve({ start: 0, end: 2, resumed: 0 })).toEqual([130])
  })

  it('crédite seulement le solde après plafond, y compris zéro si épuisé', async () => {
    tx.userGame.aggregate.mockResolvedValue({ _sum: { score: 25 } })
    expect(await approve({ start: 0, end: 2, resumed: 0, completed: 1 }, { limit: 30 })).toEqual([5])
    tx.userGame.create.mockClear()
    expect(await approve({ start: 0, end: 2, resumed: 0, completed: 1 }, { limit: 25 })).toEqual([0])
  })

  it('un barème de paliers à zéro crédite zéro avant la fin, puis seulement le bonus', async () => {
    const zero = { items: config.items.map(item => ({ ...item, points: 0 })) }
    expect(await approve({ start: 0, end: 1, resumed: 0, completed: 0 }, { config: zero })).toEqual([0])
    tx.userGame.create.mockClear()
    expect(await approve({ start: 0, end: 2, resumed: 0, completed: 1 }, { config: zero })).toEqual([100])
  })

  it('refuse un intervalle vide et un palier déjà récompensé', async () => {
    await expect(approve({ start: 1, end: 1, resumed: 0, completed: 0 })).rejects.toThrow('paliers')
    tx.userGame.findMany.mockResolvedValue([{ gameSession: { scoringData: { input: input({ start: 0, end: 1, resumed: 0, completed: 0 }) } } }])
    await expect(approve({ start: 0, end: 2, resumed: 0, completed: 1 })).rejects.toThrow('déjà récompensés')
    expect(tx.userGame.create).not.toHaveBeenCalled()
  })
})
