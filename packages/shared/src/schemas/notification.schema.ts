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

const PushEndpointSchema=z.string().url().max(3000).refine(value=>{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&['fcm.googleapis.com','updates.push.services.mozilla.com','push.services.mozilla.com','web.push.apple.com'].some(host=>u.hostname===host||u.hostname.endsWith('.'+host))},'Service de notifications non autorisé')

export const CreateSubscriptionNotificationSchema = z.object({
    endpoint: PushEndpointSchema,
    keys: z.object({
        p256dh: z.string().regex(/^[A-Za-z0-9_-]+={0,2}$/).min(80).max(150),
        auth: z.string().regex(/^[A-Za-z0-9_-]+={0,2}$/).min(20).max(50),
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

