import { z } from "zod";
export declare const SubscriptionNotificationSchema: z.ZodObject<{
    id: z.ZodNumber;
    userId: z.ZodNumber;
    endpoint: z.ZodString;
    p256dh: z.ZodString;
    auth: z.ZodString;
    expirationTime: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    userId: number;
    createdAt: string;
    updatedAt: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    expirationTime: string | null;
}, {
    id: number;
    userId: number;
    createdAt: string;
    updatedAt: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    expirationTime: string | null;
}>;
export declare const CreateSubscriptionNotificationSchema: z.ZodObject<{
    endpoint: z.ZodString;
    keys: z.ZodObject<{
        p256dh: z.ZodString;
        auth: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        p256dh: string;
        auth: string;
    }, {
        p256dh: string;
        auth: string;
    }>;
    expirationTime: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    keys: {
        p256dh: string;
        auth: string;
    };
    endpoint: string;
    expirationTime?: number | null | undefined;
}, {
    keys: {
        p256dh: string;
        auth: string;
    };
    endpoint: string;
    expirationTime?: number | null | undefined;
}>;
export declare const DeleteSubscriptionNotificationSchema: z.ZodObject<Pick<{
    endpoint: z.ZodString;
    keys: z.ZodObject<{
        p256dh: z.ZodString;
        auth: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        p256dh: string;
        auth: string;
    }, {
        p256dh: string;
        auth: string;
    }>;
    expirationTime: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "endpoint">, "strip", z.ZodTypeAny, {
    endpoint: string;
}, {
    endpoint: string;
}>;
export type DeleteSubscriptionNotificationInput = z.infer<typeof DeleteSubscriptionNotificationSchema>;
export type CreateSubscriptionNotificationInput = z.infer<typeof CreateSubscriptionNotificationSchema>;
export type SubscriptionNotification = z.infer<typeof SubscriptionNotificationSchema>;
