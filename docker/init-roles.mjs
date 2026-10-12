import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
try {
  // Required by registration and authorization; no demo data or default account.
  await prisma.$transaction(async (tx) => {
    for (const [id, name] of [[1, 'user'], [2, 'admin'], [3, 'moderator']]) {
      const existing = await tx.role.findUnique({ where: { id } })
      if (existing && existing.name !== name) {
        throw new Error(`Role ${id} conflicts with the expected ${name} role`)
      }
      if (!existing) await tx.role.create({ data: { id, name } })
    }
    await tx.$executeRaw`SELECT setval(pg_get_serial_sequence('"Role"', 'id'), (SELECT MAX(id) FROM "Role"))`
  })
  console.log('Required roles are ready')
} finally {
  await prisma.$disconnect()
}
