import {z} from "zod";

export const SubscriptionNotificationSchema = z.object({
    id: z.number().int().positive(),
    userId: z.number().int().positive(),
    endpoint: z.string().url(),
    p256dh: z.string().min(1),
    auth: z.string().min(1),
    expirationTime: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
})

export const CreateSubscriptionNotificationSchema = z.object({
    endpoint: z.string().url(),
    keys: z.object({
        p256dh: z.string().min(1),
        auth: z.string().min(1),
    }),
    expirationTime: z.number().nonnegative().nullable().optional(),
})

export const DeleteSubscriptionNotificationSchema =
    CreateSubscriptionNotificationSchema.pick({
        endpoint: true,
    })

export type DeleteSubscriptionNotificationInput = z.infer<
    typeof DeleteSubscriptionNotificationSchema
>

export type CreateSubscriptionNotificationInput = z.infer<
    typeof CreateSubscriptionNotificationSchema
>

export type SubscriptionNotification = z.infer<
    typeof SubscriptionNotificationSchema
>

