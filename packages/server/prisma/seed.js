import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    // Roles
    const userRole = await prisma.role.upsert({
        where: { id: 1 },
        update: {},
        create: { name: 'user' },
    });
    const adminRole = await prisma.role.upsert({
        where: { id: 2 },
        update: {},
        create: { name: 'admin' },
    });
    const moderatorRole = await prisma.role.upsert({
        where: { id: 3 },
        update: {},
        create: { name: 'moderator' },
    });
    // Sample video games
    const lol = await prisma.videoGame.upsert({
        where: { id: 1 },
        update: {},
        create: { nom: 'League of Legends' },
    });
    const chess = await prisma.videoGame.upsert({
        where: { id: 2 },
        update: {},
        create: { nom: 'Échecs' },
    });
    // Sample game types
    await prisma.gameType.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: '5v5 Classique',
            calculType: 'BOOLEAN',
            calculConfig: { type: 'BOOLEAN', trueValue: 100, falseValue: 0 },
            win: "Destruction du Nexus adverse",
            team: true,
            videoGameId: lol.id,
        },
    });
    await prisma.gameType.upsert({
        where: { id: 2 },
        update: {},
        create: {
            name: 'Tournoi Blitz',
            calculType: 'NUMBER',
            calculConfig: { type: 'NUMBER', multiplier: 1 },
            win: 'Roi mis en échec',
            team: false,
            videoGameId: chess.id,
        },
    });
    let createdAt = new Date();
    const startsAt = new Date(Date.now() + 60 * 60 * 1000); // dans 1 heure
    const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000); // 2 h après
    // Event
    await prisma.event.upsert({
        where: { id: 1 },
        update: {},
        create: {
            name: 'Tournoi Blitz',
            description: 'MEGA TOURNOI DE MALADE MENTAL',
            createdAt: createdAt,
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            maxPlaces: 10,
            pointsEarned: 1,
            updatedAt: new Date(),
            videoGameId: 1
        }
    });
    // Admin user
    const hashedPassword = await bcrypt.hash('Admin1234!', 12);
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
    });
    // Moderator user
    const hashedModPassword = await bcrypt.hash('Modo1234!', 12);
    await prisma.user.upsert({
        where: { email: 'moderateur@extia.fr' },
        update: {},
        create: {
            login: 'moderateur',
            email: 'moderateur@extia.fr',
            password: hashedModPassword,
            firstname: 'Super',
            lastname: 'Modérateur',
            intern: true,
            roleId: moderatorRole.id,
        },
    });
    console.log('Seed complete. Roles:', { userRole, adminRole, moderatorRole });
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map