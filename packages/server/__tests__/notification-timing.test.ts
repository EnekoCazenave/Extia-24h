import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsSchema, UpdateEventSchema } from '@extia-gaming/shared'

const db = vi.hoisted(() => ({
  event: { findMany: vi.fn() },
  siteSettings: { findUnique: vi.fn() },
  eventChannelDelivery: { createMany: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
  siteNotificationDelivery: { createMany: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
}))
vi.mock('../src/lib/prisma.js', () => ({ prisma: db }))
import { dispatchReminders, reminderDue } from '../src/services/notification-dispatch.service.js'

const at = new Date('2026-10-15T12:00:00Z')
const time = (minutes: number) => new Date(at.getTime() + minutes * 60000)
const config = { publicKey: null, discordReady: true }
const sender = { push: vi.fn(), discord: vi.fn() }

describe('Notification timing', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    db.event.findMany.mockResolvedValue([])
    db.siteSettings.findUnique.mockResolvedValue(null)
    db.eventChannelDelivery.updateMany.mockResolvedValue({ count: 1 })
    db.siteNotificationDelivery.updateMany.mockResolvedValue({ count: 1 })
  })

  it('supports early reminders, zero and a bounded catch-up period', () => {
    expect(reminderDue(at, 60, time(-61))).toBe(false)
    expect(reminderDue(at, 60, time(-60))).toBe(true)
    expect(reminderDue(at, 0, time(-1))).toBe(false)
    expect(reminderDue(at, 0, at)).toBe(true)
    expect(reminderDue(at, 0, time(4))).toBe(true)
    expect(reminderDue(at, 60, time(5))).toBe(false)
  })

  it('uses each event delay and sends once to Discord without registrations', async () => {
    db.event.findMany.mockResolvedValue([{ id: 1, name: 'Quiz', startsAt: at, reminderMinutes: 60, notifyDiscord: true, userEvents: [] }])
    await dispatchReminders(sender, time(-61), config)
    expect(sender.discord).not.toHaveBeenCalled()
    await dispatchReminders(sender, time(-60), config)
    expect(sender.discord).toHaveBeenCalledTimes(1)
    db.eventChannelDelivery.updateMany.mockResolvedValue({ count: 0 })
    await dispatchReminders(sender, time(-59), config)
    expect(sender.discord).toHaveBeenCalledTimes(1)
  })

  it('handles independent start/end announcements and missing configuration', async () => {
    db.siteSettings.findUnique.mockResolvedValue({ eventStart: at, eventEnd: time(1440), notifyStartDiscord: true, notifyEndDiscord: true, startReminderMinutes: 30, endReminderMinutes: 15 })
    await dispatchReminders(sender, time(-30), { publicKey: null })
    expect(sender.discord).not.toHaveBeenCalled()
    await dispatchReminders(sender, time(-31), config)
    expect(sender.discord).not.toHaveBeenCalled()
    await dispatchReminders(sender, time(-30), config)
    expect(sender.discord).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Extia Gaming : début des 24 heures' }))
    await dispatchReminders(sender, time(1425), config)
    expect(sender.discord).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Extia Gaming : fin des 24 heures' }))
    expect(sender.discord).toHaveBeenCalledTimes(2)
    db.siteNotificationDelivery.updateMany.mockResolvedValue({ count: 0 })
    await dispatchReminders(sender, time(1426), config)
    expect(sender.discord).toHaveBeenCalledTimes(2)
  })

  it('skips disabled, undated and expired announcements', async () => {
    for (const eventStart of [null, time(-6), at]) {
      db.siteSettings.findUnique.mockResolvedValue({ eventStart, notifyStartDiscord: eventStart !== at, startReminderMinutes: 0 })
      await dispatchReminders(sender, at, config)
    }
    expect(sender.discord).not.toHaveBeenCalled()
  })

  it('leaves a failed announcement unsent for retry', async () => {
    db.siteSettings.findUnique.mockResolvedValue({ eventStart: at, notifyStartDiscord: true, startReminderMinutes: 0 })
    sender.discord.mockRejectedValueOnce(new Error('Unavailable'))
    await dispatchReminders(sender, at, config)
    expect(db.siteNotificationDelivery.update).not.toHaveBeenCalled()
    await dispatchReminders(sender, time(2), config)
    expect(db.siteNotificationDelivery.update).toHaveBeenCalledOnce()
    expect(db.siteNotificationDelivery.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ attempts: { lt: 3 }, sentAt: null }) }))
  })

  it('validates delays without resetting omitted options', () => {
    for (const minutes of [-1, 0.5, 10081]) {
      expect(UpdateEventSchema.safeParse({ reminderMinutes: minutes }).success).toBe(false)
      expect(SettingsSchema.safeParse({ eventStart: null, eventEnd: null, startReminderMinutes: minutes }).success).toBe(false)
    }
    expect(UpdateEventSchema.parse({ reminderMinutes: 0 }).reminderMinutes).toBe(0)
    expect(SettingsSchema.parse({ eventStart: null, eventEnd: null }).notifyStartDiscord).toBeUndefined()
  })
})
