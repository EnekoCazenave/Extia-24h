import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';
vi.mock('@prisma/client', async (importOriginal) => {
    const actual = await importOriginal();
    const mockPrisma = {
        gameType: { findUnique: vi.fn() },
        userGame: { create: vi.fn() },
    };
    return { ...actual, PrismaClient: vi.fn(() => mockPrisma) };
});
describe('POST /api/play', () => {
    beforeEach(() => { vi.clearAllMocks(); });
    it('returns 401 when unauthenticated', async () => {
        const app = await buildApp({ logger: false });
        await app.ready();
        const res = await app.inject({
            method: 'POST',
            url: '/api/play',
            payload: { gameTypeId: 1, calculType: 'NUMBER', value: 100 },
        });
        expect(res.statusCode).toBe(401);
        await app.close();
    });
    it('returns 400 when body is invalid (missing calculType)', async () => {
        const app = await buildApp({ logger: false });
        await app.ready();
        const res = await app.inject({
            method: 'POST',
            url: '/api/play',
            payload: { gameTypeId: 1 },
        });
        expect(res.statusCode).not.toBe(200);
        await app.close();
    });
});
//# sourceMappingURL=play.test.js.map