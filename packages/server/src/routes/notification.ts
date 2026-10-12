import {notificationConfig} from '../services/notification-dispatch.service.js'
import {prisma} from '../lib/prisma.js'
import {z} from 'zod'
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

    f.get('/api/notifications/config',async()=>notificationConfig())
    f.post('/api/notifications/status',{preHandler:[authenticate],schema:{body:z.object({endpoint:z.string()})}},async r=>({subscribed:Boolean(await prisma.subscriptionNotification.findFirst({where:{userId:r.user.sub,endpoint:r.body.endpoint},select:{id:true}}))}))

    f.post<{Body:z.infer<typeof CreateSubscriptionNotificationSchema>}>(
        '/api/subscribe',
        {
            preHandler: [authenticate],
            schema: {
                body: CreateSubscriptionNotificationSchema,
            },
        },
        handleSubscribeToNotifications,
    )

    f.delete<{Body:z.infer<typeof DeleteSubscriptionNotificationSchema>}>(
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