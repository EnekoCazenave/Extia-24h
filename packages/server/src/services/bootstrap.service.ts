import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const credentialsSchema = z.object({
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(16).max(72),
  ADMIN_LOGIN: z.string().min(1).default('admin'),
})

export async function ensureInitialAdmin(config: NodeJS.ProcessEnv = process.env) {
  return prisma.$transaction(async (tx) => {
    // Serialize simultaneous server starts against the same database.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(24002026)`
    for (const [id, name] of [[1, 'user'], [2, 'admin'], [3, 'moderator']] as const) {
      const role = await tx.role.findUnique({ where: { id } })
      if (role && role.name !== name) throw new Error(`Role ${id} conflicts with ${name}`)
      if (!role) await tx.role.create({ data: { id, name } })
    }
    await tx.$executeRaw`SELECT setval(pg_get_serial_sequence('"Role"', 'id'), (SELECT MAX(id) FROM "Role"))`

    if (await tx.user.findFirst({ where: { roleId: 2 }, select: { id: true } })) {
      return 'existing' as const
    }
    const parsed = credentialsSchema.safeParse(config)
    if (!parsed.success) {
      throw new Error('No administrator exists: configure ADMIN_EMAIL and ADMIN_PASSWORD (16-72 characters)')
    }
    const credentials = parsed.data
    if (await tx.user.findUnique({ where: { email: credentials.ADMIN_EMAIL }, select: { id: true } })) {
      throw new Error('ADMIN_EMAIL is already used by a non-admin account; choose another address')
    }
    await tx.user.create({ data: {
      email: credentials.ADMIN_EMAIL,
      login: credentials.ADMIN_LOGIN,
      password: await bcrypt.hash(credentials.ADMIN_PASSWORD, 12),
      firstname: 'Super',
      lastname: 'Admin',
      intern: true,
      roleId: 2,
    } })
    return 'created' as const
  }, { timeout: 15000 })
}
