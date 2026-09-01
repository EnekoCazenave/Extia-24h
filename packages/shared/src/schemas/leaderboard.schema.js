import { z } from 'zod';
export const LeaderboardEntrySchema = z.object({
    userId: z.number(),
    login: z.string(),
    firstname: z.string(),
    lastname: z.string(),
    totalScore: z.number(),
});
export const GameLeaderboardEntrySchema = z.object({
    userId: z.number(),
    login: z.string(),
    firstname: z.string(),
    lastname: z.string(),
    gameScore: z.number(),
});
export const GameScoreSummarySchema = z.object({
    videoGameId: z.number(),
    nom: z.string(),
    imageUrl: z.string().nullable(),
    totalScore: z.number(),
});
//# sourceMappingURL=leaderboard.schema.js.map