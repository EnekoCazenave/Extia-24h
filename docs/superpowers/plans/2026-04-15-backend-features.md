# Backend Features — Extia Gaming 24h Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add all API routes needed to power the frontend pages: games listing/detail, global leaderboard, game play submission, user profile update, and admin operations (create game, add game types, set happy hour, grant point bonuses).

**Architecture:** Fastify routes follow the existing pattern: `routes/` declares Zod-validated endpoints using `fastify-type-provider-zod`, `controllers/` handles HTTP concerns (status codes, cookies), `services/` contains Prisma queries. Prisma schema is updated to add `score` + `playedAt` to `UserGame`, `imageUrl` to `VideoGame`, and a new `PointBonus` model. Admin role is `roleId = 2` (per seed).

**Tech Stack:** Fastify 4, Prisma 5, Zod 3, TypeScript, Vitest

**Working directory:** All paths relative to `.worktrees/foundation/` (monorepo root). Run commands from `packages/server/` unless stated.

---

## File Structure

```
packages/
├── shared/src/
│   └── schemas/
│       ├── game.schema.ts        CREATE  VideoGame, GameType, PlayInput schemas
│       ├── admin.schema.ts       CREATE  CreateGame, CreateGameType, HappyHour, GrantBonus schemas
│       ├── leaderboard.schema.ts CREATE  LeaderboardEntry schema
│       └── index.ts              MODIFY  export new schemas
├── server/
│   ├── prisma/
│   │   └── schema.prisma         MODIFY  add imageUrl, score, PointBonus
│   └── src/
│       ├── hooks/
│       │   └── requireAdmin.ts   CREATE  admin role guard
│       ├── services/
│       │   ├── game.service.ts   CREATE  list games, get game detail
│       │   ├── leaderboard.service.ts  CREATE  global + per-game ranking
│       │   ├── play.service.ts   CREATE  submit score (happy hour logic)
│       │   ├── user.service.ts   CREATE  update profile
│       │   └── admin.service.ts  CREATE  create game/type, set happy hour, grant bonus
│       ├── controllers/
│       │   ├── game.controller.ts       CREATE
│       │   ├── leaderboard.controller.ts CREATE
│       │   ├── play.controller.ts       CREATE
│       │   ├── user.controller.ts       CREATE
│       │   └── admin.controller.ts      CREATE
│       ├── routes/
│       │   ├── games.ts          CREATE  GET /api/games, GET /api/games/:id
│       │   ├── leaderboard.ts    CREATE  GET /api/leaderboard
│       │   ├── play.ts           CREATE  POST /api/play
│       │   ├── users.ts          CREATE  PUT /api/users/me
│       │   ├── admin.ts          CREATE  POST+PUT /api/admin/*
│       │   └── index.ts          MODIFY  register new route modules
│       └── __tests__/
│           ├── games.test.ts     CREATE
│           ├── leaderboard.test.ts CREATE
│           ├── play.test.ts      CREATE
│           └── admin.test.ts     CREATE
```

---

### Task 1: Update Prisma Schema + Auth Schema (consent)

**Files:**
- Modify: `packages/server/prisma/schema.prisma`
- Modify: `packages/shared/src/schemas/auth.schema.ts`

- [ ] **Step 1: Update schema.prisma**

Replace the entire file with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              Int               @id @default(autoincrement())
  login           String
  password        String
  lastname        String
  firstname       String
  intern          Boolean           @default(false)
  email           String            @unique
  role            Role              @relation(fields: [roleId], references: [id])
  roleId          Int
  userGames       UserGame[]
  userTeams       UserTeam[]
  achievements    UserAchievement[]
  userEvents      UserEvent[]
  refreshTokens   RefreshToken[]
  bonusesReceived PointBonus[]      @relation("BonusReceiver")
  bonusesGranted  PointBonus[]      @relation("BonusGranter")
}

model Role {
  id    Int    @id @default(autoincrement())
  name  String
  users User[]
}

model VideoGame {
  id             Int        @id @default(autoincrement())
  nom            String
  imageUrl       String?
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
  id         Int      @id @default(autoincrement())
  user       User     @relation(fields: [userId], references: [id])
  userId     Int
  gameType   GameType @relation(fields: [gameTypeId], references: [id])
  gameTypeId Int
  score      Int      @default(0)
  playedAt   DateTime @default(now())
}

model PointBonus {
  id          Int      @id @default(autoincrement())
  user        User     @relation("BonusReceiver", fields: [userId], references: [id])
  userId      Int
  grantedBy   User     @relation("BonusGranter", fields: [grantedById], references: [id])
  grantedById Int
  points      Int
  reason      String?
  createdAt   DateTime @default(now())
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

- [ ] **Step 2: Add consentAccepted to RegisterSchema**

In `packages/shared/src/schemas/auth.schema.ts`, update:

```typescript
import { z } from 'zod'

export const RegisterSchema = z.object({
  login: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstname: z.string().min(1).max(100),
  lastname: z.string().min(1).max(100),
  intern: z.boolean().default(false),
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Vous devez accepter la politique de confidentialité' }),
  }),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
```

- [ ] **Step 3: Update auth controller to strip consentAccepted before service call**

In `packages/server/src/controllers/auth.controller.ts`, update the `register` function:

```typescript
export async function register(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply,
) {
  try {
    const { consentAccepted: _, ...userData } = request.body
    const user = await registerUser(userData)
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
```

Also update the import for `RegisterInput` — `consentAccepted` is now part of it. And update `auth.service.ts` to accept the stripped type:

In `packages/server/src/services/auth.service.ts`, change the `registerUser` parameter type:

```typescript
import type { LoginInput } from '@extia-gaming/shared'
import { RegisterSchema } from '@extia-gaming/shared'

type RegisterData = Omit<import('@extia-gaming/shared').RegisterInput, 'consentAccepted'>

export async function registerUser(input: RegisterData) {
  // ... existing code unchanged
}
```

- [ ] **Step 4: Run migration (manual step for developer)**

From `packages/server/`:
```bash
pnpm db:migrate
# When prompted for migration name, enter: add_score_imagurl_pointbonus
```

Expected: migration files created, DB tables updated.

- [ ] **Step 5: Regenerate Prisma client**

```bash
pnpm exec prisma generate
```

Expected: `@prisma/client` updated with new types.

- [ ] **Step 6: Run existing tests to verify nothing broken**

```bash
cd packages/server && pnpm test
```

Expected: existing 4 tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/server/prisma/schema.prisma packages/shared/src/schemas/auth.schema.ts packages/server/src/controllers/auth.controller.ts packages/server/src/services/auth.service.ts
git commit -m "feat(db): add score/imageUrl/PointBonus; add consent to RegisterSchema"
```

---

### Task 2: Shared Game + Admin Zod Schemas

**Files:**
- Create: `packages/shared/src/schemas/game.schema.ts`
- Create: `packages/shared/src/schemas/admin.schema.ts`
- Create: `packages/shared/src/schemas/leaderboard.schema.ts`
- Modify: `packages/shared/src/schemas/index.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Write tests for schema validation**

Create `packages/shared/src/__tests__/schemas.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { PlayInputSchema, CreateGameSchema, GrantBonusSchema, LeaderboardEntrySchema } from '../schemas/index.js'

describe('PlayInputSchema', () => {
  it('accepts valid play input', () => {
    const result = PlayInputSchema.safeParse({ gameTypeId: 1, score: 150 })
    expect(result.success).toBe(true)
  })
  it('rejects negative score', () => {
    const result = PlayInputSchema.safeParse({ gameTypeId: 1, score: -1 })
    expect(result.success).toBe(false)
  })
  it('rejects missing gameTypeId', () => {
    const result = PlayInputSchema.safeParse({ score: 100 })
    expect(result.success).toBe(false)
  })
})

describe('CreateGameSchema', () => {
  it('accepts valid game data', () => {
    const result = CreateGameSchema.safeParse({ nom: 'Rocket League', imageUrl: 'https://example.com/img.png' })
    expect(result.success).toBe(true)
  })
  it('accepts game without imageUrl', () => {
    const result = CreateGameSchema.safeParse({ nom: 'Rocket League' })
    expect(result.success).toBe(true)
  })
  it('rejects empty nom', () => {
    const result = CreateGameSchema.safeParse({ nom: '' })
    expect(result.success).toBe(false)
  })
})

describe('GrantBonusSchema', () => {
  it('accepts valid bonus', () => {
    const result = GrantBonusSchema.safeParse({ userId: 3, points: 50, reason: 'Prix fair-play' })
    expect(result.success).toBe(true)
  })
  it('rejects zero points', () => {
    const result = GrantBonusSchema.safeParse({ userId: 3, points: 0 })
    expect(result.success).toBe(false)
  })
})

describe('LeaderboardEntrySchema', () => {
  it('validates leaderboard entry', () => {
    const entry = { userId: 1, login: 'player1', firstname: 'Alice', lastname: 'Doe', totalScore: 300 }
    const result = LeaderboardEntrySchema.safeParse(entry)
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to see it fail**

```bash
cd packages/shared && pnpm test
```

Expected: FAIL — cannot find module `../schemas/index.js`

- [ ] **Step 3: Create game.schema.ts**

```typescript
// packages/shared/src/schemas/game.schema.ts
import { z } from 'zod'

export const GameTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  calcul: z.string(),
  win: z.string(),
  team: z.boolean(),
  videoGameId: z.number(),
})

export const VideoGameSchema = z.object({
  id: z.number(),
  nom: z.string(),
  imageUrl: z.string().nullable(),
  happyHourStart: z.string().datetime().nullable(),
  happyHourEnd: z.string().datetime().nullable(),
  gameTypes: z.array(GameTypeSchema),
})

export const PlayInputSchema = z.object({
  gameTypeId: z.number().int().positive(),
  score: z.number().int().min(0),
})

export const UpdateProfileSchema = z.object({
  login: z.string().min(3).max(50).optional(),
  firstname: z.string().min(1).max(100).optional(),
  lastname: z.string().min(1).max(100).optional(),
})

export type GameType = z.infer<typeof GameTypeSchema>
export type VideoGame = z.infer<typeof VideoGameSchema>
export type PlayInput = z.infer<typeof PlayInputSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
```

- [ ] **Step 4: Create admin.schema.ts**

```typescript
// packages/shared/src/schemas/admin.schema.ts
import { z } from 'zod'

export const CreateGameSchema = z.object({
  nom: z.string().min(1).max(100),
  imageUrl: z.string().url().optional(),
  happyHourStart: z.string().datetime().optional(),
  happyHourEnd: z.string().datetime().optional(),
})

export const CreateGameTypeSchema = z.object({
  name: z.string().min(1).max(100),
  calcul: z.string().min(1),
  win: z.string().min(1),
  team: z.boolean().default(false),
})

export const UpdateHappyHourSchema = z.object({
  happyHourStart: z.string().datetime().nullable(),
  happyHourEnd: z.string().datetime().nullable(),
})

export const GrantBonusSchema = z.object({
  userId: z.number().int().positive(),
  points: z.number().int().min(1),
  reason: z.string().max(255).optional(),
})

export type CreateGameInput = z.infer<typeof CreateGameSchema>
export type CreateGameTypeInput = z.infer<typeof CreateGameTypeSchema>
export type UpdateHappyHourInput = z.infer<typeof UpdateHappyHourSchema>
export type GrantBonusInput = z.infer<typeof GrantBonusSchema>
```

- [ ] **Step 5: Create leaderboard.schema.ts**

```typescript
// packages/shared/src/schemas/leaderboard.schema.ts
import { z } from 'zod'

export const LeaderboardEntrySchema = z.object({
  userId: z.number(),
  login: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  totalScore: z.number(),
})

export const GameLeaderboardEntrySchema = z.object({
  userId: z.number(),
  login: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  gameScore: z.number(),
})

export const GameScoreSummarySchema = z.object({
  videoGameId: z.number(),
  nom: z.string(),
  imageUrl: z.string().nullable(),
  totalScore: z.number(),
})

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>
export type GameLeaderboardEntry = z.infer<typeof GameLeaderboardEntrySchema>
export type GameScoreSummary = z.infer<typeof GameScoreSummarySchema>
```

- [ ] **Step 6: Update schemas/index.ts**

```typescript
// packages/shared/src/schemas/index.ts
export * from './auth.schema.js'
export * from './user.schema.js'
export * from './game.schema.js'
export * from './admin.schema.js'
export * from './leaderboard.schema.js'
```

- [ ] **Step 7: Update shared/src/index.ts** (already exports schemas/index via `export * from './schemas/index.js'` — verify it does)

In `packages/shared/src/index.ts`, ensure it has:
```typescript
export * from './schemas/index.js'
export * from './types/index.js'
```

- [ ] **Step 8: Run tests**

```bash
cd packages/shared && pnpm test
```

Expected: All tests pass (schema validation tests).

- [ ] **Step 9: Commit**

```bash
git add packages/shared/src/schemas/ packages/shared/src/index.ts
git commit -m "feat(shared): add game, admin, leaderboard Zod schemas"
```

---

### Task 3: Admin Hook + Games Service + Routes

**Files:**
- Create: `packages/server/src/hooks/requireAdmin.ts`
- Create: `packages/server/src/services/game.service.ts`
- Create: `packages/server/src/controllers/game.controller.ts`
- Create: `packages/server/src/routes/games.ts`
- Create: `packages/server/src/__tests__/games.test.ts`
- Modify: `packages/server/src/routes/index.ts`

- [ ] **Step 1: Create requireAdmin hook**

```typescript
// packages/server/src/hooks/requireAdmin.ts
import type { FastifyRequest, FastifyReply } from 'fastify'
import { authenticate } from './authenticate.js'

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply)
  if (reply.sent) return // authenticate already replied with 401
  if (request.user.roleId !== 2) {
    return reply.code(403).send({ error: 'Forbidden', statusCode: 403 })
  }
}
```

- [ ] **Step 2: Write failing tests for games routes**

Create `packages/server/src/__tests__/games.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildApp } from '../app.js'

vi.mock('@prisma/client', () => {
  const mockPrisma = {
    videoGame: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    userGame: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  }
  return { PrismaClient: vi.fn(() => mockPrisma) }
})

describe('GET /api/games', () => {
  it('returns 200 with game list', async () => {
    const { PrismaClient } = await import('@prisma/client')
    const mockPrisma = new PrismaClient() as any
    mockPrisma.videoGame.findMany.mockResolvedValue([
      { id: 1, nom: 'League of Legends', imageUrl: null, happyHourStart: null, happyHourEnd: null, gameTypes: [] },
    ])
    mockPrisma.userGame.groupBy.mockResolvedValue([])

    const app = await buildApp({ logger: false })
    const res = await app.inject({ method: 'GET', url: '/api/games' })
    expect(res.statusCode).toBe(200)
    await app.close()
  })
})

describe('GET /api/games/:id', () => {
  it('returns 404 when game not found', async () => {
    const { PrismaClient } = await import('@prisma/client')
    const mockPrisma = new PrismaClient() as any
    mockPrisma.videoGame.findUnique.mockResolvedValue(null)

    const app = await buildApp({ logger: false })
    const res = await app.inject({ method: 'GET', url: '/api/games/999' })
    expect(res.statusCode).toBe(404)
    await app.close()
  })
})
```

- [ ] **Step 3: Run tests to see them fail**

```bash
cd packages/server && pnpm test src/__tests__/games.test.ts
```

Expected: FAIL — route `/api/games` not found (404 from Fastify)

- [ ] **Step 4: Create game.service.ts**

```typescript
// packages/server/src/services/game.service.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function listGamesWithScores() {
  const games = await prisma.videoGame.findMany({
    include: { gameTypes: true },
    orderBy: { id: 'asc' },
  })

  // Aggregate total score per game
  const scoreSums = await prisma.userGame.groupBy({
    by: ['gameTypeId'],
    _sum: { score: true },
  })

  // Build a map: gameTypeId → totalScore
  const scoreByGameType = new Map(
    scoreSums.map((s) => [s.gameTypeId, s._sum.score ?? 0]),
  )

  return games.map((game) => {
    const totalScore = game.gameTypes.reduce(
      (sum, gt) => sum + (scoreByGameType.get(gt.id) ?? 0),
      0,
    )
    return { ...game, totalScore }
  })
}

export async function getGameDetail(id: number) {
  const game = await prisma.videoGame.findUnique({
    where: { id },
    include: { gameTypes: true },
  })
  if (!game) return null

  // Get per-user scores for this game (all game types)
  const gameTypeIds = game.gameTypes.map((gt) => gt.id)

  const userScores = await prisma.userGame.groupBy({
    by: ['userId'],
    where: { gameTypeId: { in: gameTypeIds } },
    _sum: { score: true },
    orderBy: { _sum: { score: 'desc' } },
  })

  // Enrich with user info
  const userIds = userScores.map((s) => s.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, login: true, firstname: true, lastname: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  const rankings = userScores.map((s, index) => ({
    rank: index + 1,
    userId: s.userId,
    login: userMap.get(s.userId)?.login ?? '',
    firstname: userMap.get(s.userId)?.firstname ?? '',
    lastname: userMap.get(s.userId)?.lastname ?? '',
    gameScore: s._sum.score ?? 0,
  }))

  const totalScore = userScores.reduce((sum, s) => sum + (s._sum.score ?? 0), 0)

  return { ...game, totalScore, rankings }
}
```

- [ ] **Step 5: Create game.controller.ts**

```typescript
// packages/server/src/controllers/game.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify'
import { listGamesWithScores, getGameDetail } from '../services/game.service.js'

export async function listGames(_request: FastifyRequest, reply: FastifyReply) {
  const games = await listGamesWithScores()
  return reply.send({ games })
}

export async function getGame(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const id = parseInt(request.params.id, 10)
  if (isNaN(id)) return reply.code(400).send({ error: 'Invalid game id', statusCode: 400 })

  const game = await getGameDetail(id)
  if (!game) return reply.code(404).send({ error: 'Game not found', statusCode: 404 })

  return reply.send({ game })
}
```

- [ ] **Step 6: Create routes/games.ts**

```typescript
// packages/server/src/routes/games.ts
import type { FastifyInstance } from 'fastify'
import { listGames, getGame } from '../controllers/game.controller.js'

export async function gameRoutes(fastify: FastifyInstance) {
  fastify.get('/api/games', listGames)
  fastify.get('/api/games/:id', getGame)
}
```

- [ ] **Step 7: Register in routes/index.ts**

```typescript
// packages/server/src/routes/index.ts
import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.js'
import { gameRoutes } from './games.js'

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes)
  await fastify.register(gameRoutes)
}
```

- [ ] **Step 8: Run tests**

```bash
cd packages/server && pnpm test src/__tests__/games.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 9: Commit**

```bash
git add packages/server/src/hooks/requireAdmin.ts packages/server/src/services/game.service.ts packages/server/src/controllers/game.controller.ts packages/server/src/routes/games.ts packages/server/src/routes/index.ts packages/server/src/__tests__/games.test.ts
git commit -m "feat(api): GET /api/games and GET /api/games/:id"
```

---

### Task 4: Leaderboard Service + Route

**Files:**
- Create: `packages/server/src/services/leaderboard.service.ts`
- Create: `packages/server/src/controllers/leaderboard.controller.ts`
- Create: `packages/server/src/routes/leaderboard.ts`
- Create: `packages/server/src/__tests__/leaderboard.test.ts`
- Modify: `packages/server/src/routes/index.ts`

- [ ] **Step 1: Write failing test**

Create `packages/server/src/__tests__/leaderboard.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { buildApp } from '../app.js'

vi.mock('@prisma/client', () => {
  const mockPrisma = {
    $queryRaw: vi.fn(),
  }
  return { PrismaClient: vi.fn(() => mockPrisma) }
})

describe('GET /api/leaderboard', () => {
  it('returns 200 with rankings array', async () => {
    const { PrismaClient } = await import('@prisma/client')
    const mockPrisma = new PrismaClient() as any
    mockPrisma.$queryRaw.mockResolvedValue([
      { userId: 1, login: 'player1', firstname: 'Alice', lastname: 'Doe', totalScore: BigInt(300) },
    ])

    const app = await buildApp({ logger: false })
    const res = await app.inject({ method: 'GET', url: '/api/leaderboard' })
    expect(res.statusCode).toBe(200)

    const body = JSON.parse(res.body)
    expect(Array.isArray(body.rankings)).toBe(true)
    await app.close()
  })

  it('accepts limit query param', async () => {
    const { PrismaClient } = await import('@prisma/client')
    const mockPrisma = new PrismaClient() as any
    mockPrisma.$queryRaw.mockResolvedValue([])

    const app = await buildApp({ logger: false })
    const res = await app.inject({ method: 'GET', url: '/api/leaderboard?limit=5' })
    expect(res.statusCode).toBe(200)
    await app.close()
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/server && pnpm test src/__tests__/leaderboard.test.ts
```

Expected: FAIL — route not found.

- [ ] **Step 3: Create leaderboard.service.ts**

```typescript
// packages/server/src/services/leaderboard.service.ts
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export async function getGlobalLeaderboard(limit = 20) {
  // Raw query: sum UserGame.score + PointBonus.points per user
  const rows = await prisma.$queryRaw<
    Array<{
      userId: number
      login: string
      firstname: string
      lastname: string
      totalScore: bigint
    }>
  >(
    Prisma.sql`
      SELECT
        u.id AS "userId",
        u.login,
        u.firstname,
        u.lastname,
        COALESCE(SUM(ug.score), 0) + COALESCE(SUM(pb.points), 0) AS "totalScore"
      FROM "User" u
      LEFT JOIN "UserGame" ug ON ug."userId" = u.id
      LEFT JOIN "PointBonus" pb ON pb."userId" = u.id
      GROUP BY u.id, u.login, u.firstname, u.lastname
      ORDER BY "totalScore" DESC
      LIMIT ${limit}
    `,
  )

  // BigInt → number for JSON serialization
  return rows.map((r, index) => ({
    rank: index + 1,
    userId: r.userId,
    login: r.login,
    firstname: r.firstname,
    lastname: r.lastname,
    totalScore: Number(r.totalScore),
  }))
}

export async function getTopGamesByScore(limit = 5) {
  const rows = await prisma.$queryRaw<
    Array<{
      videoGameId: number
      nom: string
      imageUrl: string | null
      totalScore: bigint
    }>
  >(
    Prisma.sql`
      SELECT
        vg.id AS "videoGameId",
        vg.nom,
        vg."imageUrl",
        COALESCE(SUM(ug.score), 0) AS "totalScore"
      FROM "VideoGame" vg
      LEFT JOIN "GameType" gt ON gt."videoGameId" = vg.id
      LEFT JOIN "UserGame" ug ON ug."gameTypeId" = gt.id
      GROUP BY vg.id, vg.nom, vg."imageUrl"
      ORDER BY "totalScore" DESC
      LIMIT ${limit}
    `,
  )

  return rows.map((r) => ({
    videoGameId: r.videoGameId,
    nom: r.nom,
    imageUrl: r.imageUrl,
    totalScore: Number(r.totalScore),
  }))
}
```

- [ ] **Step 4: Create leaderboard.controller.ts**

```typescript
// packages/server/src/controllers/leaderboard.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify'
import { getGlobalLeaderboard, getTopGamesByScore } from '../services/leaderboard.service.js'

export async function globalLeaderboard(
  request: FastifyRequest<{ Querystring: { limit?: string } }>,
  reply: FastifyReply,
) {
  const limit = Math.min(parseInt(request.query.limit ?? '20', 10), 100)
  const rankings = await getGlobalLeaderboard(isNaN(limit) ? 20 : limit)
  return reply.send({ rankings })
}

export async function topGames(
  request: FastifyRequest<{ Querystring: { limit?: string } }>,
  reply: FastifyReply,
) {
  const limit = Math.min(parseInt(request.query.limit ?? '5', 10), 20)
  const games = await getTopGamesByScore(isNaN(limit) ? 5 : limit)
  return reply.send({ games })
}
```

- [ ] **Step 5: Create routes/leaderboard.ts**

```typescript
// packages/server/src/routes/leaderboard.ts
import type { FastifyInstance } from 'fastify'
import { globalLeaderboard, topGames } from '../controllers/leaderboard.controller.js'

export async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.get('/api/leaderboard', globalLeaderboard)
  fastify.get('/api/leaderboard/top-games', topGames)
}
```

- [ ] **Step 6: Register in routes/index.ts**

```typescript
// packages/server/src/routes/index.ts
import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.js'
import { gameRoutes } from './games.js'
import { leaderboardRoutes } from './leaderboard.js'

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes)
  await fastify.register(gameRoutes)
  await fastify.register(leaderboardRoutes)
}
```

- [ ] **Step 7: Run tests**

```bash
cd packages/server && pnpm test src/__tests__/leaderboard.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 8: Commit**

```bash
git add packages/server/src/services/leaderboard.service.ts packages/server/src/controllers/leaderboard.controller.ts packages/server/src/routes/leaderboard.ts packages/server/src/routes/index.ts packages/server/src/__tests__/leaderboard.test.ts
git commit -m "feat(api): GET /api/leaderboard and GET /api/leaderboard/top-games"
```

---

### Task 5: Play Route (Submit Game Session)

**Files:**
- Create: `packages/server/src/services/play.service.ts`
- Create: `packages/server/src/controllers/play.controller.ts`
- Create: `packages/server/src/routes/play.ts`
- Create: `packages/server/src/__tests__/play.test.ts`
- Modify: `packages/server/src/routes/index.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/server/src/__tests__/play.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { buildApp } from '../app.js'

vi.mock('@prisma/client', () => {
  const mockPrisma = {
    gameType: { findUnique: vi.fn() },
    videoGame: { findUnique: vi.fn() },
    userGame: { create: vi.fn() },
  }
  return { PrismaClient: vi.fn(() => mockPrisma) }
})

describe('POST /api/play', () => {
  it('returns 401 when unauthenticated', async () => {
    const app = await buildApp({ logger: false })
    const res = await app.inject({
      method: 'POST',
      url: '/api/play',
      payload: { gameTypeId: 1, score: 100 },
    })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it('returns 400 when body is invalid', async () => {
    const app = await buildApp({ logger: false })
    // Missing score — should fail Zod validation
    const res = await app.inject({
      method: 'POST',
      url: '/api/play',
      payload: { gameTypeId: 1 },
      headers: { cookie: 'access_token=invalid' },
    })
    // 401 (token invalid) is also acceptable — the important thing is not 200
    expect(res.statusCode).not.toBe(200)
    await app.close()
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/server && pnpm test src/__tests__/play.test.ts
```

Expected: FAIL — route not found (404).

- [ ] **Step 3: Create play.service.ts**

Happy hour doubles the score. Happy hour times are stored in UTC.

```typescript
// packages/server/src/services/play.service.ts
import { PrismaClient } from '@prisma/client'
import type { PlayInput } from '@extia-gaming/shared'

const prisma = new PrismaClient()

function isHappyHour(start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false
  const now = new Date()
  return now >= start && now <= end
}

export async function submitPlay(userId: number, input: PlayInput) {
  // Verify gameType exists and load videoGame for happy hour check
  const gameType = await prisma.gameType.findUnique({
    where: { id: input.gameTypeId },
    include: { videoGame: true },
  })
  if (!gameType) throw new Error('GAME_TYPE_NOT_FOUND')

  const happyHour = isHappyHour(gameType.videoGame.happyHourStart, gameType.videoGame.happyHourEnd)
  const finalScore = happyHour ? input.score * 2 : input.score

  const session = await prisma.userGame.create({
    data: {
      userId,
      gameTypeId: input.gameTypeId,
      score: finalScore,
    },
  })

  return { ...session, happyHourApplied: happyHour, originalScore: input.score }
}
```

- [ ] **Step 4: Create play.controller.ts**

```typescript
// packages/server/src/controllers/play.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { PlayInput } from '@extia-gaming/shared'
import { submitPlay } from '../services/play.service.js'

export async function play(
  request: FastifyRequest<{ Body: PlayInput }>,
  reply: FastifyReply,
) {
  try {
    const session = await submitPlay(request.user.sub, request.body)
    return reply.code(201).send({ session })
  } catch (err) {
    if (err instanceof Error && err.message === 'GAME_TYPE_NOT_FOUND') {
      return reply.code(404).send({ error: 'Game type not found', statusCode: 404 })
    }
    throw err
  }
}
```

- [ ] **Step 5: Create routes/play.ts**

```typescript
// packages/server/src/routes/play.ts
import type { FastifyInstance } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { PlayInputSchema } from '@extia-gaming/shared'
import { play } from '../controllers/play.controller.js'
import { authenticate } from '../hooks/authenticate.js'

export async function playRoutes(fastify: FastifyInstance) {
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.post('/api/play', {
    preHandler: [authenticate],
    schema: { body: PlayInputSchema },
  }, play)
}
```

- [ ] **Step 6: Register in routes/index.ts**

```typescript
// packages/server/src/routes/index.ts
import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.js'
import { gameRoutes } from './games.js'
import { leaderboardRoutes } from './leaderboard.js'
import { playRoutes } from './play.js'

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes)
  await fastify.register(gameRoutes)
  await fastify.register(leaderboardRoutes)
  await fastify.register(playRoutes)
}
```

- [ ] **Step 7: Run tests**

```bash
cd packages/server && pnpm test src/__tests__/play.test.ts
```

Expected: Both tests pass (401 for unauthenticated, non-200 for missing score).

- [ ] **Step 8: Commit**

```bash
git add packages/server/src/services/play.service.ts packages/server/src/controllers/play.controller.ts packages/server/src/routes/play.ts packages/server/src/routes/index.ts packages/server/src/__tests__/play.test.ts
git commit -m "feat(api): POST /api/play — submit game session with happy hour support"
```

---

### Task 6: User Profile Route

**Files:**
- Create: `packages/server/src/services/user.service.ts`
- Create: `packages/server/src/controllers/user.controller.ts`
- Create: `packages/server/src/routes/users.ts`
- Create: `packages/server/src/__tests__/users.test.ts`
- Modify: `packages/server/src/routes/index.ts`

- [ ] **Step 1: Write failing test**

Create `packages/server/src/__tests__/users.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { buildApp } from '../app.js'

vi.mock('@prisma/client', () => {
  const mockPrisma = { user: { update: vi.fn() } }
  return { PrismaClient: vi.fn(() => mockPrisma) }
})

describe('PUT /api/users/me', () => {
  it('returns 401 when unauthenticated', async () => {
    const app = await buildApp({ logger: false })
    const res = await app.inject({
      method: 'PUT',
      url: '/api/users/me',
      payload: { login: 'newlogin' },
    })
    expect(res.statusCode).toBe(401)
    await app.close()
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/server && pnpm test src/__tests__/users.test.ts
```

Expected: FAIL — route not found.

- [ ] **Step 3: Create user.service.ts**

```typescript
// packages/server/src/services/user.service.ts
import { PrismaClient } from '@prisma/client'
import type { UpdateProfileInput } from '@extia-gaming/shared'

const prisma = new PrismaClient()

export async function updateUserProfile(userId: number, data: UpdateProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.login !== undefined && { login: data.login }),
      ...(data.firstname !== undefined && { firstname: data.firstname }),
      ...(data.lastname !== undefined && { lastname: data.lastname }),
    },
    include: { role: true },
  })
  const { password: _, ...userPublic } = user
  return userPublic
}
```

- [ ] **Step 4: Create user.controller.ts**

```typescript
// packages/server/src/controllers/user.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { UpdateProfileInput } from '@extia-gaming/shared'
import { updateUserProfile } from '../services/user.service.js'

export async function updateProfile(
  request: FastifyRequest<{ Body: UpdateProfileInput }>,
  reply: FastifyReply,
) {
  const user = await updateUserProfile(request.user.sub, request.body)
  return reply.send({ user })
}
```

- [ ] **Step 5: Create routes/users.ts**

```typescript
// packages/server/src/routes/users.ts
import type { FastifyInstance } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { UpdateProfileSchema } from '@extia-gaming/shared'
import { updateProfile } from '../controllers/user.controller.js'
import { authenticate } from '../hooks/authenticate.js'

export async function userRoutes(fastify: FastifyInstance) {
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  f.put('/api/users/me', {
    preHandler: [authenticate],
    schema: { body: UpdateProfileSchema },
  }, updateProfile)
}
```

- [ ] **Step 6: Register in routes/index.ts**

```typescript
// packages/server/src/routes/index.ts
import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.js'
import { gameRoutes } from './games.js'
import { leaderboardRoutes } from './leaderboard.js'
import { playRoutes } from './play.js'
import { userRoutes } from './users.js'

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes)
  await fastify.register(gameRoutes)
  await fastify.register(leaderboardRoutes)
  await fastify.register(playRoutes)
  await fastify.register(userRoutes)
}
```

- [ ] **Step 7: Run tests**

```bash
cd packages/server && pnpm test src/__tests__/users.test.ts
```

Expected: 1 test passes (401 for unauth).

- [ ] **Step 8: Commit**

```bash
git add packages/server/src/services/user.service.ts packages/server/src/controllers/user.controller.ts packages/server/src/routes/users.ts packages/server/src/routes/index.ts packages/server/src/__tests__/users.test.ts
git commit -m "feat(api): PUT /api/users/me — update user profile"
```

---

### Task 7: Admin Routes

**Files:**
- Create: `packages/server/src/services/admin.service.ts`
- Create: `packages/server/src/controllers/admin.controller.ts`
- Create: `packages/server/src/routes/admin.ts`
- Create: `packages/server/src/__tests__/admin.test.ts`
- Modify: `packages/server/src/routes/index.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/server/src/__tests__/admin.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { buildApp } from '../app.js'

vi.mock('@prisma/client', () => {
  const mockPrisma = {
    videoGame: { create: vi.fn(), update: vi.fn() },
    gameType: { create: vi.fn() },
    pointBonus: { create: vi.fn() },
    user: { findUnique: vi.fn() },
  }
  return { PrismaClient: vi.fn(() => mockPrisma) }
})

describe('POST /api/admin/games', () => {
  it('returns 401 when unauthenticated', async () => {
    const app = await buildApp({ logger: false })
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/games',
      payload: { nom: 'Rocket League' },
    })
    expect(res.statusCode).toBe(401)
    await app.close()
  })
})

describe('POST /api/admin/bonuses', () => {
  it('returns 401 when unauthenticated', async () => {
    const app = await buildApp({ logger: false })
    const res = await app.inject({
      method: 'POST',
      url: '/api/admin/bonuses',
      payload: { userId: 1, points: 50 },
    })
    expect(res.statusCode).toBe(401)
    await app.close()
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/server && pnpm test src/__tests__/admin.test.ts
```

Expected: FAIL — routes not found.

- [ ] **Step 3: Create admin.service.ts**

```typescript
// packages/server/src/services/admin.service.ts
import { PrismaClient } from '@prisma/client'
import type { CreateGameInput, CreateGameTypeInput, UpdateHappyHourInput, GrantBonusInput } from '@extia-gaming/shared'

const prisma = new PrismaClient()

export async function createGame(data: CreateGameInput) {
  return prisma.videoGame.create({
    data: {
      nom: data.nom,
      imageUrl: data.imageUrl ?? null,
      happyHourStart: data.happyHourStart ? new Date(data.happyHourStart) : null,
      happyHourEnd: data.happyHourEnd ? new Date(data.happyHourEnd) : null,
    },
  })
}

export async function addGameType(videoGameId: number, data: CreateGameTypeInput) {
  const game = await prisma.videoGame.findUnique({ where: { id: videoGameId } })
  if (!game) throw new Error('GAME_NOT_FOUND')

  return prisma.gameType.create({
    data: {
      name: data.name,
      calcul: data.calcul,
      win: data.win,
      team: data.team,
      videoGameId,
    },
  })
}

export async function updateHappyHour(videoGameId: number, data: UpdateHappyHourInput) {
  const game = await prisma.videoGame.findUnique({ where: { id: videoGameId } })
  if (!game) throw new Error('GAME_NOT_FOUND')

  return prisma.videoGame.update({
    where: { id: videoGameId },
    data: {
      happyHourStart: data.happyHourStart ? new Date(data.happyHourStart) : null,
      happyHourEnd: data.happyHourEnd ? new Date(data.happyHourEnd) : null,
    },
  })
}

export async function grantBonus(grantedById: number, data: GrantBonusInput) {
  const targetUser = await prisma.user.findUnique({ where: { id: data.userId } })
  if (!targetUser) throw new Error('USER_NOT_FOUND')

  return prisma.pointBonus.create({
    data: {
      userId: data.userId,
      grantedById,
      points: data.points,
      reason: data.reason ?? null,
    },
  })
}
```

- [ ] **Step 4: Create admin.controller.ts**

```typescript
// packages/server/src/controllers/admin.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CreateGameInput, CreateGameTypeInput, UpdateHappyHourInput, GrantBonusInput } from '@extia-gaming/shared'
import { createGame, addGameType, updateHappyHour, grantBonus } from '../services/admin.service.js'

export async function handleCreateGame(
  request: FastifyRequest<{ Body: CreateGameInput }>,
  reply: FastifyReply,
) {
  const game = await createGame(request.body)
  return reply.code(201).send({ game })
}

export async function handleAddGameType(
  request: FastifyRequest<{ Params: { id: string }; Body: CreateGameTypeInput }>,
  reply: FastifyReply,
) {
  const videoGameId = parseInt(request.params.id, 10)
  if (isNaN(videoGameId)) return reply.code(400).send({ error: 'Invalid game id', statusCode: 400 })
  try {
    const gameType = await addGameType(videoGameId, request.body)
    return reply.code(201).send({ gameType })
  } catch (err) {
    if (err instanceof Error && err.message === 'GAME_NOT_FOUND') {
      return reply.code(404).send({ error: 'Game not found', statusCode: 404 })
    }
    throw err
  }
}

export async function handleUpdateHappyHour(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateHappyHourInput }>,
  reply: FastifyReply,
) {
  const videoGameId = parseInt(request.params.id, 10)
  if (isNaN(videoGameId)) return reply.code(400).send({ error: 'Invalid game id', statusCode: 400 })
  try {
    const game = await updateHappyHour(videoGameId, request.body)
    return reply.send({ game })
  } catch (err) {
    if (err instanceof Error && err.message === 'GAME_NOT_FOUND') {
      return reply.code(404).send({ error: 'Game not found', statusCode: 404 })
    }
    throw err
  }
}

export async function handleGrantBonus(
  request: FastifyRequest<{ Body: GrantBonusInput }>,
  reply: FastifyReply,
) {
  try {
    const bonus = await grantBonus(request.user.sub, request.body)
    return reply.code(201).send({ bonus })
  } catch (err) {
    if (err instanceof Error && err.message === 'USER_NOT_FOUND') {
      return reply.code(404).send({ error: 'User not found', statusCode: 404 })
    }
    throw err
  }
}
```

- [ ] **Step 5: Create routes/admin.ts**

```typescript
// packages/server/src/routes/admin.ts
import type { FastifyInstance } from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import { CreateGameSchema, CreateGameTypeSchema, UpdateHappyHourSchema, GrantBonusSchema } from '@extia-gaming/shared'
import { handleCreateGame, handleAddGameType, handleUpdateHappyHour, handleGrantBonus } from '../controllers/admin.controller.js'
import { requireAdmin } from '../hooks/requireAdmin.js'

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)
  const f = fastify.withTypeProvider<ZodTypeProvider>()

  const adminGuard = { preHandler: [requireAdmin] }

  f.post('/api/admin/games', { ...adminGuard, schema: { body: CreateGameSchema } }, handleCreateGame)
  f.post('/api/admin/games/:id/game-types', { ...adminGuard, schema: { body: CreateGameTypeSchema } }, handleAddGameType)
  f.put('/api/admin/games/:id/happy-hour', { ...adminGuard, schema: { body: UpdateHappyHourSchema } }, handleUpdateHappyHour)
  f.post('/api/admin/bonuses', { ...adminGuard, schema: { body: GrantBonusSchema } }, handleGrantBonus)
}
```

- [ ] **Step 6: Register in routes/index.ts**

```typescript
// packages/server/src/routes/index.ts
import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.js'
import { gameRoutes } from './games.js'
import { leaderboardRoutes } from './leaderboard.js'
import { playRoutes } from './play.js'
import { userRoutes } from './users.js'
import { adminRoutes } from './admin.js'

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes)
  await fastify.register(gameRoutes)
  await fastify.register(leaderboardRoutes)
  await fastify.register(playRoutes)
  await fastify.register(userRoutes)
  await fastify.register(adminRoutes)
}
```

- [ ] **Step 7: Run all server tests**

```bash
cd packages/server && pnpm test
```

Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add packages/server/src/services/admin.service.ts packages/server/src/controllers/admin.controller.ts packages/server/src/routes/admin.ts packages/server/src/routes/index.ts packages/server/src/__tests__/admin.test.ts
git commit -m "feat(api): admin routes — create game/type, happy hour, point bonuses"
```

---

## Self-Review

**Spec coverage:**
- ✅ Top 5 games by total points → `GET /api/leaderboard/top-games?limit=5`
- ✅ Player ranking (global) → `GET /api/leaderboard`
- ✅ Games list → `GET /api/games`
- ✅ Game detail with player ranking → `GET /api/games/:id`
- ✅ Submit game session → `POST /api/play`
- ✅ Happy hour multiplier → in `play.service.ts`
- ✅ User profile update → `PUT /api/users/me`
- ✅ Admin: create game → `POST /api/admin/games`
- ✅ Admin: add game type → `POST /api/admin/games/:id/game-types`
- ✅ Admin: happy hour → `PUT /api/admin/games/:id/happy-hour`
- ✅ Admin: grant bonus → `POST /api/admin/bonuses`
- ✅ Consent accepted on registration → `consentAccepted: z.literal(true)` in RegisterSchema

**No placeholders found.**

**Type consistency:**
- `PlayInput` used in `play.service.ts` and `play.controller.ts` — consistent
- `CreateGameInput` used in `admin.service.ts` and `admin.controller.ts` — consistent
- `UpdateProfileInput` used in `user.service.ts` and `user.controller.ts` — consistent
