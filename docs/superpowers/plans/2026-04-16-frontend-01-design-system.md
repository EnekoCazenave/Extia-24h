# Frontend — Plan 1/5 : Design System, Hooks, Navigation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish CSS design system (tokens, reset, shared component styles), update AuthContext with `register`, create TanStack Query hooks for games/leaderboard/admin, and style the AppLayout navigation.

**Architecture:** CSS custom properties in `global.css` define all design tokens. CSS Modules (`.module.css`) for component-scoped styles. TanStack Query hooks wrap Axios calls. No new runtime dependencies needed.

**Tech Stack:** React 18, TanStack Query v5, Axios, CSS Modules, Vite

**Working directory:** `.worktrees/foundation/` — all paths relative to monorepo root.

**⚠️ COLOR NOTE:** Colors below are derived from the confirmed `theme-color: #1a1a2e`. The full palette is an educated gaming-dark-theme default. **Verify every color value against `Chartes graphiques - GROUPE.pdf` at the project root before final release.**

---

## File Structure

```
packages/client/
├── index.html                              MODIFY  add Inter font
├── src/
│   ├── main.tsx                            MODIFY  import global.css
│   ├── styles/
│   │   ├── global.css                      CREATE  tokens + reset
│   │   └── components.css                  CREATE  shared btn/form/table/card
│   ├── contexts/
│   │   └── AuthContext.tsx                 MODIFY  add register()
│   ├── hooks/
│   │   ├── useGames.ts                     CREATE  TQ hooks for games
│   │   ├── useLeaderboard.ts               CREATE  TQ hooks for leaderboard
│   │   └── useAdmin.ts                     CREATE  TQ mutations for admin
│   ├── components/
│   │   ├── AppLayout.tsx                   MODIFY  styled nav + skip link
│   │   └── AppLayout.module.css            CREATE
│   └── test-utils.tsx                      CREATE  renderWithProviders helper
```

---

### Task 1: CSS Design System

**Files:**
- Modify: `packages/client/index.html`
- Create: `packages/client/src/styles/global.css`
- Create: `packages/client/src/styles/components.css`
- Modify: `packages/client/src/main.tsx`

- [ ] **Step 1: Add Inter font to index.html**

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>Extia Gaming 24h</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create global.css**

```css
/* packages/client/src/styles/global.css
 *
 * DESIGN TOKENS — EXTIA GAMING 24h
 * Colors derived from theme-color #1a1a2e + gaming dark theme.
 * VERIFY ALL COLORS against "Chartes graphiques - GROUPE.pdf" before release.
 */

:root {
  /* Backgrounds */
  --bg-base: #0d0d1a;
  --bg-surface: #1a1a2e;
  --bg-elevated: #16213e;
  --bg-card: #0f3460;

  /* Accent colors */
  --color-accent: #e94560;
  --color-accent-hover: #c73652;
  --color-secondary: #4cc9f0;
  --color-secondary-hover: #3ab8df;

  /* Text */
  --text-primary: #eaeaea;
  --text-muted: #94a3b8;
  --text-on-accent: #ffffff;

  /* State */
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;

  /* Borders */
  --border-color: rgba(255, 255, 255, 0.08);
  --border-color-hover: rgba(255, 255, 255, 0.16);

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;
  --text-4xl: 2.75rem;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);
  --shadow-glow: 0 0 24px rgba(233, 69, 96, 0.3);

  /* Transitions */
  --transition: 150ms ease;

  /* Layout */
  --header-height: 64px;
  --max-width: 1200px;
  --page-padding: 24px;
}

/* Reset */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-sans);
  background-color: var(--bg-base);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
}

a {
  color: var(--color-secondary);
  text-decoration: none;
  transition: color var(--transition);
}

a:hover {
  color: var(--color-secondary-hover);
}

button, input, select, textarea {
  font-family: inherit;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

ul, ol {
  list-style: none;
}

/* Focus */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: 2px;
}

/* Skip link */
.skip-link {
  position: absolute;
  top: -100%;
  left: 16px;
  background: var(--color-accent);
  color: var(--text-on-accent);
  padding: 8px 16px;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  z-index: 9999;
  transition: top var(--transition);
}

.skip-link:focus {
  top: 0;
  outline: none;
}

/* Happy hour badge */
.happy-hour-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: linear-gradient(135deg, var(--color-warning), #f97316);
  color: #1a1a1a;
  border-radius: 99px;
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

- [ ] **Step 3: Create components.css**

```css
/* packages/client/src/styles/components.css
 * Shared component utility classes (used across modules via composes or direct import)
 */

/* ── Buttons ─────────────────────────────────────────── */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 22px;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition), box-shadow var(--transition), opacity var(--transition);
  text-decoration: none;
  white-space: nowrap;
  line-height: 1;
}

.btn-primary {
  background: var(--color-accent);
  color: var(--text-on-accent);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
  box-shadow: var(--shadow-glow);
}

.btn-secondary {
  background: transparent;
  color: var(--color-secondary);
  border: 1px solid var(--color-secondary);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(76, 201, 240, 0.08);
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.btn-ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  border-color: var(--border-color-hover);
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-sm {
  padding: 6px 14px;
  font-size: var(--text-xs);
}

.btn-lg {
  padding: 14px 30px;
  font-size: var(--text-base);
}

/* ── Form elements ───────────────────────────────────── */

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-muted);
}

.label-required::after {
  content: ' *';
  color: var(--color-accent);
}

.input,
.select,
.textarea {
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  padding: 10px 14px;
  width: 100%;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.input:focus,
.select:focus,
.textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.15);
}

.input::placeholder {
  color: var(--text-muted);
}

.input-error {
  border-color: var(--color-error) !important;
}

.select {
  appearance: none;
  cursor: pointer;
}

.textarea {
  resize: vertical;
  min-height: 96px;
}

/* ── Feedback messages ───────────────────────────────── */

.error-msg {
  color: var(--color-error);
  font-size: var(--text-sm);
  margin-top: 4px;
}

.success-msg {
  color: var(--color-success);
  font-size: var(--text-sm);
  margin-top: 4px;
}

/* ── Layout ──────────────────────────────────────────── */

.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--page-padding);
}

.page {
  padding: 48px var(--page-padding);
  max-width: var(--max-width);
  margin: 0 auto;
}

/* ── Cards ───────────────────────────────────────────── */

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.card-hover {
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-color-hover);
}

/* ── Tables ──────────────────────────────────────────── */

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 12px 16px;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
}

.table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  font-size: var(--text-sm);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table tbody tr:hover td {
  background: rgba(255, 255, 255, 0.015);
}

/* ── Rank badge ──────────────────────────────────────── */

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 700;
  font-size: var(--text-xs);
  background: var(--bg-elevated);
  color: var(--text-muted);
}

.rank-badge[data-rank="1"] { background: #b8860b; color: #ffe066; }
.rank-badge[data-rank="2"] { background: #555; color: #c0c0c0; }
.rank-badge[data-rank="3"] { background: #5a3010; color: #cd7f32; }

/* ── Section heading ─────────────────────────────────── */

.section-heading {
  font-size: var(--text-2xl);
  font-weight: 700;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-heading::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

/* ── Loading / Empty states ──────────────────────────── */

.loading-state {
  text-align: center;
  padding: 48px 0;
  color: var(--text-muted);
}

.empty-state {
  text-align: center;
  padding: 48px 0;
  color: var(--text-muted);
  font-size: var(--text-sm);
}
```

- [ ] **Step 4: Import global.css in main.tsx**

Update `packages/client/src/main.tsx`:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './contexts/AuthContext.tsx'
import App from './App.tsx'
import './styles/global.css'

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

- [ ] **Step 5: Create test-utils.tsx**

```tsx
// packages/client/src/test-utils.tsx
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import type { ReactNode } from 'react'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

interface ProvidersProps {
  children: ReactNode
  initialEntries?: string[]
}

function Providers({ children, initialEntries = ['/'] }: ProvidersProps) {
  return (
    <HelmetProvider>
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  )
}

function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { initialEntries?: string[] },
) {
  const { initialEntries, ...renderOptions } = options ?? {}
  return render(ui, {
    wrapper: ({ children }) => <Providers initialEntries={initialEntries}>{children}</Providers>,
    ...renderOptions,
  })
}

export { renderWithProviders }
export * from '@testing-library/react'
```

- [ ] **Step 6: Commit**

```bash
git add packages/client/index.html packages/client/src/styles/ packages/client/src/main.tsx packages/client/src/test-utils.tsx
git commit -m "feat(client): CSS design system — tokens, reset, shared component styles"
```

---

### Task 2: AuthContext update + TanStack Query hooks

**Files:**
- Modify: `packages/client/src/contexts/AuthContext.tsx`
- Create: `packages/client/src/hooks/useGames.ts`
- Create: `packages/client/src/hooks/useLeaderboard.ts`
- Create: `packages/client/src/hooks/useAdmin.ts`
- Create: `packages/client/src/__tests__/hooks.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/client/src/__tests__/hooks.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useGames } from '../hooks/useGames.ts'
import { useGlobalLeaderboard } from '../hooks/useLeaderboard.ts'

vi.mock('../services/api.ts', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useGames', () => {
  it('fetches games list', async () => {
    const { api } = await import('../services/api.ts')
    vi.mocked(api.get).mockResolvedValue({
      data: { games: [{ id: 1, nom: 'League of Legends', imageUrl: null, gameTypes: [], totalScore: 0 }] },
    })
    const { result } = renderHook(() => useGames(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].nom).toBe('League of Legends')
  })
})

describe('useGlobalLeaderboard', () => {
  it('fetches leaderboard rankings', async () => {
    const { api } = await import('../services/api.ts')
    vi.mocked(api.get).mockResolvedValue({
      data: {
        rankings: [
          { rank: 1, userId: 1, login: 'player1', firstname: 'Alice', lastname: 'Doe', totalScore: 300 },
        ],
      },
    })
    const { result } = renderHook(() => useGlobalLeaderboard(10), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data![0].login).toBe('player1')
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/client && pnpm test src/__tests__/hooks.test.ts
```

Expected: FAIL — cannot find `../hooks/useGames`.

- [ ] **Step 3: Update AuthContext with register()**

Replace `packages/client/src/contexts/AuthContext.tsx`:

```tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { UserPublic, RegisterInput } from '@extia-gaming/shared'
import { api } from '../services/api.ts'

interface AuthContextValue {
  user: UserPublic | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: RegisterInput) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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

  async function register(data: RegisterInput) {
    const res = await api.post<{ user: UserPublic }>('/auth/register', data)
    setUser(res.data.user)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Create hooks/useGames.ts**

```typescript
// packages/client/src/hooks/useGames.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api.ts'
import type { PlayInput, GameLeaderboardEntry } from '@extia-gaming/shared'

export interface GameWithScore {
  id: number
  nom: string
  imageUrl: string | null
  happyHourStart: string | null
  happyHourEnd: string | null
  gameTypes: Array<{ id: number; name: string; calcul: string; win: string; team: boolean; videoGameId: number }>
  totalScore: number
}

export interface GameDetail extends GameWithScore {
  rankings: (GameLeaderboardEntry & { rank: number })[]
}

export function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await api.get<{ games: GameWithScore[] }>('/api/games')
      return res.data.games
    },
  })
}

export function useGame(id: number) {
  return useQuery({
    queryKey: ['games', id],
    enabled: id > 0,
    queryFn: async () => {
      const res = await api.get<{ game: GameDetail }>(`/api/games/${id}`)
      return res.data.game
    },
  })
}

export function useSubmitPlay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: PlayInput) => {
      const res = await api.post<{ session: { id: number; score: number; happyHourApplied: boolean; originalScore: number } }>('/api/play', data)
      return res.data.session
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['games'] })
      qc.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })
}
```

- [ ] **Step 5: Create hooks/useLeaderboard.ts**

```typescript
// packages/client/src/hooks/useLeaderboard.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api.ts'
import type { LeaderboardEntry, GameScoreSummary } from '@extia-gaming/shared'

export interface RankedEntry extends LeaderboardEntry {
  rank: number
}

export function useGlobalLeaderboard(limit = 20) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
      const res = await api.get<{ rankings: RankedEntry[] }>(`/api/leaderboard?limit=${limit}`)
      return res.data.rankings
    },
  })
}

export function useTopGames(limit = 5) {
  return useQuery({
    queryKey: ['leaderboard', 'top-games', limit],
    queryFn: async () => {
      const res = await api.get<{ games: GameScoreSummary[] }>(`/api/leaderboard/top-games?limit=${limit}`)
      return res.data.games
    },
  })
}
```

- [ ] **Step 6: Create hooks/useAdmin.ts**

```typescript
// packages/client/src/hooks/useAdmin.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api.ts'
import type { CreateGameInput, CreateGameTypeInput, UpdateHappyHourInput, GrantBonusInput } from '@extia-gaming/shared'

export function useCreateGame() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateGameInput) => {
      const res = await api.post('/api/admin/games', data)
      return res.data.game
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  })
}

export function useAddGameType(videoGameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateGameTypeInput) => {
      const res = await api.post(`/api/admin/games/${videoGameId}/game-types`, data)
      return res.data.gameType
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games', videoGameId] }),
  })
}

export function useUpdateHappyHour(videoGameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateHappyHourInput) => {
      const res = await api.put(`/api/admin/games/${videoGameId}/happy-hour`, data)
      return res.data.game
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  })
}

export function useGrantBonus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: GrantBonusInput) => {
      const res = await api.post('/api/admin/bonuses', data)
      return res.data.bonus
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaderboard'] }),
  })
}
```

- [ ] **Step 7: Run tests**

```bash
cd packages/client && pnpm test src/__tests__/hooks.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 8: Run full test suite**

```bash
cd packages/client && pnpm test
```

Expected: All existing tests still pass.

- [ ] **Step 9: Commit**

```bash
git add packages/client/src/contexts/AuthContext.tsx packages/client/src/hooks/useGames.ts packages/client/src/hooks/useLeaderboard.ts packages/client/src/hooks/useAdmin.ts packages/client/src/__tests__/hooks.test.ts
git commit -m "feat(client): add register to AuthContext; TQ hooks for games, leaderboard, admin"
```

---

### Task 3: AppLayout — Styled Navigation

**Files:**
- Modify: `packages/client/src/components/AppLayout.tsx`
- Create: `packages/client/src/components/AppLayout.module.css`
- Create: `packages/client/src/__tests__/AppLayout.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `packages/client/src/__tests__/AppLayout.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils.tsx'
import AppLayout from '../components/AppLayout.tsx'

vi.mock('../hooks/useAuth.ts', () => ({
  useAuth: () => ({ user: null, isLoading: false, logout: vi.fn() }),
}))

describe('AppLayout', () => {
  it('renders skip-to-content link', () => {
    renderWithProviders(<AppLayout />)
    expect(screen.getByText('Aller au contenu principal')).toBeInTheDocument()
  })

  it('shows login link when unauthenticated', () => {
    renderWithProviders(<AppLayout />)
    expect(screen.getByRole('link', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('shows logout button when authenticated', () => {
    vi.mocked(require('../hooks/useAuth.ts').useAuth).mockReturnValue({
      user: { id: 1, login: 'alice', email: 'alice@test.com', firstname: 'Alice', lastname: 'Doe', intern: false, role: { id: 1, name: 'user' } },
      isLoading: false,
      logout: vi.fn(),
    })
    renderWithProviders(<AppLayout />)
    expect(screen.getByRole('button', { name: /se déconnecter/i })).toBeInTheDocument()
  })

  it('shows admin link for admin user', () => {
    vi.mocked(require('../hooks/useAuth.ts').useAuth).mockReturnValue({
      user: { id: 1, login: 'admin', email: 'admin@extia.fr', firstname: 'Super', lastname: 'Admin', intern: true, role: { id: 2, name: 'admin' } },
      isLoading: false,
      logout: vi.fn(),
    })
    renderWithProviders(<AppLayout />)
    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/client && pnpm test src/__tests__/AppLayout.test.tsx
```

Expected: FAIL — skip link not found.

- [ ] **Step 3: Create AppLayout.module.css**

```css
/* packages/client/src/components/AppLayout.module.css */

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--header-height);
  background: rgba(26, 26, 46, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
}

.nav {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--page-padding);
  height: 100%;
  display: flex;
  align-items: center;
  gap: 32px;
}

.logo {
  font-size: var(--text-lg);
  font-weight: 800;
  color: var(--text-primary) !important;
  text-decoration: none !important;
  letter-spacing: -0.02em;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo span {
  color: var(--color-accent);
}

.navLinks {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.navLink {
  padding: 6px 14px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-muted) !important;
  transition: color var(--transition), background var(--transition);
  text-decoration: none !important;
}

.navLink:hover {
  color: var(--text-primary) !important;
  background: rgba(255, 255, 255, 0.06);
}

.navLinkActive {
  color: var(--text-primary) !important;
  background: rgba(233, 69, 96, 0.12);
}

.navActions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.userInfo {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.logoutBtn {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}

.logoutBtn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.main {
  min-height: calc(100vh - var(--header-height) - 56px);
}

.footer {
  text-align: center;
  padding: 20px var(--page-padding);
  border-top: 1px solid var(--border-color);
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.adminBadge {
  font-size: var(--text-xs);
  padding: 2px 6px;
  background: rgba(233, 69, 96, 0.15);
  color: var(--color-accent);
  border-radius: var(--radius-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

- [ ] **Step 4: Update AppLayout.tsx**

```tsx
// packages/client/src/components/AppLayout.tsx
import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role?.name === 'admin'

  return (
    <>
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Navigation principale">
          <Link to="/" className={styles.logo}>
            Extia <span>Gaming</span> 24h
          </Link>

          <div className={styles.navLinks}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Accueil
            </NavLink>
            <NavLink
              to="/jeux"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Jeux
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                Admin <span className={styles.adminBadge}>admin</span>
              </NavLink>
            )}
          </div>

          <div className={styles.navActions}>
            {user ? (
              <>
                <NavLink
                  to="/profil"
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                  aria-label={`Profil de ${user.login}`}
                >
                  {user.login}
                </NavLink>
                <button
                  type="button"
                  className={styles.logoutBtn}
                  onClick={logout}
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                Se connecter
              </NavLink>
            )}
          </div>
        </nav>
      </header>

      <main id="main-content" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <p>
          Extia Gaming 24h &mdash;{' '}
          <Link to="/politique-de-confidentialite">Politique de confidentialité</Link>
        </p>
      </footer>
    </>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
cd packages/client && pnpm test src/__tests__/AppLayout.test.tsx
```

Expected: Tests pass (may need to fix mock patterns — use `vi.mock` at module level, not inline `require`).

If the `vi.mocked(require(...))` pattern fails (it does in ESM), rewrite the test using module-level mock overrides:

```tsx
// Replace the test file with this pattern if needed:
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils.tsx'
import AppLayout from '../components/AppLayout.tsx'

const mockUseAuth = vi.fn()

vi.mock('../hooks/useAuth.ts', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('AppLayout', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, logout: vi.fn() })
  })

  it('renders skip-to-content link', () => {
    renderWithProviders(<AppLayout />)
    expect(screen.getByText('Aller au contenu principal')).toBeInTheDocument()
  })

  it('shows login link when unauthenticated', () => {
    renderWithProviders(<AppLayout />)
    expect(screen.getByRole('link', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('shows logout button when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, login: 'alice', email: 'alice@test.com', firstname: 'Alice', lastname: 'Doe', intern: false, role: { id: 1, name: 'user' } },
      isLoading: false,
      logout: vi.fn(),
    })
    renderWithProviders(<AppLayout />)
    expect(screen.getByRole('button', { name: /se déconnecter/i })).toBeInTheDocument()
  })

  it('shows admin link for admin user', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, login: 'admin', email: 'admin@extia.fr', firstname: 'Super', lastname: 'Admin', intern: true, role: { id: 2, name: 'admin' } },
      isLoading: false,
      logout: vi.fn(),
    })
    renderWithProviders(<AppLayout />)
    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Run full test suite**

```bash
cd packages/client && pnpm test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/components/AppLayout.tsx packages/client/src/components/AppLayout.module.css packages/client/src/__tests__/AppLayout.test.tsx
git commit -m "feat(client): styled AppLayout nav with admin link and skip-to-content"
```
