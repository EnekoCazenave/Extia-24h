import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import ExcelJS from 'exceljs'
import { buildApp } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'
import { reportingData, exportWorkbook } from '../src/services/reporting.service.js'
import { exportData, publicSettings, listGroups } from '../src/services/community.service.js'
import { getEventById } from '../src/services/event.service.js'
import { getGameDetail } from '../src/services/game.service.js'
import { submitPlay } from '../src/services/play.service.js'
import { getGlobalLeaderboard } from '../src/services/leaderboard.service.js'
import { PlayInputSchema } from '@extia-gaming/shared'

describe('Choix juridiques et statistiques', () => {
  let app: FastifyInstance, consentingId: number, otherId: number, modeId: number, gameId: number, eventId: number, groupId: number
  let generalBeforeWithdrawal: Awaited<ReturnType<typeof publicSettings>>
  const prefix = `legal-${Date.now()}`
  const ids: number[] = []
  const payload = (suffix: string) => ({ login: `${prefix}-${suffix}`, firstname: 'Identite-privee', lastname: 'Ne-pas-exporter', email: `${prefix}-${suffix}@example.invalid`, password: 'Password123!', termsAccepted: true, adultConfirmed: true })

  beforeAll(async () => {
    app = await buildApp({ logger: false })
    await app.ready()
  })
  afterAll(async () => {
    await prisma.userGame.deleteMany({ where: { userId: { in: ids } } })
    if (modeId) {
      await prisma.gameSessionMember.deleteMany({ where: { session: { gameTypeId: modeId } } })
      await prisma.gameSession.deleteMany({ where: { gameTypeId: modeId } })
      await prisma.gameType.delete({ where: { id: modeId } })
    }
    if (eventId) {
      await prisma.eventAward.deleteMany({ where: { eventId } })
      await prisma.event.delete({ where: { id: eventId } })
    }
    if (gameId) await prisma.videoGame.delete({ where: { id: gameId } })
    await prisma.pointBonus.deleteMany({ where: { userId: { in: ids } } })
    await prisma.refreshToken.deleteMany({ where: { userId: { in: ids } } })
    await prisma.user.deleteMany({ where: { id: { in: ids } } })
    if (groupId) {
      await prisma.groupPoint.deleteMany({ where: { groupId } })
      await prisma.organizationGroup.delete({ where: { id: groupId } })
    }
    await app.close()
    await prisma.$disconnect()
  })

  it('refuse l’ancien consentement global, le refus du règlement et l’absence de majorité', async () => {
    for (const extra of [{ termsAccepted: undefined, consentAccepted: true }, { termsAccepted: false }, { adultConfirmed: false }, { adultConfirmed: undefined }]) {
      const res = await app.inject({ method: 'POST', url: '/auth/register', payload: { ...payload('refuse'), ...extra } })
      expect(res.statusCode).toBe(400)
    }
    expect(await prisma.user.count({ where: { email: payload('refuse').email } })).toBe(0)
  })

  it('autorise l’inscription sans provenance ni consentement aux statistiques et conserve les choix datés', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/register', payload: payload('sans-consentement') })
    expect(res.statusCode).toBe(201)
    otherId = res.json().user.id
    ids.push(otherId)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: otherId } })
    expect(user.statisticsConsent).toBe(false)
    expect(user.groupId).toBeNull()
    expect(user.termsAcceptedAt).toBeInstanceOf(Date)
    expect(user.adultConfirmedAt).toBeInstanceOf(Date)
    expect(user.termsVersion).toBe('2026-10-16')
    expect(user.password).not.toBe(payload('sans-consentement').password)
  })

  it('exclut les non-consentants des indicateurs et de toutes les feuilles, même dans une équipe mixte', async () => {
    const totalsBefore = await publicSettings()
    const res = await app.inject({ method: 'POST', url: '/auth/register', payload: { ...payload('accord'), statisticsConsent: true } })
    expect(res.statusCode).toBe(201)
    consentingId = res.json().user.id
    ids.push(consentingId)
    groupId = (await prisma.organizationGroup.create({ data: { name: prefix, kind: 'AGENCY' } })).id
    await prisma.user.updateMany({ where: { id: { in: ids } }, data: { groupId } })
    gameId = (await prisma.videoGame.create({ data: { nom: prefix } })).id
    modeId = (await prisma.gameType.create({ data: { name: prefix, videoGameId: gameId, calculType: 'BOOLEAN', calculConfig: { type: 'BOOLEAN', trueValue: 10, falseValue: 0 }, win: 'Victoire', team: true } })).id
    await submitPlay(otherId, PlayInputSchema.parse({ gameTypeId: modeId, calculType: 'BOOLEAN', value: true, teamMemberIds: [consentingId] }))
    eventId = (await prisma.event.create({ data: { name: prefix, description: 'Test', videoGameId: gameId, pointsEarned: 10, startsAt: new Date(), endsAt: new Date(Date.now() + 60000), maxPlaces: 10, winnerId: otherId, userEvents: { create: [{ userId: consentingId, isPresent: true }, { userId: otherId, isPresent: true }] } } })).id
    await prisma.eventAward.createMany({ data: [{ eventId, userId: consentingId, points: 6 }, { eventId, userId: otherId, points: 4 }] })
    await prisma.pointBonus.createMany({ data: [{ userId: consentingId, grantedById: otherId, points: 2 }, { userId: otherId, grantedById: consentingId, points: 3 }] })
    await prisma.groupPoint.create({ data: { groupId, grantedById: otherId, points: 7, reason: 'Collectif' } })
    generalBeforeWithdrawal = await publicSettings()
    expect(generalBeforeWithdrawal).toMatchObject({
      participantCount: totalsBefore.participantCount + 1,
      gamePoints: totalsBefore.gamePoints + 20,
      eventPoints: totalsBefore.eventPoints + 10,
      bonusPoints: totalsBefore.bonusPoints + 5,
      groupBonusPoints: totalsBefore.groupBonusPoints + 7,
      totalPoints: totalsBefore.totalPoints + 42,
    })
    expect((await getGameDetail(gameId))?.totalScore).toBe(30)
    expect((await listGroups()).find(g => g.id === groupId)).toMatchObject({ members: 2, playerPoints: 35, totalPoints: 42 })
    expect(await getEventById(eventId)).toMatchObject({ participantCount: 2, remainingPlaces: 8 })
    const report = await reportingData()
    expect(report.participants.map(u => u.id)).toContain(consentingId)
    expect(report.participants.map(u => u.id)).not.toContain(otherId)
    expect(report.participants.find(u => u.id === consentingId)?.totalPoints).toBe(18)
    expect(report.groups.find(g => g.id === groupId)).toMatchObject({ members: 1, playerPoints: 18, totalPoints: 25 })
    const sessionSheet = report.sheets.find(s => s.name === 'Parties')!
    const row = sessionSheet.rows.find(r => r[sessionSheet.columns.indexOf('Utilisateur ID')] === consentingId)!
    expect(row[sessionSheet.columns.indexOf('Déclarant ID')]).toBeNull()
    const eventSheet = report.sheets.find(s => s.name === 'Événements')!
    const eventRow = eventSheet.rows.find(r => r[0] === eventId)!
    expect(eventRow[eventSheet.columns.indexOf('Inscrits')]).toBe(1)
    expect(eventRow[eventSheet.columns.indexOf('Gagnant ID')]).toBeNull()
    for (const kind of ['participants', 'presences', 'parties', 'points', 'groupes', 'evenements']) {
      const csv = await exportData(kind)
      expect(csv).not.toContain(payload('sans-consentement').login)
      expect(csv).not.toContain('Identite-privee')
      expect(csv).not.toContain('@example.invalid')
    }
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await exportWorkbook())
    expect(JSON.stringify(workbook.model)).not.toContain(payload('sans-consentement').login)
    expect(JSON.stringify(workbook.model)).not.toContain('Identite-privee')
    for (const url of ['/api/leaderboard', '/api/leaderboard/players?team=true', `/api/games/${gameId}`]) {
      const response = await app.inject({ url })
      expect(response.statusCode).toBe(200)
      expect(response.body).not.toContain('Identite-privee')
      expect(response.body).not.toContain('Ne-pas-exporter')
      expect(response.body).not.toContain('@example.invalid')
    }
  })

  it('retire l’accord via le profil sans supprimer les points ou les inscriptions de compétition', async () => {
    const cookie = `access_token=${app.jwt.sign({ sub: consentingId, roleId: 1, email: payload('accord').email })}`
    const directory = await app.inject({ url: '/api/users', headers: { cookie } })
    expect(directory.statusCode).toBe(200)
    expect(directory.body).not.toContain('Identite-privee')
    expect(directory.body).not.toContain('@example.invalid')
    const res = await app.inject({ method: 'PUT', url: '/api/users/me', headers: { cookie }, payload: { statisticsConsent: false } })
    expect(res.statusCode).toBe(200)
    expect(res.json().user.statisticsConsent).toBe(false)
    expect((await reportingData()).participants.map(u => u.id)).not.toContain(consentingId)
    expect((await getGlobalLeaderboard(1000)).find(u => u.userId === consentingId)?.totalScore).toBe(18)
    expect((await getGlobalLeaderboard(1000)).find(u => u.userId === otherId)?.totalScore).toBe(17)
    expect(await publicSettings()).toEqual(generalBeforeWithdrawal)
    expect((await listGroups()).find(g => g.id === groupId)).toMatchObject({ members: 2, playerPoints: 35, totalPoints: 42 })
    expect(await getEventById(eventId)).toMatchObject({ participantCount: 2, remainingPlaces: 8 })
    expect(await prisma.userEvent.count({ where: { eventId, userId: consentingId } })).toBe(1)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: consentingId } })).statisticsConsentUpdatedAt).toBeInstanceOf(Date)
  })
})
