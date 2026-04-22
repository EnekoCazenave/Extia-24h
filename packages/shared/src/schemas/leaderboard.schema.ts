import { z } from 'zod'

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
