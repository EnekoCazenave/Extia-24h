import {beforeEach, describe, expect, it, vi} from 'vitest'
import {registerToEvent} from '../src/services/event.service.js'

const db = vi.hoisted(() => ({
    event: {findUnique: vi.fn()},
    user: {findUnique: vi.fn()},
    userEvent: {findUnique: vi.fn(), create: vi.fn()},
    $transaction: vi.fn(),
}))
vi.mock('../src/lib/prisma.js', () => ({prisma: db}))

describe('Event registration availability', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        db.$transaction.mockImplementation((callback) => callback(db))
        db.user.findUnique.mockResolvedValue({id: 7})
        db.userEvent.findUnique.mockResolvedValue(null)
    })

    it.each([
        ['à venir', 60_000, 120_000, 1, null],
        ['en cours avec une place libre', -60_000, 60_000, 1, null],
        ['en cours complet', -60_000, 60_000, 2, 'EVENT_FULL'],
        ['terminé avec une place libre', -120_000, -60_000, 1, 'EVENT_ENDED'],
    ] as const)('%s', async (_label, startOffset, endOffset, count, error) => {
        const now = Date.now()
        db.event.findUnique.mockResolvedValue({
            id: 3, startsAt: new Date(now + startOffset), endsAt: new Date(now + endOffset),
            maxPlaces: 2, _count: {userEvents: count},
        })
        if (error) {
            await expect(registerToEvent(7, 3)).rejects.toThrow(error)
            expect(db.userEvent.create).not.toHaveBeenCalled()
        } else {
            await registerToEvent(7, 3)
            expect(db.userEvent.create).toHaveBeenCalledWith({data: {userId: 7, eventId: 3}})
        }
    })
})
