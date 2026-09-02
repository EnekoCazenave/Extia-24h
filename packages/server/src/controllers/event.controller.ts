import type {FastifyReply, FastifyRequest} from 'fastify'
import type {
    CreateEventInput,
    EventIdParams,
    JWTPayload,
    UpdateEventInput,
} from '@extia-gaming/shared'
import {
    createEvent,
    deleteEvent,
    getEventById,
    listAllEvents,
    registerToEvent,
    unregisterToEvent,
    updateEvent,
} from '../services/event.service.js'

function sendServiceError(error: unknown, reply: FastifyReply) {
    if (!(error instanceof Error)) return undefined

    switch (error.message) {
        case 'EVENT_NOT_FOUND':
            return reply.code(404).send({error: 'Event not found', statusCode: 404})
        case 'USER_NOT_FOUND':
            return reply.code(404).send({error: 'User not found', statusCode: 404})
        case 'GAME_NOT_FOUND':
            return reply.code(404).send({error: 'Game not found', statusCode: 404})
        case 'ALREADY_REGISTERED':
            return reply.code(409).send({error: 'Already registered', statusCode: 409})
        case 'NOT_REGISTERED':
            return reply.code(409).send({error: 'Not registered', statusCode: 409})
        case 'EVENT_FULL':
            return reply.code(409).send({error: 'Event is full', statusCode: 409})
        case 'INVALID_EVENT_DATE_RANGE':
            return reply.code(400).send({error: 'Invalid event date range', statusCode: 400})
        case 'MAX_PLACES_BELOW_PARTICIPANTS':
            return reply.code(409).send({
                error: 'Maximum places cannot be lower than the participant count',
                statusCode: 409,
            })
        default:
            return undefined
    }
}

function getUserId(request: FastifyRequest) {
    return (request.user as JWTPayload | undefined)?.sub
}

function getRequiredUserId(request: FastifyRequest) {
    return (request.user as JWTPayload).sub
}

export async function handleListAllEvents(request: FastifyRequest, reply: FastifyReply) {
    const events = await listAllEvents(getUserId(request))
    return reply.send({events})
}

export async function handleGetEventById(request: FastifyRequest, reply: FastifyReply) {
    try {
        const {eventId} = request.params as EventIdParams
        const event = await getEventById(eventId, getUserId(request))
        return reply.send({event})
    } catch (error) {
        const response = sendServiceError(error, reply)
        if (response) return response
        throw error
    }
}

export async function handleRegisterToEvent(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    try {
        const {eventId} = request.params as EventIdParams
        const registration = await registerToEvent(getRequiredUserId(request), eventId)
        return reply.code(201).send({registration})
    } catch (error) {
        const response = sendServiceError(error, reply)
        if (response) return response
        throw error
    }
}

export async function handleUnregisterToEvent(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    try {
        const {eventId} = request.params as EventIdParams
        await unregisterToEvent(getRequiredUserId(request), eventId)
        return reply.code(204).send()
    } catch (error) {
        const response = sendServiceError(error, reply)
        if (response) return response
        throw error
    }
}

export async function handleCreateEvent(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    try {
        const event = await createEvent(request.body as CreateEventInput)
        return reply.code(201).send({event})
    } catch (error) {
        const response = sendServiceError(error, reply)
        if (response) return response
        throw error
    }
}

export async function handleUpdateEvent(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    try {
        const {eventId} = request.params as EventIdParams
        const event = await updateEvent(eventId, request.body as UpdateEventInput)
        return reply.send({event})
    } catch (error) {
        const response = sendServiceError(error, reply)
        if (response) return response
        throw error
    }
}

export async function handleDeleteEvent(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    try {
        const {eventId} = request.params as EventIdParams
        await deleteEvent(eventId)
        return reply.code(204).send()
    } catch (error) {
        const response = sendServiceError(error, reply)
        if (response) return response
        throw error
    }
}
