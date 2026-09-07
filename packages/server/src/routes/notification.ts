import type {FastifyInstance} from 'fastify'
import {
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import {
    CreateSubscriptionNotificationSchema,
    DeleteSubscriptionNotificationSchema,
} from '@extia-gaming/shared'
import {authenticate} from '../hooks/authenticate.js'
import {
    handleSubscribeToNotifications,
    handleUnsubscribeFromNotifications,
} from '../controllers/notification.controller.js'

export async function notificationRoutes(
    fastify: FastifyInstance,
) {
    fastify.setValidatorCompiler(validatorCompiler)
    fastify.setSerializerCompiler(serializerCompiler)

    const f = fastify.withTypeProvider<ZodTypeProvider>()

    f.post(
        '/api/subscribe',
        {
            preHandler: [authenticate],
            schema: {
                body: CreateSubscriptionNotificationSchema,
            },
        },
        handleSubscribeToNotifications,
    )

    f.delete(
        '/api/subscribe',
        {
            preHandler: [authenticate],
            schema: {
                body: DeleteSubscriptionNotificationSchema,
            },
        },
        handleUnsubscribeFromNotifications,
    )
}