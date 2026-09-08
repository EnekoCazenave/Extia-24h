import type {FastifyReply, FastifyRequest} from 'fastify'
import type {
    CreateSubscriptionNotificationInput,
    DeleteSubscriptionNotificationInput,
    JWTPayload,
} from '@extia-gaming/shared'
import {
    subscribeToNotifications,
    unsubscribeFromNotifications,
} from '../services/notification.service.js'

export async function handleSubscribeToNotifications(
    request: FastifyRequest<{
        Body: CreateSubscriptionNotificationInput
    }>,
    reply: FastifyReply,
) {
    const userId = (request.user as JWTPayload).sub

    try {
        const subscription = await subscribeToNotifications(
            userId,
            request.body,
        )

        return reply.code(200).send({subscription})
    } catch (error) {
        if (
            error instanceof Error
            && error.message === 'SUBSCRIPTION_CONFLICT'
        ) {
            return reply.code(409).send({
                error: 'Subscription already associated with another user',
                statusCode: 409,
            })
        }

        throw error
    }
}

export async function handleUnsubscribeFromNotifications(
    request: FastifyRequest<{
        Body: DeleteSubscriptionNotificationInput
    }>,
    reply: FastifyReply,
) {
    const userId = (request.user as JWTPayload).sub

    await unsubscribeFromNotifications(
        userId,
        request.body.endpoint,
    )

    return reply.code(204).send()
}