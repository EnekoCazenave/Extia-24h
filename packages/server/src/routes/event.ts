import type { FastifyInstance } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'
import {
  CreateEventSchema,
  EventIdParamsSchema,
  UpdateEventSchema,
} from '@extia-gaming/shared'
import { authenticate } from '../hooks/authenticate.js'
import { optionalAuthenticate } from '../hooks/optionalAuthenticate.js'
import { requireAdmin } from '../hooks/requireAdmin.js'
import {
  handleCreateEvent,
  handleDeleteEvent,
  handleGetEventById,
  handleListAllEvents,
  handleRegisterToEvent,
  handleUnregisterToEvent,
  handleUpdateEvent,
} from '../controllers/event.controller.js'

export async function eventRoutes(fastify: FastifyInstance) {
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  const f = fastify.withTypeProvider<ZodTypeProvider>()
  const authenticatedGuard = { preHandler: [authenticate] }
  const optionalAuthenticatedGuard = { preHandler: [optionalAuthenticate] }
  const adminGuard = { preHandler: [requireAdmin] }
  const eventParamsSchema = { params: EventIdParamsSchema }

  // List des events
  f.get('/api/events', optionalAuthenticatedGuard, handleListAllEvents)
  f.get(
    '/api/events/:eventId',
    { ...optionalAuthenticatedGuard, schema: eventParamsSchema },
    handleGetEventById,
  )

  // Inscription / Désinscription aux events
  f.post(
    '/api/events/:eventId/participation',
    { ...authenticatedGuard, schema: eventParamsSchema },
    handleRegisterToEvent,
  )
  f.delete(
    '/api/events/:eventId/participation',
    { ...authenticatedGuard, schema: eventParamsSchema },
    handleUnregisterToEvent,
  )

  // Routes ADMIN reliés aux events
  f.post(
    '/api/admin/events',
    { ...adminGuard, schema: { body: CreateEventSchema } },
    handleCreateEvent,
  )
  f.put(
    '/api/admin/events/:eventId',
    {
      ...adminGuard,
      schema: {
        params: EventIdParamsSchema,
        body: UpdateEventSchema,
      },
    },
    handleUpdateEvent,
  )
  f.delete(
    '/api/admin/events/:eventId',
    { ...adminGuard, schema: eventParamsSchema },
    handleDeleteEvent,
  )
}
