import { Prisma } from '@prisma/client'
import type {
    CreateSubscriptionNotificationInput,
} from '@extia-gaming/shared'
import { prisma } from '../lib/prisma.js'

export async function subscribeToNotifications(
    userId: number,
    input: CreateSubscriptionNotificationInput,
) {
    const data = {
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        expirationTime: input.expirationTime == null
            ? null
            : new Date(input.expirationTime),
    }

    try {
        return await prisma.subscriptionNotification.upsert({
            where: {
                endpoint: input.endpoint,
                userId,
            },
            create: {
                endpoint: input.endpoint,
                userId,
                ...data,
            },
            update: data,
            select: {
                id: true,
            },
        })
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError
            && error.code === 'P2002'
        ) {
            throw new Error('SUBSCRIPTION_CONFLICT')
        }

        throw error
    }
}

export async function unsubscribeFromNotifications(
    userId: number,
    endpoint: string,
) {
    await prisma.subscriptionNotification.deleteMany({
        where: {
            endpoint,
            userId,
        },
    })
}