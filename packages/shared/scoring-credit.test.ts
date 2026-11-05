import { describe, expect, it } from 'vitest'
import { computeAwards, computeScore, creditScore, finalGain, objectiveKey, previewCredits, PlayInputSchema, RulesConfigSchema, CreateGameTypeSchema } from './src/index.js'

describe('Final gain policy', () => {
  it('rounds once after happy hour and preserves legacy/negative values', () => {
    const input = PlayInputSchema.parse({ gameTypeId: 1, calculType: 'NUMBER', value: 1 })
    expect(computeAwards({ type: 'NUMBER', multiplier: 1.1 }, input, [1])[0].score).toBe(1)
    const raw = computeAwards({ type: 'NUMBER', multiplier: 1.1 }, input, [1], true)[0].score
    expect(finalGain(raw * 2, 2)).toBe(3)
    expect(finalGain(1.1)).toBe(1.1)
    expect(finalGain(-1.1, 2)).toBe(-1.1)
    expect(finalGain(0, 2)).toBe(0)
    expect(finalGain(0.1 * 3 * 10, 2)).toBe(3)
    expect(finalGain(0.00000001, 2)).toBe(1)
  })
  it('preserves sub-millionth gains through the raw score entry point', () => {
    const config = RulesConfigSchema.parse({ type: 'RULES', method: 'SCORE', scoreMultiplier: 0.00000001 })
    const input = PlayInputSchema.parse({ gameTypeId: 1, calculType: 'RULES', values: { score: 1 } })
    expect(computeScore(config, input)).toBe(0)
    expect(computeScore(config, input, true)).toBe(0.00000001)
    expect(finalGain(computeScore(config, input, true), 2)).toBe(1)
  })
  it('respects both caps and floors legacy remainders only for new declarations', () => {
    const limits = [{ scope: 'game' as const, maximum: 100, previous: 50 }, { scope: 'type' as const, maximum: 12.5, previous: 10 }]
    expect(creditScore(15.2, limits, 2)).toMatchObject({ requested: 16, score: 2, limits: [{ scope: 'type', remaining: 2.5 }] })
    expect(creditScore(15.2, limits).score).toBe(2.5)
    expect(creditScore(1, [{ scope: 'type', maximum: 10, previous: 9.5 }], 2).score).toBe(0)
  })
  it('rounds each pot allocation at final gain (pot may increase)', () => {
    const config = RulesConfigSchema.parse({ type: 'RULES', method: 'MINIGAME', attendancePoints: 1, winnerShare: 0.05 })
    const input = PlayInputSchema.parse({ gameTypeId: 1, calculType: 'RULES', values: { winnerId: 1 } })
    expect(computeAwards(config, input, [1, 2, 3], true).map(a => finalGain(a.score, 2))).toEqual([2, 1, 1])
  })
  it('validates integer new caps while allowing legacy snapshot reads', () => {
    const calculConfig = RulesConfigSchema.parse({ type: 'RULES', method: 'MATCH', maxPoints: 12.5 })
    expect(calculConfig.maxPoints).toBe(12.5)
    const form = { name: 'Mode', win: 'Victoire', calculConfig }
    expect(CreateGameTypeSchema.safeParse(form).success).toBe(false)
    expect(CreateGameTypeSchema.safeParse({ ...form, calculConfig: { ...calculConfig, maxPoints: 12 }, maxPointsPerUser: 12.5 }).success).toBe(false)
  })
  it('generates deterministic unique import keys', () => {
    expect(objectiveKey('Ligue Pokémon', [])).toBe('ligue_pokemon')
    expect(objectiveKey('Ligue Pokémon', ['ligue_pokemon'])).toBe('ligue_pokemon_2')
    expect(objectiveKey('!!!', [])).toBe('objectif')
  })
  it('previews discrepancies from saved awards without inferring a missing credit', () => {
    expect(previewCredits({ awards: [{ userId: 1, score: 20 }], happyHourMultiplier: 2 }, [{ userId: 1, score: 2 }])[0]).toMatchObject({ calculated: 40, score: 2, difference: 38, limits: [] })
    expect(previewCredits(null, [{ userId: 1, score: 2 }])[0].calculated).toBeNull()
  })
})
