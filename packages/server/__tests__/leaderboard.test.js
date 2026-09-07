import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';
vi.mock('@prisma/client', () => {
    const mockPrisma = {
        $queryRaw: vi.fn(), gameSession: { findMany: vi.fn().mockResolvedValue([]) },
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
describe('GET /api/leaderboard/me', () => {
    beforeEach(() => { vi.clearAllMocks(); });
    it('requires authentication', async () => {
        const { PrismaClient } = await import('@prisma/client');
        const db = new PrismaClient();
        const app = await buildApp({ logger: false });
        try {
            const res = await app.inject({ method: 'GET', url: '/api/leaderboard/me' });
            expect(res.statusCode).toBe(401);
            expect(db.$queryRaw).not.toHaveBeenCalled();
        }
        finally {
            await app.close();
        }
    });
    it.each([0, 300])('returns only the authenticated user with score %s and their global rank', async (score) => {
        const { PrismaClient } = await import('@prisma/client');
        const db = new PrismaClient();
        db.$queryRaw.mockResolvedValue([
            { rank: 150n, userId: 7, login: 'alice', firstname: 'Alice', lastname: 'Doe', totalScore: BigInt(score) },
        ]);
        const app = await buildApp({ logger: false });
        try {
            await app.ready();
            const token = app.jwt.sign({ sub: 7, email: 'alice@test.fr', roleId: 1 });
            const res = await app.inject({ method: 'GET', url: '/api/leaderboard/me?userId=8&limit=1',
                cookies: { access_token: token } });
            expect(res.statusCode).toBe(200);
            expect(res.json()).toMatchObject({ ranking: {
                    rank: 150, userId: 7, login: 'alice', firstname: 'Alice', lastname: 'Doe', totalScore: score,
                } });
            const query = db.$queryRaw.mock.calls[0][0];
            expect(query.values.at(-1)).toBe(7);
            expect(query.strings.join('')).toContain('ROW_NUMBER()');
            expect(query.strings.join('')).not.toContain('LIMIT');
        }
        finally {
            await app.close();
        }
    });
    it('returns 404 when the authenticated user no longer exists', async () => {
        const { PrismaClient } = await import('@prisma/client');
        const db = new PrismaClient();
        db.$queryRaw.mockResolvedValue([]);
        const app = await buildApp({ logger: false });
        try {
            await app.ready();
            const token = app.jwt.sign({ sub: 7, email: 'alice@test.fr', roleId: 1 });
            const res = await app.inject({ method: 'GET', url: '/api/leaderboard/me', cookies: { access_token: token } });
            expect(res.statusCode).toBe(404);
        }
        finally {
            await app.close();
        }
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