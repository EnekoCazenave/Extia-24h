import { z } from 'zod';
const EventNameSchema = z
    .string()
    .trim()
    .min(1, 'Le nom est obligatoire')
    .max(150, 'Le nom ne peut pas dépasser 150 caractères');
const EventDescriptionSchema = z
    .string()
    .trim()
    .min(1, 'La description est obligatoire')
    .max(5000, 'La description ne peut pas dépasser 5000 caractères');
const EventDateSchema = z
    .string()
    .datetime({
    message: 'La date doit être au format ISO 8601',
});
const MaxPlacesSchema = z
    .number()
    .int('Le nombre de places doit être un entier')
    .positive('Le nombre de places doit être supérieur à zéro');
const EventWriteSchema = z.object({
    name: EventNameSchema,
    description: EventDescriptionSchema,
    videoGameId: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),
    startsAt: EventDateSchema,
    endsAt: EventDateSchema,
    maxPlaces: MaxPlacesSchema,
});
function hasValidDateRange(data) {
    if (!data.startsAt || !data.endsAt) {
        return true;
    }
    return new Date(data.endsAt) > new Date(data.startsAt);
}
export const CreateEventSchema = EventWriteSchema.refine(hasValidDateRange, {
    message: 'La date de fin doit être postérieure à la date de début',
    path: ['endsAt'],
});
export const UpdateEventSchema = EventWriteSchema
    .partial()
    .refine(hasValidDateRange, {
    message: 'La date de fin doit être postérieure à la date de début',
    path: ['endsAt'],
});
export const EventIdParamsSchema = z.object({
    eventId: z.coerce.number().int().positive(),
});
export const EventVideoGameSchema = z.object({
    id: z.number().int().positive(),
    nom: z.string(),
    imageUrl: z.string().nullable(),
});
export const EventSchema = EventWriteSchema.extend({
    id: z.number().int().positive(),
    videoGameId: z.number().int().positive().nullable(),
    videoGame: EventVideoGameSchema.nullable(),
    participantCount: z.number().int().min(0),
    remainingPlaces: z.number().int().min(0),
    isRegistered: z.boolean(),
    isFull: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export const UserEventSchema = z.object({
    userId: z.number().int().positive(),
    eventId: z.number().int().positive(),
    registeredAt: z.string().datetime(),
});
export const EventListSchema = z.object({
    events: z.array(EventSchema),
});
export const EventResponseSchema = z.object({
    event: EventSchema,
});
//# sourceMappingURL=event.schema.js.map