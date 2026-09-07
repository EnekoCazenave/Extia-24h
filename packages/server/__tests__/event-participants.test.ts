import {beforeEach, describe, expect, it, vi} from 'vitest'
import {getEventById, updateEvent} from '../src/services/event.service.js'

const db = vi.hoisted(() => ({
    event: {findUnique: vi.fn(), update: vi.fn()},
    userEvent: {findMany: vi.fn(), updateMany: vi.fn()},
    $transaction: vi.fn(),
}))
vi.mock('../src/lib/prisma.js', () => ({prisma: db}))

describe('Event participants', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        db.event.findUnique.mockResolvedValue({
            id: 3, maxPlaces: 10, startsAt: new Date('2026-09-10'),
            endsAt: new Date('2026-09-11'), createdAt: new Date(), updatedAt: new Date(),
            _count: {userEvents: 1}, userEvents: [],
        })
        db.$transaction.mockImplementation((callback) => callback(db))
    })

    it('ne charge ni ne retourne les participants sans droits administrateur', async () => {
        const result = await getEventById(3, 7)
        expect(result).not.toHaveProperty('participants')
        expect(db.userEvent.findMany).not.toHaveBeenCalled()
    })

    it('retourne uniquement une sélection minimale pour les administrateurs', async () => {
        db.userEvent.findMany.mockResolvedValue([
            {user: {id: 7, firstname: 'Alice', lastname: 'Martin'}, isPresent: null},
        ])
        const result = await getEventById(3, 1, true)
        expect(db.userEvent.findMany).toHaveBeenCalledWith({
            where: {eventId: 3}, orderBy: {registeredAt: 'asc'},
            select: {isPresent: true, user: {select: {id: true, firstname: true, lastname: true}}},
        })
        expect(result.participants).toEqual([{id: 7, firstname: 'Alice', lastname: 'Martin', isPresent: null}])
        expect(result.isRegistered).toBe(false)
    })

    it('enregistre la présence pour le couple événement / participant', async () => {
        db.userEvent.updateMany.mockResolvedValue({count: 1})
        await updateEvent(3, {attendance: {userId: 7, isPresent: false}})
        expect(db.userEvent.updateMany).toHaveBeenCalledWith({
            where: {eventId: 3, userId: 7}, data: {isPresent: false},
        })
    })

    it('refuse un utilisateur non inscrit à cet événement', async () => {
        db.userEvent.updateMany.mockResolvedValue({count: 0})
        await expect(updateEvent(3, {attendance: {userId: 8, isPresent: true}}))
            .rejects.toThrow('NOT_REGISTERED')
        expect(db.event.update).not.toHaveBeenCalled()
    })
})
