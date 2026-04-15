# Foundation Implementation Plan — Extia Gaming 24h

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the full monorepo with Fastify server, React SPA client, shared Zod schemas, Prisma DB with migrations, JWT auth (httpOnly cookies), security plugins, SEO basics, and accessibility tooling — zero business features.

**Architecture:** pnpm workspaces with three packages (`shared`, `server`, `client`). JWT in httpOnly cookies only. Zod schemas defined once in `shared`, used by server for validation and by client for type inference. Prisma manages all migrations. Vitest tests across all packages.

**Tech Stack:** pnpm 9, TypeScript 5 (strict), Node 20, Fastify 4, Prisma 5, Zod 3, React 18, Vite 5, React Router 6, TanStack Query 5, Axios 1, React Helmet Async 2, Vitest 1, @testing-library/react 14, bcryptjs, @fastify/jwt, @fastify/cookie, @fastify/cors, @fastify/helmet, @fastify/rate-limit, @fastify/csrf-protection, eslint-plugin-jsx-a11y

---

## File Map

```
/
├── packages/
│   ├── shared/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── schemas/
│   │       │   ├── auth.schema.ts
│   │       │   ├── user.schema.ts
│   │       │   └── index.ts
│   │       └── types/
│   │           └── index.ts
│   ├── server/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── index.ts
│   │       ├── app.ts
│   │       ├── env.ts
│   │       ├── plugins/
│   │       │   ├── cookie.ts
│   │       │   ├── cors.ts
│   │       │   ├── helmet.ts
│   │       │   ├── jwt.ts
│   │       │   ├── rateLimit.ts
│   │       │   └── csrf.ts
│   │       ├── hooks/
│   │       │   └── authenticate.ts
│   │       ├── routes/
│   │       │   ├── index.ts
│   │       │   └── auth.ts
│   │       ├── controllers/
│   │       │   └── auth.controller.ts
│   │       └── services/
│   │           └── auth.service.ts
│   │   └── __tests__/
│   │       ├── helpers/
│   │       │   └── buildApp.ts
│   │       ├── health.test.ts
│   │       └── auth.test.ts
│   └── client/
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── vite.config.ts
│       ├── vitest.config.ts
│       ├── eslint.config.js
│       ├── index.html
│       ├── public/
│       │   ├── robots.txt
│       │   └── sitemap.xml
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── components/
│           │   ├── AppLayout.tsx
│           │   ├── SEOHead.tsx
│           │   └── ProtectedRoute.tsx
│           ├── pages/
│           │   ├── HomePage.tsx
│           │   ├── LoginPage.tsx
│           │   └── NotFoundPage.tsx
│           ├── contexts/
│           │   └── AuthContext.tsx
│           ├── hooks/
│           │   └── useAuth.ts
│           ├── services/
│           │   └── api.ts
│           └── utils/
│               └── focusTrap.ts
│           └── __tests__/
│               ├── SEOHead.test.tsx
│               ├── ProtectedRoute.test.tsx
│               └── focusTrap.test.ts
├── .env.example
├── .gitignore
├── pnpm-workspace.yaml
└── package.json
```

---

### Task 1: Monorepo root scaffolding

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root)
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - 'packages/*'
```

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "extia-gaming-24h",
  "private": true,
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  },
  "scripts": {
    "dev": "pnpm --parallel --filter=!@extia-gaming/shared run dev",
    "build": "pnpm --filter @extia-gaming/shared run build && pnpm --parallel --filter=!@extia-gaming/shared run build",
    "test": "pnpm -r run test",
    "db:migrate": "pnpm --filter @extia-gaming/server run db:migrate",
    "db:seed": "pnpm --filter @extia-gaming/server run db:seed",
    "audit": "pnpm -r audit"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 3: Create `.env.example`**

```env
# Server
DATABASE_URL=postgresql://user:password@localhost:5432/extia_gaming
JWT_SECRET=change-me-to-a-random-32-char-minimum-string
REFRESH_SECRET=change-me-to-another-random-32-char-minimum-string
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
PORT=3000
ALLOWED_ORIGINS=http://localhost:5173
NODE_ENV=development

# Client
VITE_API_URL=http://localhost:3000
```

- [ ] **Step 4: Update `.gitignore`**

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Environment
.env
.env.local
.env.*.local

# Build outputs
dist/
build/

# Prisma
packages/server/prisma/migrations/*.sql

# IDE
.idea/
.vscode/
*.iml

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage/
```

- [ ] **Step 5: Verify pnpm is installed**

Run: `pnpm --version`
Expected: version 9.x printed. If not installed: `npm install -g pnpm@9`

- [ ] **Step 6: Install root deps**

Run: `pnpm install`
Expected: `node_modules` created at root.

- [ ] **Step 7: Commit**

```bash
git add pnpm-workspace.yaml package.json .env.example .gitignore
git commit -m "chore: initialize pnpm monorepo workspace"
```

---

### Task 2: Shared package — Zod schemas + TypeScript types

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/schemas/auth.schema.ts`
- Create: `packages/shared/src/schemas/user.schema.ts`
- Create: `packages/shared/src/schemas/index.ts`
- Create: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create `packages/shared/package.json`**

```json
{
  "name": "@extia-gaming/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 2: Create `packages/shared/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/shared/src/schemas/auth.schema.ts`**

```typescript
import { z } from 'zod'

export const RegisterSchema = z.object({
  login: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstname: z.string().min(1).max(100),
  lastname: z.string().min(1).max(100),
  intern: z.boolean().default(false),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const RefreshSchema = z.object({
  // body is empty — refresh token is in httpOnly cookie
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
```

- [ ] **Step 4: Create `packages/shared/src/schemas/user.schema.ts`**

```typescript
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.number(),
  login: z.string(),
  email: z.string().email(),
  firstname: z.string(),
  lastname: z.string(),
  intern: z.boolean(),
  roleId: z.number(),
})

export const UserPublicSchema = UserSchema.omit({ roleId: true }).extend({
  role: z.object({ id: z.number(), name: z.string() }),
})

export type User = z.infer<typeof UserSchema>
export type UserPublic = z.infer<typeof UserPublicSchema>
```

- [ ] **Step 5: Create `packages/shared/src/schemas/index.ts`**

```typescript
export * from './auth.schema.js'
export * from './user.schema.js'
```

- [ ] **Step 6: Create `packages/shared/src/types/index.ts`**

```typescript
export interface JWTPayload {
  sub: number       // user id
  email: string
  roleId: number
  iat?: number
  exp?: number
}

export interface ApiError {
  error: string
  message?: string
  statusCode: number
}
```

- [ ] **Step 7: Create `packages/shared/src/index.ts`**

```typescript
export * from './schemas/index.js'
export * from './types/index.js'
```

- [ ] **Step 8: Install shared deps and verify typecheck**

Run: `pnpm --filter @extia-gaming/shared install`
Run: `pnpm --filter @extia-gaming/shared run typecheck`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): add Zod schemas and TypeScript types"
```

---

### Task 3: Prisma schema + migration + seed

**Files:**
- Create: `packages/server/package.json` (partial — enough for Prisma CLI)
- Create: `packages/server/prisma/schema.prisma`
- Create: `packages/server/prisma/seed.ts`

> Note: Full server package.json is completed in Task 4. This task only needs enough to run Prisma CLI.

- [ ] **Step 1: Create minimal `packages/server/package.json`**

```json
{
  "name": "@extia-gaming/server",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@extia-gaming/shared": "workspace:*",
    "@fastify/cookie": "^9.4.0",
    "@fastify/cors": "^9.0.1",
    "@fastify/csrf-protection": "^6.4.1",
    "@fastify/helmet": "^11.1.1",
    "@fastify/jwt": "^8.0.1",
    "@fastify/rate-limit": "^9.1.0",
    "@prisma/client": "^5.15.0",
    "bcryptjs": "^2.4.3",
    "fastify": "^4.28.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.14.9",
    "prisma": "^5.15.0",
    "tsx": "^4.16.0",
    "typescript": "^5.4.5",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Copy `.env.example` to `.env` and fill in your local values**

> **Do not commit `.env`.** Only edit it locally.

```bash
cp .env.example .env
# Edit .env with your local PostgreSQL credentials
```

- [ ] **Step 3: Create `packages/server/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            Int               @id @default(autoincrement())
  login         String
  password      String
  lastname      String
  firstname     String
  intern        Boolean           @default(false)
  email         String            @unique
  role          Role              @relation(fields: [roleId], references: [id])
  roleId        Int
  userGames     UserGame[]
  userTeams     UserTeam[]
  achievements  UserAchievement[]
  userEvents    UserEvent[]
  refreshTokens RefreshToken[]
}

model Role {
  id    Int    @id @default(autoincrement())
  name  String
  users User[]
}

model VideoGame {
  id             Int        @id @default(autoincrement())
  nom            String
  happyHourStart DateTime?
  happyHourEnd   DateTime?
  gameTypes      GameType[]
}

model GameType {
  id          Int        @id @default(autoincrement())
  name        String
  calcul      String
  win         String
  team        Boolean    @default(false)
  videoGame   VideoGame  @relation(fields: [videoGameId], references: [id])
  videoGameId Int
  teams       Team[]
  userGames   UserGame[]
}

model Team {
  id         Int        @id @default(autoincrement())
  gameType   GameType   @relation(fields: [gameTypeId], references: [id])
  gameTypeId Int
  members    UserTeam[]
}

model UserTeam {
  team   Team @relation(fields: [teamId], references: [id])
  teamId Int
  user   User @relation(fields: [userId], references: [id])
  userId Int

  @@id([teamId, userId])
}

model UserGame {
  user       User     @relation(fields: [userId], references: [id])
  userId     Int
  gameType   GameType @relation(fields: [gameTypeId], references: [id])
  gameTypeId Int

  @@id([userId, gameTypeId])
}

model Achievement {
  id          Int               @id @default(autoincrement())
  name        String
  description String?
  users       UserAchievement[]
}

model UserAchievement {
  user          User        @relation(fields: [userId], references: [id])
  userId        Int
  achievement   Achievement @relation(fields: [achievementId], references: [id])
  achievementId Int

  @@id([userId, achievementId])
}

model Event {
  id         Int         @id @default(autoincrement())
  name       String
  userEvents UserEvent[]
}

model UserEvent {
  user    User  @relation(fields: [userId], references: [id])
  userId  Int
  event   Event @relation(fields: [eventId], references: [id])
  eventId Int

  @@id([userId, eventId])
}

model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  user      User     @relation(fields: [userId], references: [id])
  userId    Int
  expiresAt DateTime
}
```

- [ ] **Step 4: Install Prisma deps**

Run: `pnpm --filter @extia-gaming/server install`

- [ ] **Step 5: Run first migration**

Run (from `packages/server/`): `pnpm db:migrate`
When prompted for migration name, enter: `init`
Expected: `packages/server/prisma/migrations/` created with SQL file. Prisma client generated.

- [ ] **Step 6: Create `packages/server/prisma/seed.ts`**

```typescript
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
```

- [ ] **Step 7: Run seed**

Run: `pnpm --filter @extia-gaming/server run db:seed`
Expected: `Seed complete. Roles: { userRole: ..., adminRole: ... }` logged.

- [ ] **Step 8: Commit**

```bash
git add packages/server/package.json packages/server/prisma
git commit -m "feat(server): add Prisma schema, initial migration, and seed"
```

---

### Task 4: Fastify server foundation

**Files:**
- Create: `packages/server/tsconfig.json`
- Create: `packages/server/vitest.config.ts`
- Create: `packages/server/src/env.ts`
- Create: `packages/server/src/app.ts`
- Create: `packages/server/src/index.ts`
- Create: `packages/server/__tests__/helpers/buildApp.ts`
- Create: `packages/server/__tests__/health.test.ts`

- [ ] **Step 1: Create `packages/server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "paths": {
      "@extia-gaming/shared": ["../shared/src/index.ts"]
    }
  },
  "include": ["src", "prisma", "__tests__"]
}
```

- [ ] **Step 2: Create `packages/server/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: [],
    globals: true,
  },
})
```

- [ ] **Step 3: Create `packages/server/src/env.ts`**

```typescript
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(3000),
  ALLOWED_ORIGINS: z.string(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
})

export const env = envSchema.parse(process.env)
```

- [ ] **Step 4: Create `packages/server/src/app.ts`**

```typescript
import Fastify, { FastifyInstance } from 'fastify'

export interface BuildOptions {
  logger?: boolean | object
}

export async function buildApp(opts: BuildOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: opts.logger ?? {
      level: 'info',
      transport: { target: 'pino-pretty' },
    },
  })

  // Plugins registered in later tasks — stubs for now
  // await fastify.register(import('./plugins/cookie.js'))
  // await fastify.register(import('./plugins/cors.js'))
  // await fastify.register(import('./plugins/helmet.js'))
  // await fastify.register(import('./plugins/jwt.js'))
  // await fastify.register(import('./plugins/rateLimit.js'))
  // await fastify.register(import('./plugins/csrf.js'))
  // await fastify.register(import('./routes/index.js'))

  fastify.get('/health', async () => ({ status: 'ok' }))

  return fastify
}
```

- [ ] **Step 5: Create `packages/server/src/index.ts`**

```typescript
import { buildApp } from './app.js'
import { env } from './env.js'

const app = await buildApp()

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
```

- [ ] **Step 6: Create `packages/server/__tests__/helpers/buildApp.ts`**

```typescript
import { buildApp } from '../../src/app.js'
import type { FastifyInstance } from 'fastify'

export async function buildTestApp(): Promise<FastifyInstance> {
  // Silence logs in tests
  const app = await buildApp({ logger: false })
  await app.ready()
  return app
}
```

- [ ] **Step 7: Write failing test**

Create `packages/server/__tests__/health.test.ts`:

```typescript
import { describe, it, expect, afterAll } from 'vitest'
import { buildTestApp } from './helpers/buildApp.js'

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const app = await buildTestApp()
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
    await app.close()
  })
})
```

- [ ] **Step 8: Run test to verify it fails**

Run: `pnpm --filter @extia-gaming/server run test`
Expected: FAIL (module resolution errors, env missing).

Create a `.env.test` for tests:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/extia_gaming_test
JWT_SECRET=test-secret-must-be-at-least-32-characters-long
REFRESH_SECRET=test-refresh-must-be-at-least-32-characters
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
NODE_ENV=test
```

Update `vitest.config.ts` to load `.env.test`:

```typescript
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => ({
  test: {
    environment: 'node',
    globals: true,
    env: loadEnv(mode, process.cwd(), ''),
  },
}))
```

Install `vite` in server devDeps: add `"vite": "^5.3.0"` to `packages/server/package.json` devDependencies, then `pnpm --filter @extia-gaming/server install`.

- [ ] **Step 9: Run test to verify it passes**

Run: `pnpm --filter @extia-gaming/server run test`
Expected: `GET /health > returns 200 with status ok` PASS.

- [ ] **Step 10: Commit**

```bash
git add packages/server/src packages/server/tsconfig.json packages/server/vitest.config.ts packages/server/__tests__
git commit -m "feat(server): add Fastify app factory and health endpoint"
```

---

### Task 5: Security plugins

**Files:**
- Create: `packages/server/src/plugins/cookie.ts`
- Create: `packages/server/src/plugins/cors.ts`
- Create: `packages/server/src/plugins/helmet.ts`
- Create: `packages/server/src/plugins/rateLimit.ts`
- Create: `packages/server/src/plugins/csrf.ts`
- Modify: `packages/server/src/app.ts`
- Modify: `packages/server/__tests__/health.test.ts`

- [ ] **Step 1: Create `packages/server/src/plugins/cookie.ts`**

```typescript
import fp from 'fastify-plugin'
import cookie from '@fastify/cookie'

export default fp(async (fastify) => {
  await fastify.register(cookie, {
    secret: process.env.JWT_SECRET!, // signs cookies
    hook: 'onRequest',
  })
})
```

Add `"fastify-plugin": "^4.5.1"` to server dependencies, run `pnpm --filter @extia-gaming/server install`.

- [ ] **Step 2: Create `packages/server/src/plugins/cors.ts`**

```typescript
import fp from 'fastify-plugin'
import cors from '@fastify/cors'
import { env } from '../env.js'

export default fp(async (fastify) => {
  await fastify.register(cors, {
    origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true, // required for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
})
```

- [ ] **Step 3: Create `packages/server/src/plugins/helmet.ts`**

```typescript
import fp from 'fastify-plugin'
import helmet from '@fastify/helmet'

export default fp(async (fastify) => {
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
  })
})
```

- [ ] **Step 4: Create `packages/server/src/plugins/rateLimit.ts`**

```typescript
import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'

export default fp(async (fastify) => {
  await fastify.register(rateLimit, {
    global: false, // applied per-route, not globally
    max: 100,
    timeWindow: '1 minute',
  })
})
```

- [ ] **Step 5: Create `packages/server/src/plugins/csrf.ts`**

```typescript
import fp from 'fastify-plugin'
import csrf from '@fastify/csrf-protection'

export default fp(async (fastify) => {
  await fastify.register(csrf, {
    sessionPlugin: '@fastify/cookie',
    cookieOpts: { signed: true, httpOnly: false, sameSite: 'strict' },
  })
})
```

- [ ] **Step 6: Register all security plugins in `packages/server/src/app.ts`**

Replace the stub comments with actual imports:

```typescript
import Fastify, { FastifyInstance } from 'fastify'
import cookiePlugin from './plugins/cookie.js'
import corsPlugin from './plugins/cors.js'
import helmetPlugin from './plugins/helmet.js'
import rateLimitPlugin from './plugins/rateLimit.js'
import csrfPlugin from './plugins/csrf.js'

export interface BuildOptions {
  logger?: boolean | object
}

export async function buildApp(opts: BuildOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: opts.logger ?? {
      level: 'info',
      transport: { target: 'pino-pretty' },
    },
  })

  await fastify.register(cookiePlugin)
  await fastify.register(corsPlugin)
  await fastify.register(helmetPlugin)
  await fastify.register(rateLimitPlugin)
  await fastify.register(csrfPlugin)

  // Routes registered in Task 7
  fastify.get('/health', async () => ({ status: 'ok' }))

  return fastify
}
```

- [ ] **Step 7: Add security headers test to `packages/server/__tests__/health.test.ts`**

```typescript
import { describe, it, expect, afterAll } from 'vitest'
import { buildTestApp } from './helpers/buildApp.js'

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const app = await buildTestApp()
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
    await app.close()
  })

  it('sets X-Frame-Options header (helmet)', async () => {
    const app = await buildTestApp()
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN')
    await app.close()
  })
})
```

- [ ] **Step 8: Run tests**

Run: `pnpm --filter @extia-gaming/server run test`
Expected: both health tests PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/server/src/plugins packages/server/src/app.ts packages/server/__tests__/health.test.ts
git commit -m "feat(server): register security plugins (helmet, cors, rate-limit, csrf, cookie)"
```

---

### Task 6: JWT plugin + authenticate hook

**Files:**
- Create: `packages/server/src/plugins/jwt.ts`
- Create: `packages/server/src/hooks/authenticate.ts`
- Modify: `packages/server/src/app.ts`

- [ ] **Step 1: Create `packages/server/src/plugins/jwt.ts`**

```typescript
import fp from 'fastify-plugin'
import jwtPlugin from '@fastify/jwt'
import { env } from '../env.js'
import type { JWTPayload } from '@extia-gaming/shared'

declare module 'fastify' {
  interface FastifyRequest {
    user: JWTPayload
  }
}

export default fp(async (fastify) => {
  await fastify.register(jwtPlugin, {
    secret: env.JWT_SECRET,
  })
})
```

- [ ] **Step 2: Create `packages/server/src/hooks/authenticate.ts`**

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { JWTPayload } from '@extia-gaming/shared'

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = request.cookies['access_token']
  if (!token) {
    reply.code(401).send({ error: 'Unauthorized', statusCode: 401 })
    return
  }
  try {
    const payload = request.server.jwt.verify<JWTPayload>(token)
    request.user = payload
  } catch {
    reply.code(401).send({ error: 'Token invalid or expired', statusCode: 401 })
  }
}
```

- [ ] **Step 3: Register JWT plugin in `packages/server/src/app.ts`**

Add `import jwtPlugin from './plugins/jwt.js'` and `await fastify.register(jwtPlugin)` after the other plugins.

Full updated `app.ts`:

```typescript
import Fastify, { FastifyInstance } from 'fastify'
import cookiePlugin from './plugins/cookie.js'
import corsPlugin from './plugins/cors.js'
import helmetPlugin from './plugins/helmet.js'
import rateLimitPlugin from './plugins/rateLimit.js'
import csrfPlugin from './plugins/csrf.js'
import jwtPlugin from './plugins/jwt.js'

export interface BuildOptions {
  logger?: boolean | object
}

export async function buildApp(opts: BuildOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: opts.logger ?? {
      level: 'info',
      transport: { target: 'pino-pretty' },
    },
  })

  await fastify.register(cookiePlugin)
  await fastify.register(corsPlugin)
  await fastify.register(helmetPlugin)
  await fastify.register(rateLimitPlugin)
  await fastify.register(csrfPlugin)
  await fastify.register(jwtPlugin)

  // Routes registered in Task 7
  fastify.get('/health', async () => ({ status: 'ok' }))

  return fastify
}
```

- [ ] **Step 4: Write failing authenticate hook test**

Create `packages/server/__tests__/authenticate.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { buildTestApp } from './helpers/buildApp.js'
import { authenticate } from '../src/hooks/authenticate.js'

describe('authenticate hook', () => {
  it('rejects request without cookie', async () => {
    const app = await buildTestApp()

    // Register a test route that uses the authenticate hook
    app.get('/protected', { preHandler: [authenticate] }, async () => ({ ok: true }))

    const response = await app.inject({ method: 'GET', url: '/protected' })
    expect(response.statusCode).toBe(401)
    expect(response.json().error).toBe('Unauthorized')

    await app.close()
  })

  it('allows request with valid access_token cookie', async () => {
    const app = await buildTestApp()

    // Generate a valid token
    const token = app.jwt.sign({ sub: 1, email: 'test@test.com', roleId: 1 })

    app.get('/protected', { preHandler: [authenticate] }, async () => ({ ok: true }))

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      cookies: { access_token: token },
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ ok: true })

    await app.close()
  })
})
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @extia-gaming/server run test`
Expected: all tests PASS including the 2 new authenticate tests.

- [ ] **Step 6: Commit**

```bash
git add packages/server/src/plugins/jwt.ts packages/server/src/hooks packages/server/src/app.ts packages/server/__tests__/authenticate.test.ts
git commit -m "feat(server): add JWT plugin and authenticate preHandler hook"
```

---

### Task 7: Auth routes, controller, service + tests

**Files:**
- Create: `packages/server/src/services/auth.service.ts`
- Create: `packages/server/src/controllers/auth.controller.ts`
- Create: `packages/server/src/routes/auth.ts`
- Create: `packages/server/src/routes/index.ts`
- Modify: `packages/server/src/app.ts`
- Create: `packages/server/__tests__/auth.test.ts`

- [ ] **Step 1: Create `packages/server/src/services/auth.service.ts`**

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import type { RegisterInput, LoginInput } from '@extia-gaming/shared'

const prisma = new PrismaClient()

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new Error('EMAIL_TAKEN')

  const hashedPassword = await bcrypt.hash(input.password, 12)

  // Default role = 'user' (id: 1, set by seed)
  const user = await prisma.user.create({
    data: {
      login: input.login,
      email: input.email,
      password: hashedPassword,
      firstname: input.firstname,
      lastname: input.lastname,
      intern: input.intern,
      roleId: 1,
    },
    include: { role: true },
  })

  const { password: _, ...userPublic } = user
  return userPublic
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { role: true },
  })
  if (!user) throw new Error('INVALID_CREDENTIALS')

  const valid = await bcrypt.compare(input.password, user.password)
  if (!valid) throw new Error('INVALID_CREDENTIALS')

  const { password: _, ...userPublic } = user
  return userPublic
}

export async function createRefreshToken(userId: number): Promise<string> {
  const token = crypto.randomBytes(64).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await prisma.refreshToken.create({ data: { token, userId, expiresAt } })
  return token
}

export async function rotateRefreshToken(oldToken: string) {
  const record = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
    include: { user: { include: { role: true } } },
  })
  if (!record || record.expiresAt < new Date()) {
    throw new Error('INVALID_REFRESH_TOKEN')
  }

  // Delete old token (rotation)
  await prisma.refreshToken.delete({ where: { token: oldToken } })

  const newToken = await createRefreshToken(record.userId)
  const { password: _, ...userPublic } = record.user
  return { user: userPublic, newToken }
}

export async function revokeRefreshToken(token: string) {
  await prisma.refreshToken
    .delete({ where: { token } })
    .catch(() => {/* already gone — ignore */})
}
```

- [ ] **Step 2: Create `packages/server/src/controllers/auth.controller.ts`**

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { RegisterInput, LoginInput } from '@extia-gaming/shared'
import {
  registerUser,
  loginUser,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from '../services/auth.service.js'
import { env } from '../env.js'

const COOKIE_BASE = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
}

function setTokenCookies(reply: FastifyReply, accessToken: string, refreshToken: string) {
  reply
    .setCookie('access_token', accessToken, { ...COOKIE_BASE, maxAge: 900 }) // 15min
    .setCookie('refresh_token', refreshToken, { ...COOKIE_BASE, maxAge: 604800 }) // 7d
}

export async function register(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply,
) {
  try {
    const user = await registerUser(request.body)
    const accessToken = request.server.jwt.sign(
      { sub: user.id, email: user.email, roleId: user.roleId },
      { expiresIn: env.JWT_EXPIRES_IN },
    )
    const refreshToken = await createRefreshToken(user.id)
    setTokenCookies(reply, accessToken, refreshToken)
    return reply.code(201).send({ user })
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
      return reply.code(409).send({ error: 'Email already in use', statusCode: 409 })
    }
    throw err
  }
}

export async function login(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply,
) {
  try {
    const user = await loginUser(request.body)
    const accessToken = request.server.jwt.sign(
      { sub: user.id, email: user.email, roleId: user.roleId },
      { expiresIn: env.JWT_EXPIRES_IN },
    )
    const refreshToken = await createRefreshToken(user.id)
    setTokenCookies(reply, accessToken, refreshToken)
    return reply.send({ user })
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      return reply.code(401).send({ error: 'Invalid credentials', statusCode: 401 })
    }
    throw err
  }
}

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  const oldToken = request.cookies['refresh_token']
  if (!oldToken) {
    return reply.code(401).send({ error: 'No refresh token', statusCode: 401 })
  }
  try {
    const { user, newToken } = await rotateRefreshToken(oldToken)
    const accessToken = request.server.jwt.sign(
      { sub: user.id, email: user.email, roleId: user.roleId },
      { expiresIn: env.JWT_EXPIRES_IN },
    )
    setTokenCookies(reply, accessToken, newToken)
    return reply.send({ ok: true })
  } catch {
    return reply.code(401).send({ error: 'Invalid or expired refresh token', statusCode: 401 })
  }
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies['refresh_token']
  if (token) await revokeRefreshToken(token)

  reply
    .clearCookie('access_token', { path: '/' })
    .clearCookie('refresh_token', { path: '/' })
  return reply.send({ ok: true })
}
```

- [ ] **Step 3: Create `packages/server/src/routes/auth.ts`**

```typescript
import type { FastifyInstance } from 'fastify'
import { RegisterSchema, LoginSchema } from '@extia-gaming/shared'
import { register, login, refresh, logout } from '../controllers/auth.controller.js'

export async function authRoutes(fastify: FastifyInstance) {
  // Rate limit auth routes: 10 req/min
  const authRateLimit = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }

  fastify.post('/auth/register', { ...authRateLimit, schema: { body: RegisterSchema } }, register)
  fastify.post('/auth/login', { ...authRateLimit, schema: { body: LoginSchema } }, login)
  fastify.post('/auth/refresh', refresh)
  fastify.post('/auth/logout', logout)
}
```

> Note: Fastify's JSON Schema validator doesn't accept Zod directly. We use Zod for TypeScript types only here, and rely on the controller for runtime validation. To wire Zod into Fastify's validation, install `fastify-type-provider-zod` and configure it. Add `"fastify-type-provider-zod": "^1.1.9"` to server dependencies and update routes:

```typescript
// packages/server/src/routes/auth.ts
import type { FastifyInstance } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { RegisterSchema, LoginSchema } from '@extia-gaming/shared'
import { register, login, refresh, logout } from '../controllers/auth.controller.js'

export async function authRoutes(fastify: FastifyInstance) {
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  const f = fastify.withTypeProvider<ZodTypeProvider>()
  const authRateLimit = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }

  f.post('/auth/register', { ...authRateLimit, schema: { body: RegisterSchema } }, register)
  f.post('/auth/login', { ...authRateLimit, schema: { body: LoginSchema } }, login)
  f.post('/auth/refresh', refresh)
  f.post('/auth/logout', logout)
}
```

- [ ] **Step 4: Create `packages/server/src/routes/index.ts`**

```typescript
import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.js'

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes)
}
```

- [ ] **Step 5: Register routes in `packages/server/src/app.ts`**

Add to the end of `buildApp`, before returning `fastify`:

```typescript
import { registerRoutes } from './routes/index.js'

// Inside buildApp, after plugins:
await fastify.register(registerRoutes)
```

Full final `app.ts`:

```typescript
import Fastify, { FastifyInstance } from 'fastify'
import cookiePlugin from './plugins/cookie.js'
import corsPlugin from './plugins/cors.js'
import helmetPlugin from './plugins/helmet.js'
import rateLimitPlugin from './plugins/rateLimit.js'
import csrfPlugin from './plugins/csrf.js'
import jwtPlugin from './plugins/jwt.js'
import { registerRoutes } from './routes/index.js'

export interface BuildOptions {
  logger?: boolean | object
}

export async function buildApp(opts: BuildOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: opts.logger ?? {
      level: 'info',
      transport: { target: 'pino-pretty' },
    },
  })

  await fastify.register(cookiePlugin)
  await fastify.register(corsPlugin)
  await fastify.register(helmetPlugin)
  await fastify.register(rateLimitPlugin)
  await fastify.register(csrfPlugin)
  await fastify.register(jwtPlugin)
  await fastify.register(registerRoutes)

  fastify.get('/health', async () => ({ status: 'ok' }))

  return fastify
}
```

- [ ] **Step 6: Write auth integration tests**

Create `packages/server/__tests__/auth.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildTestApp } from './helpers/buildApp.js'
import type { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Auth routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildTestApp()
    // Clean test users
    await prisma.refreshToken.deleteMany({})
    await prisma.user.deleteMany({ where: { email: { endsWith: '@test.extia.fr' } } })
  })

  afterAll(async () => {
    await prisma.refreshToken.deleteMany({})
    await prisma.user.deleteMany({ where: { email: { endsWith: '@test.extia.fr' } } })
    await prisma.$disconnect()
    await app.close()
  })

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
        },
      })
      expect(response.statusCode).toBe(201)
      const body = response.json()
      expect(body.user.email).toBe('testuser@test.extia.fr')
      expect(body.user.password).toBeUndefined()
      expect(response.cookies.find((c) => c.name === 'access_token')).toBeDefined()
      expect(response.cookies.find((c) => c.name === 'refresh_token')).toBeDefined()
    })

    it('returns 409 when email already taken', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          login: 'testuser2',
          email: 'testuser@test.extia.fr', // same email
          password: 'Password123!',
          firstname: 'Test',
          lastname: 'User',
          intern: false,
        },
      })
      expect(response.statusCode).toBe(409)
    })
  })

  describe('POST /auth/login', () => {
    it('returns cookies on valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'testuser@test.extia.fr', password: 'Password123!' },
      })
      expect(response.statusCode).toBe(200)
      expect(response.cookies.find((c) => c.name === 'access_token')).toBeDefined()
    })

    it('returns 401 on wrong password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'testuser@test.extia.fr', password: 'wrongpassword' },
      })
      expect(response.statusCode).toBe(401)
    })
  })

  describe('POST /auth/logout', () => {
    it('clears cookies', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
      })
      expect(response.statusCode).toBe(200)
      const accessCookie = response.cookies.find((c) => c.name === 'access_token')
      expect(accessCookie?.value).toBe('')
    })
  })
})
```

- [ ] **Step 7: Run tests**

Run: `pnpm --filter @extia-gaming/server run test`
Expected: all auth tests PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/server/src/services packages/server/src/controllers packages/server/src/routes packages/server/src/app.ts packages/server/__tests__/auth.test.ts
git commit -m "feat(server): implement auth routes (register, login, refresh, logout)"
```

---

### Task 8: Vite + React client foundation

**Files:**
- Create: `packages/client/package.json`
- Create: `packages/client/tsconfig.json`
- Create: `packages/client/tsconfig.node.json`
- Create: `packages/client/vite.config.ts`
- Create: `packages/client/vitest.config.ts`
- Create: `packages/client/index.html`
- Create: `packages/client/src/main.tsx`
- Create: `packages/client/src/App.tsx`

- [ ] **Step 1: Create `packages/client/package.json`**

```json
{
  "name": "@extia-gaming/client",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@extia-gaming/shared": "workspace:*",
    "@tanstack/react-query": "^5.51.1",
    "axios": "^1.7.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-helmet-async": "^2.0.4",
    "react-router-dom": "^6.24.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "eslint": "^9.7.0",
    "eslint-plugin-jsx-a11y": "^6.9.0",
    "jsdom": "^24.1.0",
    "typescript": "^5.4.5",
    "vite": "^5.3.4",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Create `packages/client/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@extia-gaming/shared": ["../shared/src/index.ts"]
    }
  },
  "include": ["src", "__tests__"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create `packages/client/tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "eslint.config.js"]
}
```

- [ ] **Step 4: Create `packages/client/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@extia-gaming/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL ?? 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

- [ ] **Step 5: Create `packages/client/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@extia-gaming/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

Create `packages/client/src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Create `packages/client/index.html`**

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>Extia Gaming 24h</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `packages/client/src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
```

- [ ] **Step 8: Create minimal `packages/client/src/App.tsx`**

```tsx
import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Home</div>} />
    </Routes>
  )
}
```

- [ ] **Step 9: Install client deps**

Run: `pnpm --filter @extia-gaming/client install`

- [ ] **Step 10: Write failing smoke test**

Create `packages/client/__tests__/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect } from 'vitest'
import App from '../src/App.tsx'

function renderApp() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <HelmetProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  )
}

describe('App', () => {
  it('renders without crashing', () => {
    renderApp()
    expect(screen.getByText('Home')).toBeInTheDocument()
  })
})
```

- [ ] **Step 11: Run test**

Run: `pnpm --filter @extia-gaming/client run test`
Expected: `App > renders without crashing` PASS.

- [ ] **Step 12: Commit**

```bash
git add packages/client
git commit -m "feat(client): scaffold Vite + React 18 + TypeScript client"
```

---

### Task 9: Axios API client + CSRF interceptor

**Files:**
- Create: `packages/client/src/services/api.ts`

- [ ] **Step 1: Create `packages/client/src/services/api.ts`**

```typescript
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true, // send httpOnly cookies automatically
  headers: { 'Content-Type': 'application/json' },
})

// Read CSRF token from cookie (set by @fastify/csrf-protection as non-httpOnly)
function getCsrfToken(): string | null {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('_csrf='))
    ?.split('=')[1] ?? null
}

// Attach CSRF token to every mutating request
api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase()
  if (method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrf = getCsrfToken()
    if (csrf) config.headers['x-csrf-token'] = csrf
  }
  return config
})

// Redirect to /login on 401 (expired access token — refresh is handled separately)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      try {
        await api.post('/auth/refresh')
        return api(error.config)
      } catch {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm --filter @extia-gaming/client run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/client/src/services/api.ts
git commit -m "feat(client): add Axios API client with CSRF and refresh interceptors"
```

---

### Task 10: AuthContext + useAuth hook + ProtectedRoute

**Files:**
- Create: `packages/client/src/contexts/AuthContext.tsx`
- Create: `packages/client/src/hooks/useAuth.ts`
- Create: `packages/client/src/components/ProtectedRoute.tsx`
- Create: `packages/client/__tests__/ProtectedRoute.test.tsx`

- [ ] **Step 1: Create `packages/client/src/contexts/AuthContext.tsx`**

```tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { UserPublic } from '@extia-gaming/shared'
import { api } from '../services/api.ts'

interface AuthContextValue {
  user: UserPublic | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Attempt to restore session by fetching current user
    api.get<{ user: UserPublic }>('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await api.post<{ user: UserPublic }>('/auth/login', { email, password })
    setUser(res.data.user)
  }

  async function logout() {
    await api.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}
```

> Note: `/auth/me` route needs to be added to the server. Add it to Task 7 routes:
> ```typescript
> // In packages/server/src/routes/auth.ts, add:
> import { authenticate } from '../hooks/authenticate.js'
> import { PrismaClient } from '@prisma/client'
>
> const prisma = new PrismaClient()
>
> f.get('/auth/me', { preHandler: [authenticate] }, async (request, reply) => {
>   const user = await prisma.user.findUnique({
>     where: { id: request.user.sub },
>     include: { role: true },
>   })
>   if (!user) return reply.code(404).send({ error: 'User not found', statusCode: 404 })
>   const { password: _, ...userPublic } = user
>   return reply.send({ user: userPublic })
> })
> ```

- [ ] **Step 2: Create `packages/client/src/hooks/useAuth.ts`**

```typescript
import { useAuthContext } from '../contexts/AuthContext.tsx'

// Re-export for convenience — keeps component imports clean
export const useAuth = useAuthContext
```

- [ ] **Step 3: Create `packages/client/src/components/ProtectedRoute.tsx`**

```tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'

interface Props {
  requiredRole?: string
}

export default function ProtectedRoute({ requiredRole }: Props) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main aria-live="polite" aria-label="Chargement en cours">
        <p>Chargement…</p>
      </main>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (requiredRole && user.role.name !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
```

- [ ] **Step 4: Add AuthProvider to `packages/client/src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './contexts/AuthContext.tsx'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
```

- [ ] **Step 5: Write failing ProtectedRoute test**

Create `packages/client/__tests__/ProtectedRoute.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import ProtectedRoute from '../src/components/ProtectedRoute.tsx'

// Mock useAuth
vi.mock('../src/hooks/useAuth.ts', () => ({
  useAuth: vi.fn(),
}))
import { useAuth } from '../src/hooks/useAuth.ts'
const mockUseAuth = vi.mocked(useAuth)

function renderWithRouter(initialRoute = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('shows loading state while auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true, login: vi.fn(), logout: vi.fn() })
    renderWithRouter()
    expect(screen.getByText('Chargement…')).toBeInTheDocument()
  })

  it('redirects to /login when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, login: vi.fn(), logout: vi.fn() })
    renderWithRouter()
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders outlet when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, login: 'u', email: 'u@test.com', firstname: 'U', lastname: 'S', intern: false, role: { id: 1, name: 'user' } },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    renderWithRouter()
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run tests**

Run: `pnpm --filter @extia-gaming/client run test`
Expected: all 3 ProtectedRoute tests PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/contexts packages/client/src/hooks packages/client/src/components/ProtectedRoute.tsx packages/client/src/main.tsx packages/client/__tests__/ProtectedRoute.test.tsx
git commit -m "feat(client): add AuthContext, useAuth hook, and ProtectedRoute"
```

---

### Task 11: React Router routes + pages + AppLayout

**Files:**
- Create: `packages/client/src/components/AppLayout.tsx`
- Create: `packages/client/src/pages/HomePage.tsx`
- Create: `packages/client/src/pages/LoginPage.tsx`
- Create: `packages/client/src/pages/NotFoundPage.tsx`
- Modify: `packages/client/src/App.tsx`

- [ ] **Step 1: Create `packages/client/src/components/AppLayout.tsx`**

```tsx
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'

export default function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <>
      <header>
        <nav aria-label="Navigation principale">
          <NavLink to="/" aria-current="page">Accueil</NavLink>
          {user ? (
            <button type="button" onClick={logout}>Se déconnecter</button>
          ) : (
            <NavLink to="/login">Se connecter</NavLink>
          )}
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer>
        <p>Extia Gaming 24h</p>
      </footer>
    </>
  )
}
```

- [ ] **Step 2: Create `packages/client/src/pages/HomePage.tsx`**

```tsx
export default function HomePage() {
  return (
    <section aria-labelledby="home-title">
      <h1 id="home-title">Extia Gaming 24h</h1>
      <p>L'événement gaming interne d'Extia — 24 heures de jeux et de compétition.</p>
    </section>
  )
}
```

- [ ] **Step 3: Create `packages/client/src/pages/LoginPage.tsx`**

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = new FormData(e.currentTarget)
    const email = data.get('email') as string
    const password = data.get('password') as string

    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Email ou mot de passe incorrect.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section aria-labelledby="login-title">
      <h1 id="login-title">Connexion</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="email">Adresse email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-describedby={error ? 'login-error' : undefined}
          />
        </div>
        <div>
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-describedby={error ? 'login-error' : undefined}
          />
        </div>
        {error && (
          <p id="login-error" role="alert" aria-live="assertive">
            {error}
          </p>
        )}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </section>
  )
}
```

- [ ] **Step 4: Create `packages/client/src/pages/NotFoundPage.tsx`**

```tsx
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section aria-labelledby="notfound-title">
      <h1 id="notfound-title">Page introuvable</h1>
      <p>Cette page n'existe pas.</p>
      <Link to="/">Retour à l'accueil</Link>
    </section>
  )
}
```

- [ ] **Step 5: Update `packages/client/src/App.tsx` with full routing**

```tsx
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes — add feature routes here later */}
        <Route element={<ProtectedRoute />}>
          {/* Feature pages go here in subsequent specs */}
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 6: Run tests**

Run: `pnpm --filter @extia-gaming/client run test`
Expected: all existing tests still PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/components/AppLayout.tsx packages/client/src/pages packages/client/src/App.tsx
git commit -m "feat(client): add React Router routes, AppLayout, and page stubs"
```

---

### Task 12: SEOHead component

**Files:**
- Create: `packages/client/src/components/SEOHead.tsx`
- Modify: `packages/client/src/pages/HomePage.tsx`
- Create: `packages/client/__tests__/SEOHead.test.tsx`

- [ ] **Step 1: Create `packages/client/src/components/SEOHead.tsx`**

```tsx
import { Helmet } from 'react-helmet-async'

interface SEOHeadProps {
  title: string
  description: string
  canonicalPath?: string
  ogImage?: string
  jsonLd?: object
}

const SITE_NAME = 'Extia Gaming 24h'
const BASE_URL = 'https://gaming24h.extia.fr' // update at deploy time

export default function SEOHead({
  title,
  description,
  canonicalPath = '/',
  ogImage = '/og-default.png',
  jsonLd,
}: SEOHeadProps) {
  const fullTitle = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`
  const canonicalUrl = `${BASE_URL}${canonicalPath}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="theme-color" content="#1a1a2e" />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${BASE_URL}${ogImage}`} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />

      {/* JSON-LD structured data */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  )
}
```

- [ ] **Step 2: Add SEOHead to `packages/client/src/pages/HomePage.tsx`**

```tsx
import SEOHead from '../components/SEOHead.tsx'

const EVENT_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Extia Gaming 24h',
  description: "L'événement gaming interne d'Extia — 24 heures de jeux et de compétition.",
  organizer: { '@type': 'Organization', name: 'Extia' },
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  eventStatus: 'https://schema.org/EventScheduled',
}

export default function HomePage() {
  return (
    <>
      <SEOHead
        title="Extia Gaming 24h"
        description="L'événement gaming interne d'Extia — 24 heures de jeux et de compétition."
        canonicalPath="/"
        jsonLd={EVENT_JSON_LD}
      />
      <section aria-labelledby="home-title">
        <h1 id="home-title">Extia Gaming 24h</h1>
        <p>L'événement gaming interne d'Extia — 24 heures de jeux et de compétition.</p>
      </section>
    </>
  )
}
```

- [ ] **Step 3: Write failing SEOHead test**

Create `packages/client/__tests__/SEOHead.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { describe, it, expect } from 'vitest'
import SEOHead from '../src/components/SEOHead.tsx'

function renderSEO(props: Parameters<typeof SEOHead>[0]) {
  const helmetContext: Record<string, unknown> = {}
  render(
    <HelmetProvider context={helmetContext}>
      <SEOHead {...props} />
    </HelmetProvider>,
  )
  return helmetContext.helmet as Record<string, { toString(): string }>
}

describe('SEOHead', () => {
  it('sets page title with site name suffix', () => {
    const helmet = renderSEO({ title: 'Accueil', description: 'desc' })
    expect(helmet.title.toString()).toContain('Accueil | Extia Gaming 24h')
  })

  it('does not double site name when title equals site name', () => {
    const helmet = renderSEO({ title: 'Extia Gaming 24h', description: 'desc' })
    const titleStr = helmet.title.toString()
    expect(titleStr).not.toContain('Extia Gaming 24h | Extia Gaming 24h')
  })

  it('includes og:title meta', () => {
    const helmet = renderSEO({ title: 'Test Page', description: 'A test page' })
    expect(helmet.meta.toString()).toContain('Test Page | Extia Gaming 24h')
  })

  it('renders JSON-LD script when jsonLd provided', () => {
    const helmet = renderSEO({
      title: 'Page',
      description: 'desc',
      jsonLd: { '@type': 'Event', name: 'Test' },
    })
    expect(helmet.script.toString()).toContain('"@type":"Event"')
  })
})
```

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @extia-gaming/client run test`
Expected: all SEOHead tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/client/src/components/SEOHead.tsx packages/client/src/pages/HomePage.tsx packages/client/__tests__/SEOHead.test.tsx
git commit -m "feat(client): add SEOHead component with React Helmet Async and JSON-LD"
```

---

### Task 13: Static SEO files

**Files:**
- Create: `packages/client/public/robots.txt`
- Create: `packages/client/public/sitemap.xml`

- [ ] **Step 1: Create `packages/client/public/robots.txt`**

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /profile
Sitemap: https://gaming24h.extia.fr/sitemap.xml
```

- [ ] **Step 2: Create `packages/client/public/sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://gaming24h.extia.fr/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://gaming24h.extia.fr/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

> Add more pages here as public feature pages are built (programme, classement, etc.)

- [ ] **Step 3: Commit**

```bash
git add packages/client/public/robots.txt packages/client/public/sitemap.xml
git commit -m "feat(client): add robots.txt and sitemap.xml"
```

---

### Task 14: Accessibility tooling + focusTrap utility

**Files:**
- Create: `packages/client/eslint.config.js`
- Create: `packages/client/src/utils/focusTrap.ts`
- Create: `packages/client/__tests__/focusTrap.test.ts`

- [ ] **Step 1: Create `packages/client/eslint.config.js`**

```javascript
import js from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'jsx-a11y': jsxA11y,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
)
```

Add to `packages/client/package.json` scripts: `"lint": "eslint . --max-warnings 0"`
Add devDependencies: `"@eslint/js": "^9.7.0"`, `"typescript-eslint": "^7.16.0"`, `"eslint-plugin-react-refresh": "^0.4.8"`

Run: `pnpm --filter @extia-gaming/client install`

- [ ] **Step 2: Verify lint passes on existing code**

Run: `pnpm --filter @extia-gaming/client run lint`
Expected: no errors (fix any reported violations before continuing).

- [ ] **Step 3: Create `packages/client/src/utils/focusTrap.ts`**

```typescript
/**
 * Creates a focus trap within a container element.
 * Use inside modals and drawers to prevent keyboard focus from escaping.
 *
 * @returns cleanup function — call it when the trap should be released
 */
export function createFocusTrap(container: HTMLElement): () => void {
  const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  function getFocusable(): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.closest('[hidden]'),
    )
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return

    const focusable = getFocusable()
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement as HTMLElement

    if (e.shiftKey) {
      if (active === first || !container.contains(active)) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (active === last || !container.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown)

  // Auto-focus first focusable element
  const first = getFocusable()[0]
  first?.focus()

  return () => container.removeEventListener('keydown', handleKeyDown)
}
```

- [ ] **Step 4: Write failing focusTrap test**

Create `packages/client/__tests__/focusTrap.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createFocusTrap } from '../src/utils/focusTrap.ts'

describe('createFocusTrap', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    document.body.innerHTML = ''
    container = document.createElement('div')
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <button id="btn2">Button 2</button>
      <button id="btn3">Button 3</button>
    `
    document.body.appendChild(container)
  })

  it('focuses the first focusable element on init', () => {
    createFocusTrap(container)
    expect(document.activeElement?.id).toBe('btn1')
  })

  it('returns a cleanup function', () => {
    const cleanup = createFocusTrap(container)
    expect(typeof cleanup).toBe('function')
    cleanup() // should not throw
  })

  it('traps Tab from last element back to first', () => {
    createFocusTrap(container)
    const last = document.getElementById('btn3')!
    last.focus()

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
    let prevented = false
    event.preventDefault = () => { prevented = true }
    container.dispatchEvent(event)

    expect(prevented).toBe(true)
    expect(document.activeElement?.id).toBe('btn1')
  })

  it('traps Shift+Tab from first element back to last', () => {
    createFocusTrap(container)
    const first = document.getElementById('btn1')!
    first.focus()

    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })
    let prevented = false
    event.preventDefault = () => { prevented = true }
    container.dispatchEvent(event)

    expect(prevented).toBe(true)
    expect(document.activeElement?.id).toBe('btn3')
  })
})
```

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @extia-gaming/client run test`
Expected: all 4 focusTrap tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/client/eslint.config.js packages/client/src/utils/focusTrap.ts packages/client/__tests__/focusTrap.test.ts packages/client/package.json
git commit -m "feat(client): add eslint-plugin-jsx-a11y and focusTrap accessibility utility"
```

---

## Self-Review

### Spec coverage check

| Spec section | Covered by task |
|---|---|
| Monorepo pnpm workspaces | Task 1 |
| Shared Zod schemas | Task 2 |
| Prisma schema + migrations + seed | Task 3 |
| Fastify foundation + env validation | Task 4 |
| helmet, cors, rate-limit, csrf | Task 5 |
| JWT httpOnly cookie + authenticate hook | Task 6 |
| Auth routes (register/login/refresh/logout) | Task 7 |
| `/auth/me` route for session restore | Task 10 (noted inline) |
| Vite + React 18 + React Router 6 | Task 8, 11 |
| TanStack Query + Axios + CSRF interceptor | Task 9 |
| AuthContext + useAuth + ProtectedRoute | Task 10 |
| AppLayout semantic HTML (header/nav/main/footer) | Task 11 |
| SEOHead with Helmet, OG, canonical, JSON-LD | Task 12 |
| robots.txt + sitemap.xml | Task 13 |
| eslint-plugin-jsx-a11y | Task 14 |
| focusTrap for modals/drawers | Task 14 |
| `.env.example` | Task 1 |
| bcrypt salt=12 | Task 7 (auth.service.ts) |
| Refresh token rotation + RevocationTable | Task 7 |
| `aria-live`, `role="alert"` on forms | Task 11 (LoginPage) |
| `autocomplete` on auth inputs | Task 11 (LoginPage) |
| `aria-describedby` for form errors | Task 11 (LoginPage) |

No gaps found.

### Placeholder scan

No TBD / TODO / "implement later" patterns found. All code steps contain complete implementations.

### Type consistency

- `JWTPayload` — defined in `packages/shared/src/types/index.ts` (Task 2), used in `authenticate.ts` (Task 6) and `auth.controller.ts` (Task 7). Property `sub` (number) consistent throughout.
- `UserPublic` — defined in `packages/shared/src/schemas/user.schema.ts` (Task 2), used in `AuthContext.tsx` (Task 10). Includes `role: { id, name }` consistent with `auth.service.ts` which returns `include: { role: true }`.
- `RegisterInput` / `LoginInput` — defined in Task 2, consumed in Task 7 controller generics. Consistent.
- `buildTestApp()` — defined in Task 4, used in Tasks 5, 6, 7. Returns `FastifyInstance`. Consistent.
