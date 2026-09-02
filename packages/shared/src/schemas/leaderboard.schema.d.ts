import { z } from 'zod';
export declare const LeaderboardEntrySchema: z.ZodObject<{
    userId: z.ZodNumber;
    login: z.ZodString;
    firstname: z.ZodString;
    lastname: z.ZodString;
    totalScore: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    login: string;
    firstname: string;
    lastname: string;
    userId: number;
    totalScore: number;
}, {
    login: string;
    firstname: string;
    lastname: string;
    userId: number;
    totalScore: number;
}>;
export declare const GameLeaderboardEntrySchema: z.ZodObject<{
    userId: z.ZodNumber;
    login: z.ZodString;
    firstname: z.ZodString;
    lastname: z.ZodString;
    gameScore: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    login: string;
    firstname: string;
    lastname: string;
    userId: number;
    gameScore: number;
}, {
    login: string;
    firstname: string;
    lastname: string;
    userId: number;
    gameScore: number;
}>;
export declare const GameScoreSummarySchema: z.ZodObject<{
    videoGameId: z.ZodNumber;
    nom: z.ZodString;
    imageUrl: z.ZodNullable<z.ZodString>;
    totalScore: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    nom: string;
    imageUrl: string | null;
    videoGameId: number;
    totalScore: number;
}, {
    nom: string;
    imageUrl: string | null;
    videoGameId: number;
    totalScore: number;
}>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type GameLeaderboardEntry = z.infer<typeof GameLeaderboardEntrySchema>;
export type GameScoreSummary = z.infer<typeof GameScoreSummarySchema>;
