import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { buildApp } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'

describe('Déclarations : API, upload et crédits réels', () => {
  let app: FastifyInstance, playerId: number, adminId: number, gameId: number, modeId: number
  let playerCookie: string, adminCookie: string, proofUrl: string, sessionId: number
  let previousProofRequired = false
  const prefix = `declaration-flow-${Date.now()}`
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j4tEAAAAASUVORK5CYII=', 'base64')

  beforeAll(async () => {
    app = await buildApp({ logger: false }); await app.ready()
    previousProofRequired = (await prisma.siteSettings.findUnique({ where: { id: 1 } }))?.proofRequired ?? false
    await prisma.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, proofRequired: true }, update: { proofRequired: true } })
    const user = (roleId: number) => prisma.user.create({ data: { login: `${prefix}-${roleId}`, email: `${prefix}-${roleId}@integration.invalid`, firstname: 'Test', lastname: 'Déclaration', password: 'not-used-for-login', roleId } })
    playerId = (await user(1)).id; adminId = (await user(2)).id
    playerCookie = `access_token=${app.jwt.sign({ sub: playerId, roleId: 1, email: `${prefix}-1@integration.invalid` })}`
    adminCookie = `access_token=${app.jwt.sign({ sub: adminId, roleId: 2, email: `${prefix}-2@integration.invalid` })}`
    gameId = (await prisma.videoGame.create({ data: { nom: prefix } })).id
    modeId = (await prisma.gameType.create({ data: { videoGameId: gameId, name: 'Score', calculType: 'NUMBER', calculConfig: { type: 'NUMBER', multiplier: 1 }, win: 'Score', maxPointsPerUser: 20 } })).id
  })

  afterAll(async () => {
    if (modeId) {
      await prisma.userGame.deleteMany({ where: { gameTypeId: modeId } })
      await prisma.gameSessionMember.deleteMany({ where: { session: { gameTypeId: modeId } } })
      await prisma.gameSession.deleteMany({ where: { gameTypeId: modeId } })
      await prisma.gameType.delete({ where: { id: modeId } })
    }
    if (gameId) await prisma.videoGame.delete({ where: { id: gameId } })
    await prisma.event.deleteMany({ where: { name: prefix } })
    await prisma.user.deleteMany({ where: { id: { in: [playerId, adminId].filter(Boolean) } } })
    await prisma.siteSettings.update({ where: { id: 1 }, data: { proofRequired: previousProofRequired } })
    if (proofUrl) await fs.unlink(fileURLToPath(new URL(`../${proofUrl}`, import.meta.url)))
    await app.close(); await prisma.$disconnect()
  })

  const credits = () => prisma.userGame.findMany({ where: { gameTypeId: modeId }, select: { score: true } })
  const payload = (value: number, proof = proofUrl) => ({ gameTypeId: modeId, calculType: 'NUMBER', value, proofUrl: proof })

  it('refuse sans fichier puis accepte un vrai upload et crédite une seule fois', async () => {
    const missing = await app.inject({ method: 'POST', url: '/api/play', headers: { cookie: playerCookie }, payload: payload(5, '/uploads/00000000-0000-0000-0000-000000000000.png') })
    expect(missing.statusCode).toBe(400); expect(await credits()).toEqual([])
    const boundary = 'declaration-integration-boundary'
    const upload = await app.inject({ method: 'POST', url: '/api/upload', headers: { cookie: playerCookie, 'content-type': `multipart/form-data; boundary=${boundary}` }, payload: Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="preuve.png"\r\nContent-Type: image/png\r\n\r\n`), png, Buffer.from(`\r\n--${boundary}--\r\n`)]) })
    expect(upload.statusCode).toBe(200); proofUrl = upload.json().url
    const result = await app.inject({ method: 'POST', url: '/api/play', headers: { cookie: playerCookie }, payload: payload(5) })
    expect(result.statusCode).toBe(201); sessionId = result.json().session.id
    expect(await credits()).toEqual([{ score: 5 }])
  })

  it('protège le propriétaire et conserve le barème original après modification administrative', async () => {
    const forbidden = await app.inject({ url: `/api/play/${sessionId}`, headers: { cookie: adminCookie } })
    expect(forbidden.statusCode).toBe(404)
    await prisma.gameType.update({ where: { id: modeId }, data: { calculType: 'BOOLEAN', calculConfig: { type: 'BOOLEAN', trueValue: 100, falseValue: 0 } } })
    const original = await app.inject({ url: `/api/play/${sessionId}`, headers: { cookie: playerCookie } })
    expect(original.json().session.calculConfig).toEqual({ type: 'NUMBER', multiplier: 1 })
    const edit = await app.inject({ method: 'PUT', url: `/api/play/${sessionId}`, headers: { cookie: playerCookie }, payload: payload(7) })
    expect(edit.statusCode).toBe(200); expect(await credits()).toEqual([{ score: 7 }])
    const invalid = await app.inject({ method: 'PUT', url: `/api/play/${sessionId}`, headers: { cookie: playerCookie }, payload: { gameTypeId: modeId, calculType: 'BOOLEAN', value: true, proofUrl } })
    expect(invalid.statusCode).toBe(400); expect(await credits()).toEqual([{ score: 7 }])
  })

  it('garde plusieurs corrections après refus en attente et exige une preuve à la modération', async () => {
    expect((await app.inject({ method: 'PATCH', url: `/api/moderation/sessions/${sessionId}/reject`, headers: { cookie: adminCookie } })).statusCode).toBe(200)
    for (const value of [8, 9]) {
      const edit = await app.inject({ method: 'PUT', url: `/api/play/${sessionId}`, headers: { cookie: playerCookie }, payload: payload(value) })
      expect(edit.statusCode).toBe(200); expect(edit.json().session.status).toBe('PENDING'); expect(await credits()).toEqual([])
    }
    await prisma.gameSession.update({ where: { id: sessionId }, data: { proofUrl: null } })
    expect((await app.inject({ method: 'PATCH', url: `/api/moderation/sessions/${sessionId}/approve`, headers: { cookie: adminCookie } })).statusCode).toBe(409)
    expect(await credits()).toEqual([])
    await prisma.gameSession.update({ where: { id: sessionId }, data: { proofUrl } })
    expect((await app.inject({ method: 'PATCH', url: `/api/moderation/sessions/${sessionId}/approve`, headers: { cookie: adminCookie } })).statusCode).toBe(200)
    expect(await credits()).toEqual([{ score: 9 }])
  })

  it('crée un événement libre sans points et bloque inscription et attribution', async () => {
    const created = await app.inject({ method: 'POST', url: '/api/admin/events', headers: { cookie: adminCookie }, payload: { name: prefix, description: 'Animation libre', startsAt: new Date(Date.now() + 60_000).toISOString(), endsAt: new Date(Date.now() + 120_000).toISOString(), maxPlaces: 1, registrationRequired: false, awardsPoints: false, pointsEarned: 0 } })
    expect(created.statusCode).toBe(201)
    const eventId = created.json().event.id
    expect((await app.inject({ method: 'POST', url: `/api/events/${eventId}/participation`, headers: { cookie: playerCookie } })).statusCode).toBe(409)
    expect((await app.inject({ method: 'POST', url: `/api/admin/events/${eventId}/settle`, headers: { cookie: adminCookie }, payload: { winnerId: null } })).statusCode).toBe(409)
    expect(await prisma.eventAward.count({ where: { eventId } })).toBe(0)
  })
})
