import { z } from 'zod';
export declare const GameTypeSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    calculType: z.ZodEnum<["BOOLEAN", "NUMBER", "TIME"]>;
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
    team: z.ZodBoolean;
    videoGameId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
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
    calculType: "BOOLEAN" | "NUMBER" | "TIME";
    videoGameId: number;
}, {
    id: number;
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
    calculType: "BOOLEAN" | "NUMBER" | "TIME";
    videoGameId: number;
}>;
export declare const VideoGameSchema: z.ZodObject<{
    id: z.ZodNumber;
    nom: z.ZodString;
    imageUrl: z.ZodNullable<z.ZodString>;
    happyHourStart: z.ZodNullable<z.ZodString>;
    happyHourEnd: z.ZodNullable<z.ZodString>;
    gameTypes: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        calculType: z.ZodEnum<["BOOLEAN", "NUMBER", "TIME"]>;
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
        team: z.ZodBoolean;
        videoGameId: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: number;
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
        calculType: "BOOLEAN" | "NUMBER" | "TIME";
        videoGameId: number;
    }, {
        id: number;
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
        calculType: "BOOLEAN" | "NUMBER" | "TIME";
        videoGameId: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: number;
    nom: string;
    imageUrl: string | null;
    happyHourStart: string | null;
    happyHourEnd: string | null;
    gameTypes: {
        id: number;
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
        calculType: "BOOLEAN" | "NUMBER" | "TIME";
        videoGameId: number;
    }[];
}, {
    id: number;
    nom: string;
    imageUrl: string | null;
    happyHourStart: string | null;
    happyHourEnd: string | null;
    gameTypes: {
        id: number;
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
        calculType: "BOOLEAN" | "NUMBER" | "TIME";
        videoGameId: number;
    }[];
}>;
export declare const BooleanPlayInputSchema: z.ZodObject<{
    calculType: z.ZodLiteral<"BOOLEAN">;
    value: z.ZodBoolean;
    gameTypeId: z.ZodNumber;
    teamMemberIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
    proofUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value: boolean;
    calculType: "BOOLEAN";
    gameTypeId: number;
    teamMemberIds: number[];
    proofUrl?: string | undefined;
}, {
    value: boolean;
    calculType: "BOOLEAN";
    gameTypeId: number;
    teamMemberIds?: number[] | undefined;
    proofUrl?: string | undefined;
}>;
export declare const NumberPlayInputSchema: z.ZodObject<{
    calculType: z.ZodLiteral<"NUMBER">;
    value: z.ZodNumber;
    gameTypeId: z.ZodNumber;
    teamMemberIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
    proofUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value: number;
    calculType: "NUMBER";
    gameTypeId: number;
    teamMemberIds: number[];
    proofUrl?: string | undefined;
}, {
    value: number;
    calculType: "NUMBER";
    gameTypeId: number;
    teamMemberIds?: number[] | undefined;
    proofUrl?: string | undefined;
}>;
export declare const TimePlayInputSchema: z.ZodObject<{
    calculType: z.ZodLiteral<"TIME">;
    timeSeconds: z.ZodNumber;
    gameTypeId: z.ZodNumber;
    teamMemberIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
    proofUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    timeSeconds: number;
    calculType: "TIME";
    gameTypeId: number;
    teamMemberIds: number[];
    proofUrl?: string | undefined;
}, {
    timeSeconds: number;
    calculType: "TIME";
    gameTypeId: number;
    teamMemberIds?: number[] | undefined;
    proofUrl?: string | undefined;
}>;
export declare const PlayInputSchema: z.ZodDiscriminatedUnion<"calculType", [z.ZodObject<{
    calculType: z.ZodLiteral<"BOOLEAN">;
    value: z.ZodBoolean;
    gameTypeId: z.ZodNumber;
    teamMemberIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
    proofUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value: boolean;
    calculType: "BOOLEAN";
    gameTypeId: number;
    teamMemberIds: number[];
    proofUrl?: string | undefined;
}, {
    value: boolean;
    calculType: "BOOLEAN";
    gameTypeId: number;
    teamMemberIds?: number[] | undefined;
    proofUrl?: string | undefined;
}>, z.ZodObject<{
    calculType: z.ZodLiteral<"NUMBER">;
    value: z.ZodNumber;
    gameTypeId: z.ZodNumber;
    teamMemberIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
    proofUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value: number;
    calculType: "NUMBER";
    gameTypeId: number;
    teamMemberIds: number[];
    proofUrl?: string | undefined;
}, {
    value: number;
    calculType: "NUMBER";
    gameTypeId: number;
    teamMemberIds?: number[] | undefined;
    proofUrl?: string | undefined;
}>, z.ZodObject<{
    calculType: z.ZodLiteral<"TIME">;
    timeSeconds: z.ZodNumber;
    gameTypeId: z.ZodNumber;
    teamMemberIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
    proofUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    timeSeconds: number;
    calculType: "TIME";
    gameTypeId: number;
    teamMemberIds: number[];
    proofUrl?: string | undefined;
}, {
    timeSeconds: number;
    calculType: "TIME";
    gameTypeId: number;
    teamMemberIds?: number[] | undefined;
    proofUrl?: string | undefined;
}>]>;
export declare const SessionStatusSchema: z.ZodEnum<["PENDING", "APPROVED", "REJECTED"]>;
export declare const GameSessionSchema: z.ZodObject<{
    id: z.ZodNumber;
    submitterId: z.ZodNumber;
    submitter: z.ZodObject<{
        id: z.ZodNumber;
        login: z.ZodString;
        firstname: z.ZodString;
        lastname: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        login: string;
        firstname: string;
        lastname: string;
        id: number;
    }, {
        login: string;
        firstname: string;
        lastname: string;
        id: number;
    }>;
    gameTypeId: z.ZodNumber;
    gameType: z.ZodObject<{
        id: z.ZodNumber;
        name: z.ZodString;
        team: z.ZodBoolean;
        videoGame: z.ZodObject<{
            id: z.ZodNumber;
            nom: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: number;
            nom: string;
        }, {
            id: number;
            nom: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        name: string;
        team: boolean;
        videoGame: {
            id: number;
            nom: string;
        };
    }, {
        id: number;
        name: string;
        team: boolean;
        videoGame: {
            id: number;
            nom: string;
        };
    }>;
    score: z.ZodNumber;
    proofUrl: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["PENDING", "APPROVED", "REJECTED"]>;
    createdAt: z.ZodString;
    reviewedAt: z.ZodNullable<z.ZodString>;
    teamMembers: z.ZodArray<z.ZodObject<{
        userId: z.ZodNumber;
        user: z.ZodObject<{
            id: z.ZodNumber;
            login: z.ZodString;
            firstname: z.ZodString;
            lastname: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            login: string;
            firstname: string;
            lastname: string;
            id: number;
        }, {
            login: string;
            firstname: string;
            lastname: string;
            id: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        userId: number;
        user: {
            login: string;
            firstname: string;
            lastname: string;
            id: number;
        };
    }, {
        userId: number;
        user: {
            login: string;
            firstname: string;
            lastname: string;
            id: number;
        };
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    status: "PENDING" | "APPROVED" | "REJECTED";
    id: number;
    gameTypeId: number;
    proofUrl: string | null;
    submitterId: number;
    submitter: {
        login: string;
        firstname: string;
        lastname: string;
        id: number;
    };
    gameType: {
        id: number;
        name: string;
        team: boolean;
        videoGame: {
            id: number;
            nom: string;
        };
    };
    score: number;
    createdAt: string;
    reviewedAt: string | null;
    teamMembers: {
        userId: number;
        user: {
            login: string;
            firstname: string;
            lastname: string;
            id: number;
        };
    }[];
}, {
    status: "PENDING" | "APPROVED" | "REJECTED";
    id: number;
    gameTypeId: number;
    proofUrl: string | null;
    submitterId: number;
    submitter: {
        login: string;
        firstname: string;
        lastname: string;
        id: number;
    };
    gameType: {
        id: number;
        name: string;
        team: boolean;
        videoGame: {
            id: number;
            nom: string;
        };
    };
    score: number;
    createdAt: string;
    reviewedAt: string | null;
    teamMembers: {
        userId: number;
        user: {
            login: string;
            firstname: string;
            lastname: string;
            id: number;
        };
    }[];
}>;
export type GameType = z.infer<typeof GameTypeSchema>;
export type VideoGame = z.infer<typeof VideoGameSchema>;
export type PlayInput = z.infer<typeof PlayInputSchema>;
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
export type GameSession = z.infer<typeof GameSessionSchema>;
