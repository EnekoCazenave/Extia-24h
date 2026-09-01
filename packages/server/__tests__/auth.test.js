import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestApp } from './helpers/buildApp.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
describe('Auth routes', () => {
    let app;
    beforeAll(async () => {
        app = await buildTestApp();
        await prisma.refreshToken.deleteMany({});
        await prisma.user.deleteMany({ where: { email: { endsWith: '@test.extia.fr' } } });
    });
    afterAll(async () => {
        await prisma.refreshToken.deleteMany({});
        await prisma.user.deleteMany({ where: { email: { endsWith: '@test.extia.fr' } } });
        await prisma.$disconnect();
        await app.close();
    });
    describe('POST /auth/register', () => {
        it('creates a user and returns cookies', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: {
                    login: 'testuser',
                    email: 'testuser@test.extia.fr',
                    password: 'Password123!',
                    firstname: 'Test',
                    lastname: 'User',
                    intern: false,
                    consentAccepted: true,
                },
            });
            expect(response.statusCode).toBe(201);
            const body = response.json();
            expect(body.user.email).toBe('testuser@test.extia.fr');
            expect(body.user.password).toBeUndefined();
            expect(response.cookies.find((c) => c.name === 'access_token')).toBeDefined();
            expect(response.cookies.find((c) => c.name === 'refresh_token')).toBeDefined();
        });
        it('returns 409 when email already taken', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/auth/register',
                payload: {
                    login: 'testuser2',
                    email: 'testuser@test.extia.fr',
                    password: 'Password123!',
                    firstname: 'Test',
                    lastname: 'User',
                    intern: false,
                    consentAccepted: true,
                },
            });
            expect(response.statusCode).toBe(409);
        });
    });
    describe('POST /auth/login', () => {
        it('returns cookies on valid credentials', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'testuser@test.extia.fr', password: 'Password123!' },
            });
            expect(response.statusCode).toBe(200);
            expect(response.cookies.find((c) => c.name === 'access_token')).toBeDefined();
        });
        it('returns 401 on wrong password', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/auth/login',
                payload: { email: 'testuser@test.extia.fr', password: 'wrongpassword' },
            });
            expect(response.statusCode).toBe(401);
        });
    });
    describe('POST /auth/logout', () => {
        it('clears cookies', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/auth/logout',
            });
            expect(response.statusCode).toBe(200);
            const accessCookie = response.cookies.find((c) => c.name === 'access_token');
            expect(accessCookie?.value).toBe('');
        });
    });
});
//# sourceMappingURL=auth.test.js.map