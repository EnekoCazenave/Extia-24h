import type {FastifyInstance} from 'fastify'
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'
import {buildApp} from '../src/app.js'

const eventService = vi.hoisted(() => ({
    listAllEvents: vi.fn(),
    getEventById: vi.fn(),
    registerToEvent: vi.fn(),
    unregisterToEvent: vi.fn(),
    createEvent: vi.fn(),
    updateEvent: vi.fn(),
    deleteEvent: vi.fn(),
}))

vi.mock('../src/services/event.service.js', () => eventService)

describe('Event controller', () => {
    let app: FastifyInstance
    let userToken: string
    let adminToken: string

    beforeAll(async () => {
        app = await buildApp({logger: false})
        await app.ready()

        userToken = app.jwt.sign({sub: 7, email: 'user@test.fr', roleId: 1})
        adminToken = app.jwt.sign({sub: 1, email: 'admin@test.fr', roleId: 2})
    })

    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterAll(async () => {
        await app.close()
    })

    it('GET /api/events est accessible sans authentification', async () => {
        eventService.listAllEvents.mockResolvedValue([])

        const response = await app.inject({method: 'GET', url: '/api/events'})

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({events: []})
        expect(eventService.listAllEvents).toHaveBeenCalledWith(undefined)
    })

    it("GET /api/events transmet l'id de l'utilisateur connecté", async () => {
        eventService.listAllEvents.mockResolvedValue([])

        const response = await app.inject({
            method: 'GET',
            url: '/api/events',
            cookies: {access_token: userToken},
        })

        expect(response.statusCode).toBe(200)
        expect(eventService.listAllEvents).toHaveBeenCalledWith(7)
    })

    it('GET /api/events/:eventId retourne le détail d\'un event', async () => {
        eventService.getEventById.mockResolvedValue({id: 3, name: 'Tournoi'})

        const response = await app.inject({method: 'GET', url: '/api/events/3'})

        expect(response.statusCode).toBe(200)
        expect(response.json().event).toEqual({id: 3, name: 'Tournoi'})
        expect(eventService.getEventById).toHaveBeenCalledWith(3, undefined)
    })

    it('POST /api/events/:eventId/participation inscrit l\'utilisateur connecté', async () => {
        const registration = {userId: 7, eventId: 3, registeredAt: new Date()}
        eventService.registerToEvent.mockResolvedValue(registration)

        const response = await app.inject({
            method: 'POST',
            url: '/api/events/3/participation',
            cookies: {access_token: userToken},
        })

        expect(response.statusCode).toBe(201)
        expect(eventService.registerToEvent).toHaveBeenCalledWith(7, 3)
        expect(response.json().registration.eventId).toBe(3)
    })

    it("POST /api/events/:eventId/participation retourne 409 si l'event est complet", async () => {
        eventService.registerToEvent.mockRejectedValue(new Error('EVENT_FULL'))

        const response = await app.inject({
            method: 'POST',
            url: '/api/events/3/participation',
            cookies: {access_token: userToken},
        })

        expect(response.statusCode).toBe(409)
        expect(response.json().error).toBe('Event is full')
    })

    it('DELETE /api/events/:eventId/participation désinscrit l\'utilisateur', async () => {
        eventService.unregisterToEvent.mockResolvedValue({userId: 7, eventId: 3})

        const response = await app.inject({
            method: 'DELETE',
            url: '/api/events/3/participation',
            cookies: {access_token: userToken},
        })

        expect(response.statusCode).toBe(204)
        expect(eventService.unregisterToEvent).toHaveBeenCalledWith(7, 3)
    })

    it('POST /api/admin/events crée un event pour un administrateur', async () => {
        const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
        const endsAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        const payload = {
            name: 'Tournoi',
            description: 'Un tournoi de test',
            startsAt,
            endsAt,
            maxPlaces: 10,
        }
        eventService.createEvent.mockResolvedValue({id: 4, ...payload})

        const response = await app.inject({
            method: 'POST',
            url: '/api/admin/events',
            cookies: {access_token: adminToken},
            payload,
        })

        expect(response.statusCode).toBe(201)
        expect(eventService.createEvent).toHaveBeenCalledWith(payload)
        expect(response.json().event.id).toBe(4)
    })

    it('PUT /api/admin/events/:eventId retourne 404 si l\'event est introuvable', async () => {
        eventService.updateEvent.mockRejectedValue(new Error('EVENT_NOT_FOUND'))

        const response = await app.inject({
            method: 'PUT',
            url: '/api/admin/events/999',
            cookies: {access_token: adminToken},
            payload: {name: 'Nouveau nom'},
        })

        expect(response.statusCode).toBe(404)
        expect(response.json().error).toBe('Event not found')
        expect(eventService.updateEvent).toHaveBeenCalledWith(999, {name: 'Nouveau nom'})
    })

    it('DELETE /api/admin/events/:eventId supprime un event', async () => {
        eventService.deleteEvent.mockResolvedValue({id: 4})

        const response = await app.inject({
            method: 'DELETE',
            url: '/api/admin/events/4',
            cookies: {access_token: adminToken},
        })

        expect(response.statusCode).toBe(204)
        expect(eventService.deleteEvent).toHaveBeenCalledWith(4)
    })
})
