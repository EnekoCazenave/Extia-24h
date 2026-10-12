import { z } from 'zod'

const amount = z.number().finite().nonnegative().max(1e9)
export const ScoringMethodSchema = z.enum(['MATCH', 'RUN', 'HADES', 'HUNT', 'SCORE', 'COUNTER', 'PROGRESSION', 'BATTLE_ROYALE', 'TFT', 'SIMRACING', 'MINECRAFT', 'MINIGAME'])
export const RuleItemSchema = z.object({ key: z.string().regex(/^[a-zA-Z0-9_-]+$/).max(60), label: z.string().min(1).max(100), points: amount, lossPoints: amount.default(0) })
export const RulesConfigSchema = z.object({
  type: z.literal('RULES'),
  method: ScoringMethodSchema,
  winPoints: amount.default(0), lossPoints: amount.default(0),
  difficultyPoints: z.array(amount).max(1000).default([]),
  difficultyStep: amount.default(0), firstWinBonus: amount.default(0),
  completionBonus: amount.default(0), resumedMultiplier: amount.default(1),
  maxPoints: amount.nullable().default(null),
  participantCoefficients: z.array(z.object({ participants: z.number().int().min(1).max(1000), coefficient: amount })).max(1000).default([]),
  modes: z.array(z.object({ key: z.string().regex(/^[a-zA-Z0-9_-]+$/), label: z.string().min(1), coefficient: amount, ranks: z.array(amount).max(1000).default([]) })).max(100).default([]),
  items: z.array(RuleItemSchema).max(500).default([]),
  timeTiers: z.array(z.object({ seconds: z.number().int().positive(), points: amount })).max(100).default([]),
  maxRankPoints: amount.default(60), scoreMultiplier: amount.default(1),
  attendancePoints: amount.default(0), winnerShare: z.number().min(0).max(1).default(0.05),
  communityPool: amount.default(0), eligibilityScore: amount.default(0),
  communitySplit: z.enum(['EQUAL', 'PROPORTIONAL']).default('EQUAL'),
}).superRefine((config, ctx) => {
  if (new Set(config.items.map(i => i.key)).size !== config.items.length || new Set(config.modes.map(i => i.key)).size !== config.modes.length || new Set(config.participantCoefficients.map(i => i.participants)).size !== config.participantCoefficients.length) ctx.addIssue({ code: 'custom', message: 'Les codes et tailles de groupe doivent être uniques' })
  if (['HADES','HUNT','COUNTER','PROGRESSION','SIMRACING','MINECRAFT'].includes(config.method) && !config.items.length) ctx.addIssue({ code: 'custom', path: ['items'], message: 'Ajoutez au moins un objectif ou une mesure' })
  if (config.method === 'TFT' && (!config.modes.length || config.modes.some(m => !m.ranks.length))) ctx.addIssue({ code: 'custom', path: ['modes'], message: 'Chaque mode TFT doit définir les points par rang' })
})

export const RuleValuesSchema = z.record(z.string().max(60), z.number().finite().nonnegative().max(1e9))
export const RulesPlayShape = {
  calculType: z.literal('RULES'),
  values: RuleValuesSchema.default({}),
  mode: z.string().max(60).optional(),
  results: z.array(z.object({ userId: z.number().int().positive(), values: RuleValuesSchema })).min(1).max(1000).optional(),
}
export type RulesConfig = z.infer<typeof RulesConfigSchema>
export type ScoringMethod = z.infer<typeof ScoringMethodSchema>
export type RuleValues = z.infer<typeof RuleValuesSchema>

export const methodLabels: Record<ScoringMethod, string> = {
  MATCH: 'Affrontement (LoL, FPS, Rocket League, FIFA)', RUN: 'Run et difficulté (Gunfire, WoW)',
  HADES: 'Hadès : run, difficulté et ressources', HUNT: 'Hunt : résultat, ressources et durée',
  SCORE: 'Score et classement (Tetris)', COUNTER: 'Objectifs (PoE2, Peak, Pokémon)',
  PROGRESSION: 'Progression par paliers (Clair Obscur)', BATTLE_ROYALE: 'Battle Royale',
  TFT: 'TFT, dont Double Up', SIMRACING: 'Simracing : données de course',
  MINECRAFT: 'Minecraft : succès et objectifs communs', MINIGAME: 'Mini-jeu : pot de participation et vainqueur',
}

export function defaultRules(method: ScoringMethod): RulesConfig {
  return RulesConfigSchema.parse({ type: 'RULES', method,
    items: ['COUNTER', 'SIMRACING', 'MINECRAFT', 'PROGRESSION', 'HADES', 'HUNT'].includes(method)
      ? [{ key: 'objectif', label: 'Objectif à configurer', points: 0 }] : [],
    modes: method === 'TFT' ? [{ key: 'standard', label: 'Standard', coefficient: 1, ranks: Array(8).fill(0) }, { key: 'double-up', label: 'Double Up', coefficient: 1, ranks: Array(4).fill(0) }] : [],
  })
}

export interface ScoreField { key: string; label: string; kind?: 'boolean' | 'stage'; max?: number }
export function scoreFields(config: RulesConfig): ScoreField[] {
  const method = config.method
  const fields: ScoreField[] = []
  if (['MATCH', 'RUN', 'HADES', 'HUNT'].includes(method)) fields.push({ key: 'won', label: 'Victoire', kind: 'boolean' })
  if (['RUN', 'HADES'].includes(method)) fields.push({ key: 'difficulty', label: 'Niveau de difficulté (0 = base)' })
  if (method === 'HADES') fields.push({ key: 'firstWin', label: 'Première réussite depuis le début du jeu', kind: 'boolean' })
  if (method === 'HUNT') fields.push({ key: 'seconds', label: 'Durée en secondes' })
  if (method === 'SCORE') fields.push({ key: 'score', label: 'Score obtenu' })
  if (['BATTLE_ROYALE', 'TFT'].includes(method)) fields.push({ key: 'rank', label: 'Classement atteint (1 = premier)' })
  if (method === 'BATTLE_ROYALE') fields.push({ key: 'total', label: 'Nombre total de joueurs ou équipes (même unité que le classement)' })
  if (method === 'PROGRESSION') fields.push({ key: 'start', label: 'Palier initial', kind: 'stage' }, { key: 'end', label: 'Palier final', kind: 'stage' }, { key: 'resumed', label: 'Sauvegarde reprise / Nouvelle partie +', kind: 'boolean' })
  if (method === 'COUNTER') fields.push({ key: 'completed', label: 'Objectif final réussi (ex. Ligue Pokémon)', kind: 'boolean' })
  if (method === 'MINECRAFT') fields.push({ key: 'communityCompleted', label: 'Objectif commun atteint', kind: 'boolean' })
  if (method === 'MINIGAME') fields.push({ key: 'winnerId', label: 'Vainqueur' })
  if (['HADES', 'HUNT', 'COUNTER', 'SIMRACING', 'MINECRAFT'].includes(method))
    fields.push(...config.items.map(item => ({ key: `item_${item.key}`, label: item.label, ...(method === 'MINECRAFT' ? { kind: 'boolean' as const } : {}) })))
  return fields
}
