import { z } from 'zod'
import { CalculTypeSchema, CalculConfigSchema } from './admin.schema.js'

export const GameTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  calculType: CalculTypeSchema,
  calculConfig: CalculConfigSchema,
  win: z.string(),
  team: z.boolean(),
  videoGameId: z.number(),
})

export const VideoGameSchema = z.object({
  id: z.number(),
  nom: z.string(),
  imageUrl: z.string().nullable(),
  happyHourStart: z.string().datetime().nullable(),
  happyHourEnd: z.string().datetime().nullable(),
  gameTypes: z.array(GameTypeSchema),
})

const PlayBaseShape = {
  gameTypeId: z.number().int().positive(),
  teamMemberIds: z.array(z.number().int().positive()).optional().default([]),
  proofUrl: z.string().optional(),
}

export const BooleanPlayInputSchema = z.object({
  ...PlayBaseShape,
  calculType: z.literal('BOOLEAN'),
  value: z.boolean(),
})

export const NumberPlayInputSchema = z.object({
  ...PlayBaseShape,
  calculType: z.literal('NUMBER'),
  value: z.number().min(0),
})

export const TimePlayInputSchema = z.object({
  ...PlayBaseShape,
  calculType: z.literal('TIME'),
  timeSeconds: z.number().int().min(0),
})

export const PlayInputSchema = z.discriminatedUnion('calculType', [
  BooleanPlayInputSchema,
  NumberPlayInputSchema,
  TimePlayInputSchema,
])

export const SessionStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

export const GameSessionSchema = z.object({
  id: z.number(),
  submitterId: z.number(),
  submitter: z.object({ id: z.number(), login: z.string(), firstname: z.string(), lastname: z.string() }),
  gameTypeId: z.number(),
  gameType: z.object({
    id: z.number(),
    name: z.string(),
    team: z.boolean(),
    videoGame: z.object({ id: z.number(), nom: z.string() }),
  }),
  score: z.number(),
  proofUrl: z.string().nullable(),
  status: SessionStatusSchema,
  createdAt: z.string(),
  reviewedAt: z.string().nullable(),
  teamMembers: z.array(z.object({
    userId: z.number(),
    user: z.object({ id: z.number(), login: z.string(), firstname: z.string(), lastname: z.string() }),
  })),
})

export type GameType = z.infer<typeof GameTypeSchema>
export type VideoGame = z.infer<typeof VideoGameSchema>
export type PlayInput = z.infer<typeof PlayInputSchema>
export type SessionStatus = z.infer<typeof SessionStatusSchema>
export type GameSession = z.infer<typeof GameSessionSchema>
