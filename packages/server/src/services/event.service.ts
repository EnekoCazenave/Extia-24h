import { eventTransaction, EventError } from './event-scoring.service.js'
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
                select: {userId: true, isPresent: true},
            },
        },
    })

    return events.map(({_count, userEvents, ...event}) => {
        const participantCount = _count.userEvents
        const remainingPlaces = Math.max(event.maxPlaces - participantCount, 0)

        return {
            ...event,
            settledAt: event.settledAt?.toISOString() ?? null,
            startsAt: event.startsAt.toISOString(),
            endsAt: event.endsAt.toISOString(),
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString(),
            participantCount,
            remainingPlaces,
            isRegistered: userEvents.length > 0,
            myAttendance: userEvents[0]?.isPresent ?? null,
            isFull: remainingPlaces === 0,
        }
    })
}

export async function getEventById(eventId: number, userId?: number, isAdmin = false) {
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
                select: {userId: true, isPresent: true},
            },
        },
    })

    if (!event) throw new Error('EVENT_NOT_FOUND')

    const participants = isAdmin
        ? await prisma.userEvent.findMany({
            where: {eventId},
            orderBy: {registeredAt: 'asc'},
            select: {isPresent: true, user: {select: {id: true, firstname: true, lastname: true}}},
        })
        : undefined

    const {_count, userEvents, ...eventData} = event
    const participantCount = _count.userEvents
    const remainingPlaces = Math.max(event.maxPlaces - participantCount, 0)

    return {
        ...eventData,
        ...(participants ? {participants: participants.map(({user, isPresent}) => ({...user, isPresent}))} : {}),
        settledAt: event.settledAt?.toISOString() ?? null,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt.toISOString(),
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        participantCount,
        remainingPlaces,
        isRegistered: userEvents.length > 0,
        myAttendance: userEvents[0]?.isPresent ?? null,
        isFull: remainingPlaces === 0,
    }
}

export async function confirmEventAttendance(userId: number, eventId: number, isPresent: boolean) {
    const now = new Date()
    const result = await prisma.userEvent.updateMany({
        where: {
            userId, eventId, isPresent: null,
            event: {startsAt: {lte: now}, endsAt: {gt: now}},
        },
        data: {isPresent},
    })
    if (result.count !== 1) throw new Error('ATTENDANCE_UNAVAILABLE')
    return {isPresent}
}

export async function registerToEvent(userId: number, eventId: number) {
    return eventTransaction(async (tx) => {
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
        if (event.settledAt) throw new EventError('Cet événement a déjà été récompensé')
        if (!user) throw new Error('USER_NOT_FOUND')
        if (event.endsAt.getTime() <= Date.now()) throw new Error('EVENT_ENDED')
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
    return eventTransaction(async (tx) => {
        const [event, user, existingRegistration] = await Promise.all([
            tx.event.findUnique({
                where: {id: eventId},
                select: {id: true, settledAt: true},
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
        if (event.settledAt) throw new EventError('Cet événement a déjà été récompensé')
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
            notifyPush: eventInfos.notifyPush,
            notifyEmail: eventInfos.notifyEmail,
            notifyDiscord: eventInfos.notifyDiscord,
            reminderMinutes: eventInfos.reminderMinutes,
            description: eventInfos.description,
            videoGameId: eventInfos.videoGameId ?? null,
            startsAt: new Date(eventInfos.startsAt),
            endsAt: new Date(eventInfos.endsAt),
            maxPlaces: eventInfos.maxPlaces,
            pointsEarned: eventInfos.pointsEarned,
            twitchUrl: eventInfos.twitchUrl,
            winnerShare: eventInfos.winnerShare,
        },
    })
}

export async function updateEvent(eventId: number, eventInfos: UpdateEventInput) {
    return eventTransaction(async tx => {
    const existingEvent = await tx.event.findUnique({
        where: {id: eventId},
        include: {
            _count: {select: {userEvents: true}},
        },
    })

    if (!existingEvent) throw new Error('EVENT_NOT_FOUND')
    if(existingEvent.settledAt) throw new EventError('Cet événement a déjà été récompensé')
    if(eventInfos.attendance && (existingEvent.startsAt>new Date() || existingEvent.endsAt<=new Date())) throw new Error('ATTENDANCE_UNAVAILABLE')
    if(existingEvent.startsAt<=new Date() && ((eventInfos.pointsEarned!==undefined && eventInfos.pointsEarned!==existingEvent.pointsEarned) || (eventInfos.winnerShare!==undefined && eventInfos.winnerShare!==existingEvent.winnerShare) || (eventInfos.startsAt!==undefined && new Date(eventInfos.startsAt).getTime()!==existingEvent.startsAt.getTime()) || (eventInfos.endsAt!==undefined && new Date(eventInfos.endsAt).getTime()!==existingEvent.endsAt.getTime()))) throw new EventError('Horaires et barème sont figés après le début')

    if (eventInfos.videoGameId) {
        const videoGame = await tx.videoGame.findUnique({
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

        if (eventInfos.attendance) {
            const {userId, isPresent} = eventInfos.attendance
            const result = await tx.userEvent.updateMany({
                where: {eventId, userId},
                data: {isPresent},
            })
            if (result.count !== 1) throw new Error('NOT_REGISTERED')
        }
        return tx.event.update({
        where: {id: eventId},
        data: {
            name: eventInfos.name,
            notifyPush: eventInfos.notifyPush,
            notifyEmail: eventInfos.notifyEmail,
            notifyDiscord: eventInfos.notifyDiscord,
            reminderMinutes: eventInfos.reminderMinutes,
            description: eventInfos.description,
            videoGameId: eventInfos.videoGameId,
            startsAt: eventInfos.startsAt ? startsAt : undefined,
            endsAt: eventInfos.endsAt ? endsAt : undefined,
            maxPlaces: eventInfos.maxPlaces,
            pointsEarned: eventInfos.pointsEarned,
            twitchUrl: eventInfos.twitchUrl,
            winnerShare: eventInfos.winnerShare,
        },
        })
    })
}

export async function deleteEvent(eventId: number) {
    return eventTransaction(async tx => {
        const event=await tx.event.findUnique({where:{id:eventId}})
        if(!event) throw new Error('EVENT_NOT_FOUND')
        if(event.settledAt) throw new EventError('Un événement récompensé doit être conservé')
        return tx.event.delete({where:{id:eventId}})
    })
}
