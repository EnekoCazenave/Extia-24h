import { z } from 'zod';
export declare const CreateEventSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    videoGameId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    startsAt: z.ZodString;
    endsAt: z.ZodString;
    maxPlaces: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    startsAt: string;
    endsAt: string;
    maxPlaces: number;
    videoGameId?: number | null | undefined;
}, {
    name: string;
    description: string;
    startsAt: string;
    endsAt: string;
    maxPlaces: number;
    videoGameId?: number | null | undefined;
}>, {
    name: string;
    description: string;
    startsAt: string;
    endsAt: string;
    maxPlaces: number;
    videoGameId?: number | null | undefined;
}, {
    name: string;
    description: string;
    startsAt: string;
    endsAt: string;
    maxPlaces: number;
    videoGameId?: number | null | undefined;
}>;
export declare const UpdateEventSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    videoGameId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    startsAt: z.ZodOptional<z.ZodString>;
    endsAt: z.ZodOptional<z.ZodString>;
    maxPlaces: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    videoGameId?: number | null | undefined;
    description?: string | undefined;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    maxPlaces?: number | undefined;
}, {
    name?: string | undefined;
    videoGameId?: number | null | undefined;
    description?: string | undefined;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    maxPlaces?: number | undefined;
}>, {
    name?: string | undefined;
    videoGameId?: number | null | undefined;
    description?: string | undefined;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    maxPlaces?: number | undefined;
}, {
    name?: string | undefined;
    videoGameId?: number | null | undefined;
    description?: string | undefined;
    startsAt?: string | undefined;
    endsAt?: string | undefined;
    maxPlaces?: number | undefined;
}>;
export declare const EventIdParamsSchema: z.ZodObject<{
    eventId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    eventId: number;
}, {
    eventId: number;
}>;
export declare const EventVideoGameSchema: z.ZodObject<{
    id: z.ZodNumber;
    nom: z.ZodString;
    imageUrl: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: number;
    nom: string;
    imageUrl: string | null;
}, {
    id: number;
    nom: string;
    imageUrl: string | null;
}>;
export declare const EventSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    startsAt: z.ZodString;
    endsAt: z.ZodString;
    maxPlaces: z.ZodNumber;
} & {
    id: z.ZodNumber;
    videoGameId: z.ZodNullable<z.ZodNumber>;
    videoGame: z.ZodNullable<z.ZodObject<{
        id: z.ZodNumber;
        nom: z.ZodString;
        imageUrl: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: number;
        nom: string;
        imageUrl: string | null;
    }, {
        id: number;
        nom: string;
        imageUrl: string | null;
    }>>;
    participantCount: z.ZodNumber;
    remainingPlaces: z.ZodNumber;
    isRegistered: z.ZodBoolean;
    isFull: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    name: string;
    videoGameId: number | null;
    videoGame: {
        id: number;
        nom: string;
        imageUrl: string | null;
    } | null;
    createdAt: string;
    description: string;
    startsAt: string;
    endsAt: string;
    maxPlaces: number;
    participantCount: number;
    remainingPlaces: number;
    isRegistered: boolean;
    isFull: boolean;
    updatedAt: string;
}, {
    id: number;
    name: string;
    videoGameId: number | null;
    videoGame: {
        id: number;
        nom: string;
        imageUrl: string | null;
    } | null;
    createdAt: string;
    description: string;
    startsAt: string;
    endsAt: string;
    maxPlaces: number;
    participantCount: number;
    remainingPlaces: number;
    isRegistered: boolean;
    isFull: boolean;
    updatedAt: string;
}>;
export declare const UserEventSchema: z.ZodObject<{
    userId: z.ZodNumber;
    eventId: z.ZodNumber;
    registeredAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: number;
    eventId: number;
    registeredAt: string;
}, {
    userId: number;
    eventId: number;
    registeredAt: string;
}>;
export declare const EventListSchema: z.ZodObject<{
    events: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        startsAt: z.ZodString;
        endsAt: z.ZodString;
        maxPlaces: z.ZodNumber;
    } & {
        id: z.ZodNumber;
        videoGameId: z.ZodNullable<z.ZodNumber>;
        videoGame: z.ZodNullable<z.ZodObject<{
            id: z.ZodNumber;
            nom: z.ZodString;
            imageUrl: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: number;
            nom: string;
            imageUrl: string | null;
        }, {
            id: number;
            nom: string;
            imageUrl: string | null;
        }>>;
        participantCount: z.ZodNumber;
        remainingPlaces: z.ZodNumber;
        isRegistered: z.ZodBoolean;
        isFull: z.ZodBoolean;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        name: string;
        videoGameId: number | null;
        videoGame: {
            id: number;
            nom: string;
            imageUrl: string | null;
        } | null;
        createdAt: string;
        description: string;
        startsAt: string;
        endsAt: string;
        maxPlaces: number;
        participantCount: number;
        remainingPlaces: number;
        isRegistered: boolean;
        isFull: boolean;
        updatedAt: string;
    }, {
        id: number;
        name: string;
        videoGameId: number | null;
        videoGame: {
            id: number;
            nom: string;
            imageUrl: string | null;
        } | null;
        createdAt: string;
        description: string;
        startsAt: string;
        endsAt: string;
        maxPlaces: number;
        participantCount: number;
        remainingPlaces: number;
        isRegistered: boolean;
        isFull: boolean;
        updatedAt: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    events: {
        id: number;
        name: string;
        videoGameId: number | null;
        videoGame: {
            id: number;
            nom: string;
            imageUrl: string | null;
        } | null;
        createdAt: string;
        description: string;
        startsAt: string;
        endsAt: string;
        maxPlaces: number;
        participantCount: number;
        remainingPlaces: number;
        isRegistered: boolean;
        isFull: boolean;
        updatedAt: string;
    }[];
}, {
    events: {
        id: number;
        name: string;
        videoGameId: number | null;
        videoGame: {
            id: number;
            nom: string;
            imageUrl: string | null;
        } | null;
        createdAt: string;
        description: string;
        startsAt: string;
        endsAt: string;
        maxPlaces: number;
        participantCount: number;
        remainingPlaces: number;
        isRegistered: boolean;
        isFull: boolean;
        updatedAt: string;
    }[];
}>;
export declare const EventResponseSchema: z.ZodObject<{
    event: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        startsAt: z.ZodString;
        endsAt: z.ZodString;
        maxPlaces: z.ZodNumber;
    } & {
        id: z.ZodNumber;
        videoGameId: z.ZodNullable<z.ZodNumber>;
        videoGame: z.ZodNullable<z.ZodObject<{
            id: z.ZodNumber;
            nom: z.ZodString;
            imageUrl: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: number;
            nom: string;
            imageUrl: string | null;
        }, {
            id: number;
            nom: string;
            imageUrl: string | null;
        }>>;
        participantCount: z.ZodNumber;
        remainingPlaces: z.ZodNumber;
        isRegistered: z.ZodBoolean;
        isFull: z.ZodBoolean;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: number;
        name: string;
        videoGameId: number | null;
        videoGame: {
            id: number;
            nom: string;
            imageUrl: string | null;
        } | null;
        createdAt: string;
        description: string;
        startsAt: string;
        endsAt: string;
        maxPlaces: number;
        participantCount: number;
        remainingPlaces: number;
        isRegistered: boolean;
        isFull: boolean;
        updatedAt: string;
    }, {
        id: number;
        name: string;
        videoGameId: number | null;
        videoGame: {
            id: number;
            nom: string;
            imageUrl: string | null;
        } | null;
        createdAt: string;
        description: string;
        startsAt: string;
        endsAt: string;
        maxPlaces: number;
        participantCount: number;
        remainingPlaces: number;
        isRegistered: boolean;
        isFull: boolean;
        updatedAt: string;
    }>;
}, "strip", z.ZodTypeAny, {
    event: {
        id: number;
        name: string;
        videoGameId: number | null;
        videoGame: {
            id: number;
            nom: string;
            imageUrl: string | null;
        } | null;
        createdAt: string;
        description: string;
        startsAt: string;
        endsAt: string;
        maxPlaces: number;
        participantCount: number;
        remainingPlaces: number;
        isRegistered: boolean;
        isFull: boolean;
        updatedAt: string;
    };
}, {
    event: {
        id: number;
        name: string;
        videoGameId: number | null;
        videoGame: {
            id: number;
            nom: string;
            imageUrl: string | null;
        } | null;
        createdAt: string;
        description: string;
        startsAt: string;
        endsAt: string;
        maxPlaces: number;
        participantCount: number;
        remainingPlaces: number;
        isRegistered: boolean;
        isFull: boolean;
        updatedAt: string;
    };
}>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;
export type EventIdParams = z.infer<typeof EventIdParamsSchema>;
export type EventVideoGame = z.infer<typeof EventVideoGameSchema>;
export type ProgramEvent = z.infer<typeof EventSchema>;
export type UserEvent = z.infer<typeof UserEventSchema>;
export type EventListResponse = z.infer<typeof EventListSchema>;
export type EventResponse = z.infer<typeof EventResponseSchema>;
