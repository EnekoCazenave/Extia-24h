import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildApp } from '../src/app.js';
vi.mock('@prisma/client', () => {
    const mockPrisma = {
        user: { update: vi.fn() },
    };
    return { PrismaClient: vi.fn(() => mockPrisma) };
});
describe('PUT /api/users/me', () => {
    beforeEach(() => { vi.clearAllMocks(); });
    it('returns 401 when unauthenticated', async () => {
        const app = await buildApp({ logger: false });
        await app.ready();
        const res = await app.inject({
            method: 'PUT',
            url: '/api/users/me',
            payload: { login: 'newlogin' },
        });
        expect(res.statusCode).toBe(401);
        await app.close();
    });
});
//# sourceMappingURL=users.test.js.map