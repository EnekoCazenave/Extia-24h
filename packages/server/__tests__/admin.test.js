import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';
vi.mock('@prisma/client', () => {
    const mockPrisma = {
        videoGame: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
        gameType: { create: vi.fn() },
        pointBonus: { create: vi.fn() },
        user: { findUnique: vi.fn() },
    };
    return { PrismaClient: vi.fn(() => mockPrisma) };
});
describe('POST /api/admin/games', () => {
    beforeEach(() => { vi.clearAllMocks(); });
    it('returns 401 when unauthenticated', async () => {
        const app = await buildApp({ logger: false });
        await app.ready();
        const res = await app.inject({
            method: 'POST',
            url: '/api/admin/games',
            payload: { nom: 'Rocket League' },
        });
        expect(res.statusCode).toBe(401);
        await app.close();
    });
});
describe('POST /api/admin/bonuses', () => {
    beforeEach(() => { vi.clearAllMocks(); });
    it('returns 401 when unauthenticated', async () => {
        const app = await buildApp({ logger: false });
        await app.ready();
        const res = await app.inject({
            method: 'POST',
            url: '/api/admin/bonuses',
            payload: { userId: 1, points: 50 },
        });
        expect(res.statusCode).toBe(401);
        await app.close();
    });
});
//# sourceMappingURL=admin.test.js.map