import { z } from 'zod'

export const PersonalSessionPageSchema = z.object({
  page: z.number().int().positive(),
  hasNextPage: z.boolean(),
  sessions: z.array(z.object({
    id: z.number().int(),
    createdAt: z.string().datetime(),
    gameName: z.string(),
    gameTypeName: z.string(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
    submittedScore: z.number(),
    creditedPoints: z.number(),
  })),
})
export type PersonalSessionPage = z.infer<typeof PersonalSessionPageSchema>

export const LeaderboardEntrySchema = z.object({
  userId: z.number(),
  login: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  totalScore: z.number(),
})

export const GameLeaderboardEntrySchema = z.object({
  userId: z.number(),
  login: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  gameScore: z.number(),
})

export const GameScoreSummarySchema = z.object({
  videoGameId: z.number(),
  nom: z.string(),
  imageUrl: z.string().nullable(),
  totalScore: z.number(),
})

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>
export type GameLeaderboardEntry = z.infer<typeof GameLeaderboardEntrySchema>
export type GameScoreSummary = z.infer<typeof GameScoreSummarySchema>
