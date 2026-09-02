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
export declare const UpdateGameSchema: z.ZodObject<{
    nom: z.ZodString;
    imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    happyHourStart: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    happyHourEnd: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    nom: string;
    imageUrl?: string | null | undefined;
    happyHourStart?: string | null | undefined;
    happyHourEnd?: string | null | undefined;
}, {
    nom: string;
    imageUrl?: string | null | undefined;
    happyHourStart?: string | null | undefined;
    happyHourEnd?: string | null | undefined;
}>;
export declare const CalculTypeSchema: z.ZodEnum<["BOOLEAN", "NUMBER", "TIME"]>;
export declare const BooleanCalculConfigSchema: z.ZodObject<{
    type: z.ZodLiteral<"BOOLEAN">;
    trueValue: z.ZodNumber;
    falseValue: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "BOOLEAN";
    trueValue: number;
    falseValue: number;
}, {
    type: "BOOLEAN";
    trueValue: number;
    falseValue: number;
}>;
export declare const NumberCalculConfigSchema: z.ZodObject<{
    type: z.ZodLiteral<"NUMBER">;
    multiplier: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "NUMBER";
    multiplier: number;
}, {
    type: "NUMBER";
    multiplier: number;
}>;
export declare const TimeTierSchema: z.ZodObject<{
    timeSeconds: z.ZodNumber;
    points: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timeSeconds: number;
    points: number;
}, {
    timeSeconds: number;
    points: number;
}>;
export declare const TimeCalculConfigSchema: z.ZodObject<{
    type: z.ZodLiteral<"TIME">;
    tiers: z.ZodArray<z.ZodObject<{
        timeSeconds: z.ZodNumber;
        points: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timeSeconds: number;
        points: number;
    }, {
        timeSeconds: number;
        points: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "TIME";
    tiers: {
        timeSeconds: number;
        points: number;
    }[];
}, {
    type: "TIME";
    tiers: {
        timeSeconds: number;
        points: number;
    }[];
}>;
export declare const CalculConfigSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"BOOLEAN">;
    trueValue: z.ZodNumber;
    falseValue: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "BOOLEAN";
    trueValue: number;
    falseValue: number;
}, {
    type: "BOOLEAN";
    trueValue: number;
    falseValue: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"NUMBER">;
    multiplier: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "NUMBER";
    multiplier: number;
}, {
    type: "NUMBER";
    multiplier: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"TIME">;
    tiers: z.ZodArray<z.ZodObject<{
        timeSeconds: z.ZodNumber;
        points: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        timeSeconds: number;
        points: number;
    }, {
        timeSeconds: number;
        points: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "TIME";
    tiers: {
        timeSeconds: number;
        points: number;
    }[];
}, {
    type: "TIME";
    tiers: {
        timeSeconds: number;
        points: number;
    }[];
}>]>;
export declare const CreateGameTypeSchema: z.ZodObject<{
    name: z.ZodString;
    calculConfig: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"BOOLEAN">;
        trueValue: z.ZodNumber;
        falseValue: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "BOOLEAN";
        trueValue: number;
        falseValue: number;
    }, {
        type: "BOOLEAN";
        trueValue: number;
        falseValue: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"NUMBER">;
        multiplier: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "NUMBER";
        multiplier: number;
    }, {
        type: "NUMBER";
        multiplier: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"TIME">;
        tiers: z.ZodArray<z.ZodObject<{
            timeSeconds: z.ZodNumber;
            points: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            timeSeconds: number;
            points: number;
        }, {
            timeSeconds: number;
            points: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "TIME";
        tiers: {
            timeSeconds: number;
            points: number;
        }[];
    }, {
        type: "TIME";
        tiers: {
            timeSeconds: number;
            points: number;
        }[];
    }>]>;
    win: z.ZodString;
    team: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    calculConfig: {
        type: "BOOLEAN";
        trueValue: number;
        falseValue: number;
    } | {
        type: "NUMBER";
        multiplier: number;
    } | {
        type: "TIME";
        tiers: {
            timeSeconds: number;
            points: number;
        }[];
    };
    win: string;
    team: boolean;
}, {
    name: string;
    calculConfig: {
        type: "BOOLEAN";
        trueValue: number;
        falseValue: number;
    } | {
        type: "NUMBER";
        multiplier: number;
    } | {
        type: "TIME";
        tiers: {
            timeSeconds: number;
            points: number;
        }[];
    };
    win: string;
    team?: boolean | undefined;
}>;
export declare const UpdateGameTypeSchema: z.ZodObject<{
    name: z.ZodString;
    calculConfig: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
        type: z.ZodLiteral<"BOOLEAN">;
        trueValue: z.ZodNumber;
        falseValue: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "BOOLEAN";
        trueValue: number;
        falseValue: number;
    }, {
        type: "BOOLEAN";
        trueValue: number;
        falseValue: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"NUMBER">;
        multiplier: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "NUMBER";
        multiplier: number;
    }, {
        type: "NUMBER";
        multiplier: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"TIME">;
        tiers: z.ZodArray<z.ZodObject<{
            timeSeconds: z.ZodNumber;
            points: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            timeSeconds: number;
            points: number;
        }, {
            timeSeconds: number;
            points: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        type: "TIME";
        tiers: {
            timeSeconds: number;
            points: number;
        }[];
    }, {
        type: "TIME";
        tiers: {
            timeSeconds: number;
            points: number;
        }[];
    }>]>;
    win: z.ZodString;
    team: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    calculConfig: {
        type: "BOOLEAN";
        trueValue: number;
        falseValue: number;
    } | {
        type: "NUMBER";
        multiplier: number;
    } | {
        type: "TIME";
        tiers: {
            timeSeconds: number;
            points: number;
        }[];
    };
    win: string;
    team: boolean;
}, {
    name: string;
    calculConfig: {
        type: "BOOLEAN";
        trueValue: number;
        falseValue: number;
    } | {
        type: "NUMBER";
        multiplier: number;
    } | {
        type: "TIME";
        tiers: {
            timeSeconds: number;
            points: number;
        }[];
    };
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
    points: number;
    userId: number;
    reason?: string | undefined;
}, {
    points: number;
    userId: number;
    reason?: string | undefined;
}>;
export type CreateGameInput = z.infer<typeof CreateGameSchema>;
export type UpdateGameInput = z.infer<typeof UpdateGameSchema>;
export type CreateGameTypeInput = z.infer<typeof CreateGameTypeSchema>;
export type UpdateGameTypeInput = z.infer<typeof UpdateGameTypeSchema>;
export type UpdateHappyHourInput = z.infer<typeof UpdateHappyHourSchema>;
export type GrantBonusInput = z.infer<typeof GrantBonusSchema>;
export type CalculType = z.infer<typeof CalculTypeSchema>;
export type CalculConfig = z.infer<typeof CalculConfigSchema>;
export type BooleanCalculConfig = z.infer<typeof BooleanCalculConfigSchema>;
export type NumberCalculConfig = z.infer<typeof NumberCalculConfigSchema>;
export type TimeCalculConfig = z.infer<typeof TimeCalculConfigSchema>;
export type TimeTier = z.infer<typeof TimeTierSchema>;
