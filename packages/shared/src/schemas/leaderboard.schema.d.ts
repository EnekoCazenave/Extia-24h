import { z } from 'zod';
export declare const PersonalSessionPageSchema: z.ZodObject<{
    page: z.ZodNumber;
    hasNextPage: z.ZodBoolean;
    sessions: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        createdAt: z.ZodString;
        gameName: z.ZodString;
        gameTypeName: z.ZodString;
        status: z.ZodEnum<["PENDING", "APPROVED", "REJECTED"]>;
        submittedScore: z.ZodNumber;
        creditedPoints: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        status: "PENDING" | "APPROVED" | "REJECTED";
        id: number;
        createdAt: string;
        gameName: string;
        gameTypeName: string;
        submittedScore: number;
        creditedPoints: number;
    }, {
        status: "PENDING" | "APPROVED" | "REJECTED";
        id: number;
        createdAt: string;
        gameName: string;
        gameTypeName: string;
        submittedScore: number;
        creditedPoints: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    page: number;
    hasNextPage: boolean;
    sessions: {
        status: "PENDING" | "APPROVED" | "REJECTED";
        id: number;
        createdAt: string;
        gameName: string;
        gameTypeName: string;
        submittedScore: number;
        creditedPoints: number;
    }[];
}, {
    page: number;
    hasNextPage: boolean;
    sessions: {
        status: "PENDING" | "APPROVED" | "REJECTED";
        id: number;
        createdAt: string;
        gameName: string;
        gameTypeName: string;
        submittedScore: number;
        creditedPoints: number;
    }[];
}>;
export type PersonalSessionPage = z.infer<typeof PersonalSessionPageSchema>;
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
//# sourceMappingURL=leaderboard.schema.d.ts.map