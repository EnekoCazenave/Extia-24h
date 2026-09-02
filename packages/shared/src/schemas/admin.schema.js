import { z } from 'zod';
export const CreateGameSchema = z.object({
    nom: z.string().min(1).max(100),
    imageUrl: z.string().min(1).optional(),
    happyHourStart: z.string().datetime().optional(),
    happyHourEnd: z.string().datetime().optional(),
});
export const UpdateGameSchema = z.object({
    nom: z.string().min(1).max(100),
    imageUrl: z.string().nullable().optional(),
    happyHourStart: z.string().datetime().nullable().optional(),
    happyHourEnd: z.string().datetime().nullable().optional(),
});
export const CalculTypeSchema = z.enum(['BOOLEAN', 'NUMBER', 'TIME']);
export const BooleanCalculConfigSchema = z.object({
    type: z.literal('BOOLEAN'),
    trueValue: z.number().int(),
    falseValue: z.number().int(),
});
export const NumberCalculConfigSchema = z.object({
    type: z.literal('NUMBER'),
    multiplier: z.number().positive(),
});
export const TimeTierSchema = z.object({
    timeSeconds: z.number().int().positive(),
    points: z.number().int(),
});
export const TimeCalculConfigSchema = z.object({
    type: z.literal('TIME'),
    tiers: z.array(TimeTierSchema).min(1),
});
export const CalculConfigSchema = z.discriminatedUnion('type', [
    BooleanCalculConfigSchema,
    NumberCalculConfigSchema,
    TimeCalculConfigSchema,
]);
export const CreateGameTypeSchema = z.object({
    name: z.string().min(1).max(100),
    calculConfig: CalculConfigSchema,
    win: z.string().min(1),
    team: z.boolean().default(false),
});
export const UpdateGameTypeSchema = CreateGameTypeSchema;
// Both fields are always required (nullable, not optional) so the update is unambiguous:
// send null to clear, send a datetime string to set.
export const UpdateHappyHourSchema = z.object({
    happyHourStart: z.string().datetime().nullable(),
    happyHourEnd: z.string().datetime().nullable(),
});
export const GrantBonusSchema = z.object({
    userId: z.number().int().positive(),
    points: z.number().int().min(1),
    reason: z.string().max(255).optional(),
});
//# sourceMappingURL=admin.schema.js.map