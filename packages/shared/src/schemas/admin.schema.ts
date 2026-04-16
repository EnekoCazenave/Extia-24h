import { z } from 'zod'

export const CreateGameSchema = z.object({
  nom: z.string().min(1).max(100),
  imageUrl: z.string().url().optional(),
  happyHourStart: z.string().datetime().optional(),
  happyHourEnd: z.string().datetime().optional(),
})

export const CreateGameTypeSchema = z.object({
  name: z.string().min(1).max(100),
  calcul: z.string().min(1),
  win: z.string().min(1),
  team: z.boolean().default(false),
})

// Both fields are always required (nullable, not optional) so the update is unambiguous:
// send null to clear, send a datetime string to set.
export const UpdateHappyHourSchema = z.object({
  happyHourStart: z.string().datetime().nullable(),
  happyHourEnd: z.string().datetime().nullable(),
})

export const GrantBonusSchema = z.object({
  userId: z.number().int().positive(),
  points: z.number().int().min(1),
  reason: z.string().max(255).optional(),
})

export type CreateGameInput = z.infer<typeof CreateGameSchema>
export type CreateGameTypeInput = z.infer<typeof CreateGameTypeSchema>
export type UpdateHappyHourInput = z.infer<typeof UpdateHappyHourSchema>
export type GrantBonusInput = z.infer<typeof GrantBonusSchema>
