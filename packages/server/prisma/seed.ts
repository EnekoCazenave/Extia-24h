import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Roles
  const userRole = await prisma.role.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'user' },
  })
  const adminRole = await prisma.role.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'admin' },
  })

  // Sample video games
  const lol = await prisma.videoGame.upsert({
    where: { id: 1 },
    update: {},
    create: { nom: 'League of Legends' },
  })
  const chess = await prisma.videoGame.upsert({
    where: { id: 2 },
    update: {},
    create: { nom: 'Échecs' },
  })

  // Sample game types
  await prisma.gameType.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '5v5 Classique',
      calcul: 'Meilleur de 3',
      win: "Destruction du Nexus adverse",
      team: true,
      videoGameId: lol.id,
    },
  })
  await prisma.gameType.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Tournoi Blitz',
      calcul: 'Points ELO',
      win: 'Roi mis en échec',
      team: false,
      videoGameId: chess.id,
    },
  })

  // Admin user
  const hashedPassword = await bcrypt.hash('Admin1234!', 12)
  await prisma.user.upsert({
    where: { email: 'admin@extia.fr' },
    update: {},
    create: {
      login: 'admin',
      email: 'admin@extia.fr',
      password: hashedPassword,
      firstname: 'Super',
      lastname: 'Admin',
      intern: true,
      roleId: adminRole.id,
    },
  })

  console.log('Seed complete. Roles:', { userRole, adminRole })
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
