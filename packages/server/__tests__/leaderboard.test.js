import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';
vi.mock('@prisma/client', () => {
    const mockPrisma = {
        $queryRaw: vi.fn(),
    };
    // Prisma.sql is a tagged template literal used in the service — mock it as a passthrough
    const Prisma = {
        sql: (strings, ...values) => ({ strings, values }),
    };
    return { PrismaClient: vi.fn(() => mockPrisma), Prisma };
});
describe('GET /api/leaderboard', () => {
    beforeEach(() => { vi.clearAllMocks(); });
    it('returns 200 with rankings array', async () => {
        const { PrismaClient } = await import('@prisma/client');
        const mockPrisma = new PrismaClient();
        mockPrisma.$queryRaw.mockResolvedValue([
            { userId: 1, login: 'player1', firstname: 'Alice', lastname: 'Doe', totalScore: BigInt(300) },
        ]);
        const app = await buildApp({ logger: false });
        await app.ready();
        const res = await app.inject({ method: 'GET', url: '/api/leaderboard' });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(Array.isArray(body.rankings)).toBe(true);
        await app.close();
    });
    it('accepts limit query param', async () => {
        const { PrismaClient } = await import('@prisma/client');
        const mockPrisma = new PrismaClient();
        mockPrisma.$queryRaw.mockResolvedValue([]);
        const app = await buildApp({ logger: false });
        await app.ready();
        const res = await app.inject({ method: 'GET', url: '/api/leaderboard?limit=5' });
        expect(res.statusCode).toBe(200);
        await app.close();
    });
});
describe('GET /api/leaderboard/top-games', () => {
    beforeEach(() => { vi.clearAllMocks(); });
    it('returns 200 with games array', async () => {
        const { PrismaClient } = await import('@prisma/client');
        const mockPrisma = new PrismaClient();
        mockPrisma.$queryRaw.mockResolvedValue([
            { videoGameId: 1, nom: 'Rocket League', imageUrl: null, totalScore: BigInt(500) },
        ]);
        const app = await buildApp({ logger: false });
        await app.ready();
        const res = await app.inject({ method: 'GET', url: '/api/leaderboard/top-games' });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(Array.isArray(body.games)).toBe(true);
        await app.close();
    });
});
//# sourceMappingURL=leaderboard.test.js.map