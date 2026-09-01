import { z } from 'zod';
export declare const CreateGameSchema: z.ZodObject<{
    nom: z.ZodString;
    imageUrl: z.ZodOptional<z.ZodString>;
    happyHourStart: z.ZodOptional<z.ZodString>;
    happyHourEnd: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    nom: string;
    imageUrl?: string | undefined;
    happyHourStart?: string | undefined;
    happyHourEnd?: string | undefined;
}, {
    nom: string;
    imageUrl?: string | undefined;
    happyHourStart?: string | undefined;
    happyHourEnd?: string | undefined;
}>;
export declare const CreateGameTypeSchema: z.ZodObject<{
    name: z.ZodString;
    calcul: z.ZodString;
    win: z.ZodString;
    team: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    calcul: string;
    win: string;
    team: boolean;
}, {
    name: string;
    calcul: string;
    win: string;
    team?: boolean | undefined;
}>;
export declare const UpdateHappyHourSchema: z.ZodObject<{
    happyHourStart: z.ZodNullable<z.ZodString>;
    happyHourEnd: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    happyHourStart: string | null;
    happyHourEnd: string | null;
}, {
    happyHourStart: string | null;
    happyHourEnd: string | null;
}>;
export declare const GrantBonusSchema: z.ZodObject<{
    userId: z.ZodNumber;
    points: z.ZodNumber;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: number;
    points: number;
    reason?: string | undefined;
}, {
    userId: number;
    points: number;
    reason?: string | undefined;
}>;
export type CreateGameInput = z.infer<typeof CreateGameSchema>;
export type CreateGameTypeInput = z.infer<typeof CreateGameTypeSchema>;
export type UpdateHappyHourInput = z.infer<typeof UpdateHappyHourSchema>;
export type GrantBonusInput = z.infer<typeof GrantBonusSchema>;
