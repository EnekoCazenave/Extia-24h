import { z } from 'zod'

export const GameTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  calcul: z.string(),
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

export const PlayInputSchema = z.object({
  gameTypeId: z.number().int().positive(),
  score: z.number().int().min(0),
})

export type GameType = z.infer<typeof GameTypeSchema>
export type VideoGame = z.infer<typeof VideoGameSchema>
export type PlayInput = z.infer<typeof PlayInputSchema>
