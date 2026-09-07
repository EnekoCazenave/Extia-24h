import {prisma} from '../lib/prisma.js'
import type {CreateEventInput, UpdateEventInput} from '@extia-gaming/shared'

export async function listAllEvents(userId?: number) {
    const events = await prisma.event.findMany({
        orderBy: {startsAt: 'asc'},
        include: {
            videoGame: {
                select: {
                    id: true,
                    nom: true,
                    imageUrl: true,
                },
            },
            _count: {
                select: {userEvents: true},
            },
            userEvents: {
                where: {userId: userId ?? 0},
                select: {userId: true},
            },
        },
    })

    return events.map(({_count, userEvents, ...event}) => {
        const participantCount = _count.userEvents
        const remainingPlaces = Math.max(event.maxPlaces - participantCount, 0)

        return {
            ...event,
            startsAt: event.startsAt.toISOString(),
            endsAt: event.endsAt.toISOString(),
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString(),
            participantCount,
            remainingPlaces,
            isRegistered: userEvents.length > 0,
            isFull: remainingPlaces === 0,
        }
    })
}

export async function getEventById(eventId: number, userId?: number) {
    const event = await prisma.event.findUnique({
        where: {id: eventId},
        include: {
            videoGame: {
                select: {id: true, nom: true, imageUrl: true},
            },
            _count: {
                select: {userEvents: true},
            },
            userEvents: {
                where: {userId: userId ?? 0},
                select: {userId: true},
            },
        },
    })

    if (!event) throw new Error('EVENT_NOT_FOUND')

    const {_count, userEvents, ...eventData} = event
    const participantCount = _count.userEvents
    const remainingPlaces = Math.max(event.maxPlaces - participantCount, 0)

    return {
        ...eventData,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt.toISOString(),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        participantCount,
        remainingPlaces,
        isRegistered: userEvents.length > 0,
        isFull: remainingPlaces === 0,
    }
}

export async function registerToEvent(userId: number, eventId: number) {
    return prisma.$transaction(async (tx) => {
        const [event, user, existingRegistration] = await Promise.all([
            tx.event.findUnique({
                where: {id: eventId},
                include: {
                    _count: {select: {userEvents: true}},
                },
            }),
            tx.user.findUnique({
                where: {id: userId},
                select: {id: true},
            }),
            tx.userEvent.findUnique({
                where: {
                    userId_eventId: {userId, eventId},
                },
            }),
        ])

        if (!event) throw new Error('EVENT_NOT_FOUND')
        if (!user) throw new Error('USER_NOT_FOUND')
        if (existingRegistration) throw new Error('ALREADY_REGISTERED')
        if (event._count.userEvents >= event.maxPlaces) {
            throw new Error('EVENT_FULL')
        }

        return tx.userEvent.create({
            data: {userId, eventId},
        })
    })
}

export async function unregisterToEvent(userId: number, eventId: number) {
    return prisma.$transaction(async (tx) => {
        const [event, user, existingRegistration] = await Promise.all([
            tx.event.findUnique({
                where: {id: eventId},
                select: {id: true},
            }),
            tx.user.findUnique({
                where: {id: userId},
                select: {id: true},
            }),
            tx.userEvent.findUnique({
                where: {
                    userId_eventId: {userId, eventId},
                },
            }),
        ])

        if (!event) throw new Error('EVENT_NOT_FOUND')
        if (!user) throw new Error('USER_NOT_FOUND')
        if (!existingRegistration) throw new Error('NOT_REGISTERED')

        return tx.userEvent.delete({
            where: {
                userId_eventId: {userId, eventId},
            },
        })
    })
}

export async function createEvent(eventInfos: CreateEventInput) {
    if (eventInfos.videoGameId) {
        const videoGame = await prisma.videoGame.findUnique({
            where: {id: eventInfos.videoGameId},
            select: {id: true},
        })

        if (!videoGame) throw new Error('GAME_NOT_FOUND')
    }

    return prisma.event.create({
        data: {
            name: eventInfos.name,
            description: eventInfos.description,
            videoGameId: eventInfos.videoGameId ?? null,
            startsAt: new Date(eventInfos.startsAt),
            endsAt: new Date(eventInfos.endsAt),
            maxPlaces: eventInfos.maxPlaces,
            pointsEarned: eventInfos.pointsEarned,
        },
    })
}

export async function updateEvent(eventId: number, eventInfos: UpdateEventInput) {
    const existingEvent = await prisma.event.findUnique({
        where: {id: eventId},
        include: {
            _count: {select: {userEvents: true}},
        },
    })

    if (!existingEvent) throw new Error('EVENT_NOT_FOUND')

    if (eventInfos.videoGameId) {
        const videoGame = await prisma.videoGame.findUnique({
            where: {id: eventInfos.videoGameId},
            select: {id: true},
        })

        if (!videoGame) throw new Error('GAME_NOT_FOUND')
    }

    const startsAt = eventInfos.startsAt
        ? new Date(eventInfos.startsAt)
        : existingEvent.startsAt
    const endsAt = eventInfos.endsAt
        ? new Date(eventInfos.endsAt)
        : existingEvent.endsAt

    if (endsAt <= startsAt) throw new Error('INVALID_EVENT_DATE_RANGE')

    if (
        eventInfos.maxPlaces !== undefined &&
        eventInfos.maxPlaces < existingEvent._count.userEvents
    ) {
        throw new Error('MAX_PLACES_BELOW_PARTICIPANTS')
    }

    return prisma.event.update({
        where: {id: eventId},
        data: {
            name: eventInfos.name,
            description: eventInfos.description,
            videoGameId: eventInfos.videoGameId,
            startsAt,
            endsAt,
            maxPlaces: eventInfos.maxPlaces,
            pointsEarned: eventInfos.pointsEarned,
        },
    })
}

export async function deleteEvent(eventId: number) {
    const existingEvent = await prisma.event.findUnique({
        where: {id: eventId},
        select: {id: true},
    })

    if (!existingEvent) throw new Error('EVENT_NOT_FOUND')

    return prisma.event.delete({
        where: {id: eventId},
    })
}
