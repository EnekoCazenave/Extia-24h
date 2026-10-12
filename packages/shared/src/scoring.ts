import type { CalculConfig } from './schemas/admin.schema.js'
import type { PlayInput } from './schemas/game.schema.js'
import { scoreFields, type RulesConfig, type RuleValues } from './schemas/scoring.schema.js'

export class ScoringError extends Error {}
export const roundScore = (value: number) => Math.round(value * 1e6) / 1e6

function requireValue(values: RuleValues, key: string, integer = false): number {
  const value = values[key]
  if (value === undefined || !Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value)))
    throw new ScoringError(`Valeur invalide : ${key}`)
  return value
}

function flag(values: RuleValues, key: string): boolean {
  const value = requireValue(values, key, true)
  if (value > 1) throw new ScoringError(`Valeur oui/non invalide : ${key}`)
  return value === 1
}

function multiplier(config: RulesConfig, count: number, mode?: string): number {
  const entry = config.participantCoefficients.find(row => row.participants === count)
  if (config.participantCoefficients.length && !entry) throw new ScoringError('Aucun coefficient configuré pour ce nombre de participants')
  const variant = config.modes.find(row => row.key === mode)
  if (config.modes.length && !variant) throw new ScoringError('Sélectionnez un mode configuré')
  return (entry?.coefficient ?? 1) * (variant?.coefficient ?? 1)
}

function individualScore(config: RulesConfig, values: RuleValues, mode?: string): number {
  for (const field of scoreFields(config)) {
    if (field.key === 'communityCompleted' || field.key === 'winnerId') continue
    if (field.kind === 'boolean') flag(values, field.key)
    else requireValue(values, field.key)
  }
  const resources = (loss = false) => config.items.reduce((sum, item) => sum + requireValue(values, `item_${item.key}`, config.method === 'COUNTER') * (loss ? item.lossPoints : item.points), 0)
  switch (config.method) {
    case 'MATCH': return flag(values, 'won') ? config.winPoints : config.lossPoints
    case 'RUN': {
      const level = requireValue(values, 'difficulty', true)
      if (config.difficultyPoints.length && level >= config.difficultyPoints.length) throw new ScoringError('Difficulté non configurée')
      return (flag(values, 'won') ? config.winPoints : config.lossPoints) * (1 + level * config.difficultyStep) + (config.difficultyPoints[level] ?? 0)
    }
    case 'HADES': {
      const won = flag(values, 'won'), first = flag(values, 'firstWin')
      if (first && !won) throw new ScoringError('Une première réussite nécessite une victoire')
      return (won ? config.winPoints : config.lossPoints) * (1 + requireValue(values, 'difficulty', true) * config.difficultyStep) + (first ? config.firstWinBonus : resources())
    }
    case 'HUNT': {
      const won = flag(values, 'won')
      const tier = [...config.timeTiers].sort((a, b) => a.seconds - b.seconds).find(t => requireValue(values, 'seconds') <= t.seconds)
      return (won ? config.winPoints : config.lossPoints) + resources(!won) + (!won ? tier?.points ?? 0 : 0)
    }
    case 'SCORE': return requireValue(values, 'score') * config.scoreMultiplier
    case 'COUNTER': return resources() + (flag(values, 'completed') ? config.completionBonus : 0)
    case 'SIMRACING': return resources()
    case 'MINECRAFT': return resources()
    case 'PROGRESSION': {
      const start = requireValue(values, 'start', true), end = requireValue(values, 'end', true)
      if (end <= start || end > config.items.length) throw new ScoringError('Les paliers de progression sont invalides')
      const resumed = flag(values, 'resumed')
      const base = config.items.slice(start, end).reduce((sum, item) => sum + item.points, 0)
      return base * (resumed ? config.resumedMultiplier : 1) + (!resumed && start === 0 && end === config.items.length ? config.completionBonus : 0)
    }
    case 'BATTLE_ROYALE': {
      const rank = requireValue(values, 'rank', true), total = requireValue(values, 'total', true)
      if (rank < 1 || total < 2 || rank > total) throw new ScoringError('Classement ou taille de partie invalide')
      // The PDF explicitly awards the full maximum to first place; other ranks use rank / total.
      return rank === 1 ? config.maxRankPoints : config.maxRankPoints * (1 - rank / total) ** 2
    }
    case 'TFT': {
      const rank = requireValue(values, 'rank', true)
      const ranks = config.modes.find(row => row.key === mode)?.ranks
      if (!ranks || rank < 1 || rank > ranks.length) throw new ScoringError('Classement non configuré pour ce mode')
      return ranks[rank - 1]
    }
    case 'MINIGAME': return 0
  }
}

/** Split a pot in millionths so the sum of awards exactly matches the rounded pot. */
function splitPot(pot: number, weights: number[]): number[] {
  if (!Number.isFinite(pot) || pot < 0 || pot > 1e9) throw new ScoringError('Pot hors limites')
  const units = Math.round(pot * 1e6), total = weights.reduce((a, b) => a + b, 0)
  if (!total) return weights.map(() => 0)
  const exact = weights.map(w => units * w / total), awards = exact.map(Math.floor)
  const order = exact.map((v, i) => ({ i, fraction: v - awards[i] })).sort((a, b) => b.fraction - a.fraction)
  const remainder = units - awards.reduce((a, b) => a + b, 0)
  for (let i = 0; i < remainder; i++) awards[order[i].i]++
  return awards.map(v => v / 1e6)
}

export function computeAwards(config: CalculConfig, input: PlayInput, userIds: number[]): Array<{ userId: number; score: number }> {
  if (!userIds.length || new Set(userIds).size !== userIds.length) throw new ScoringError('Participants dupliqués ou absents')
  if (config.type !== 'RULES' || input.calculType !== 'RULES') return userIds.map(userId => ({ userId, score: computeScore(config, input) }))
  if (new Set(config.items.map(i => i.key)).size !== config.items.length || new Set(config.modes.map(i => i.key)).size !== config.modes.length || new Set(config.participantCoefficients.map(i => i.participants)).size !== config.participantCoefficients.length)
    throw new ScoringError('Clés de barème dupliquées')
  const coefficient = multiplier(config, userIds.length, input.mode)
  if (input.results && (input.results.length !== userIds.length || new Set(input.results.map(r => r.userId)).size !== userIds.length || input.results.some(r => !userIds.includes(r.userId))))
    throw new ScoringError('Les résultats doivent couvrir exactement les participants')
  let scores: number[]
  if (config.method === 'MINIGAME') {
    const winner = requireValue(input.values, 'winnerId', true)
    if (!userIds.includes(winner)) throw new ScoringError('Le vainqueur doit être un participant')
    const pot = config.attendancePoints * userIds.length * coefficient
    const bonus = roundScore(pot * config.winnerShare)
    scores = splitPot(roundScore(pot) - bonus, userIds.map(() => 1))
    scores[userIds.indexOf(winner)] += bonus
  } else {
    if (['MINECRAFT', 'SIMRACING', 'SCORE', 'TFT'].includes(config.method) && userIds.length > 1 && !input.results)
      throw new ScoringError('Des résultats individuels sont requis pour chaque participant')
    scores = userIds.map(userId => individualScore(config, input.results?.find(r => r.userId === userId)?.values ?? input.values, input.mode) * coefficient)
    if (config.method === 'MINECRAFT' && flag(input.values, 'communityCompleted')) {
      const weights = scores.map(score => score >= config.eligibilityScore ? (config.communitySplit === 'EQUAL' ? 1 : score) : 0)
      const bonuses = splitPot(config.communityPool, weights)
      scores = scores.map((score, i) => score + bonuses[i])
    }
  }
  if (scores.some(v => !Number.isFinite(v) || v < 0 || v > 1e9)) throw new ScoringError('Score hors limites')
  return userIds.map((userId, i) => ({ userId, score: roundScore(scores[i]) }))
}

export function computeScore(config: CalculConfig, input: PlayInput): number {
  if (config.type === 'RULES' && input.calculType === 'RULES') return computeAwards(config, input, [1])[0].score
  if (config.type === 'BOOLEAN' && input.calculType === 'BOOLEAN') {
    return input.value ? config.trueValue : config.falseValue
  }
  if (config.type === 'NUMBER' && input.calculType === 'NUMBER') {
    return Math.round(input.value * config.multiplier)
  }
  if (config.type === 'TIME' && input.calculType === 'TIME') {
    const sorted = [...config.tiers].sort((a, b) => a.timeSeconds - b.timeSeconds)
    const tier = sorted.find((t) => input.timeSeconds <= t.timeSeconds)
    return tier ? tier.points : 0
  }
  throw new Error('CALCUL_TYPE_MISMATCH')
}
