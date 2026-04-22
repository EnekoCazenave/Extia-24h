# Frontend — Plan 3/5 : Public Pages (Home, Games, Game Detail)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the three public-facing pages: HomePage (top-5 games + global leaderboard), GamesPage (grid of game cards), and GameDetailPage (game ranking + total points + link to play form).

**Prerequisites:** Plans 1/5 and 2/5 complete. Backend plan complete with `GET /api/games`, `GET /api/games/:id`, `GET /api/leaderboard`, `GET /api/leaderboard/top-games` routes live.

**Architecture:** Each page uses CSS Modules for scoping. Data fetched via TanStack Query hooks (`useGames`, `useTopGames`, `useGlobalLeaderboard`, `useGame`). Pages are public (no auth required). `useGame(id)` receives `id` from React Router `useParams()`.

**Tech Stack:** React 18, React Router v6, TanStack Query v5, CSS Modules

**Working directory:** `.worktrees/foundation/` — all paths relative to monorepo root.

---

## File Structure

```
packages/client/src/
├── components/
│   ├── TopGamesTable.tsx        CREATE  top-N games by score table
│   ├── TopGamesTable.module.css CREATE
│   ├── PlayerLeaderboard.tsx    CREATE  reusable ranked player table
│   ├── PlayerLeaderboard.module.css CREATE
│   ├── GameCard.tsx             CREATE  clickable game card
│   └── GameCard.module.css      CREATE
├── pages/
│   ├── HomePage.tsx             MODIFY  add TQ hooks, top games, leaderboard
│   ├── HomePage.module.css      CREATE
│   ├── GamesPage.tsx            CREATE
│   ├── GamesPage.module.css     CREATE
│   ├── GameDetailPage.tsx       CREATE
│   └── GameDetailPage.module.css CREATE
└── __tests__/
    ├── HomePage.test.tsx        CREATE
    ├── GamesPage.test.tsx       CREATE
    └── GameDetailPage.test.tsx  CREATE
```

---

### Task 6: HomePage — Leaderboard + Top Games

**Files:**
- Modify: `packages/client/src/pages/HomePage.tsx`
- Create: `packages/client/src/pages/HomePage.module.css`
- Create: `packages/client/src/components/TopGamesTable.tsx`
- Create: `packages/client/src/components/TopGamesTable.module.css`
- Create: `packages/client/src/components/PlayerLeaderboard.tsx`
- Create: `packages/client/src/components/PlayerLeaderboard.module.css`
- Create: `packages/client/src/__tests__/HomePage.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `packages/client/src/__tests__/HomePage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils.tsx'
import HomePage from '../pages/HomePage.tsx'

const mockUseTopGames = vi.fn()
const mockUseGlobalLeaderboard = vi.fn()

vi.mock('../hooks/useLeaderboard.ts', () => ({
  useTopGames: () => mockUseTopGames(),
  useGlobalLeaderboard: () => mockUseGlobalLeaderboard(),
}))

describe('HomePage', () => {
  beforeEach(() => {
    mockUseTopGames.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    mockUseGlobalLeaderboard.mockReturnValue({ data: undefined, isLoading: true, isError: false })
  })

  it('renders main heading', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders top games section heading', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByText(/top.*jeux/i)).toBeInTheDocument()
  })

  it('renders classement section heading', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByText(/classement/i)).toBeInTheDocument()
  })

  it('shows top games when data loaded', () => {
    mockUseTopGames.mockReturnValue({
      data: [
        { videoGameId: 1, nom: 'League of Legends', imageUrl: null, totalScore: 500 },
        { videoGameId: 2, nom: 'Échecs', imageUrl: null, totalScore: 200 },
      ],
      isLoading: false,
      isError: false,
    })
    mockUseGlobalLeaderboard.mockReturnValue({ data: [], isLoading: false, isError: false })
    renderWithProviders(<HomePage />)
    expect(screen.getByText('League of Legends')).toBeInTheDocument()
    expect(screen.getByText('Échecs')).toBeInTheDocument()
  })

  it('shows player rankings when data loaded', () => {
    mockUseTopGames.mockReturnValue({ data: [], isLoading: false, isError: false })
    mockUseGlobalLeaderboard.mockReturnValue({
      data: [{ rank: 1, userId: 1, login: 'alice42', firstname: 'Alice', lastname: 'Doe', totalScore: 300 }],
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<HomePage />)
    expect(screen.getByText('alice42')).toBeInTheDocument()
    expect(screen.getByText('300')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/client && pnpm test src/__tests__/HomePage.test.tsx
```

Expected: FAIL — mocked hooks not found.

- [ ] **Step 3: Create TopGamesTable.module.css**

```css
/* packages/client/src/components/TopGamesTable.module.css */

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 10px 16px;
  font-size: 0.72rem;
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

.rankCell {
  width: 48px;
  text-align: center;
}

.rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-weight: 700;
  font-size: var(--text-xs);
  background: var(--bg-elevated);
  color: var(--text-muted);
}

.rank[data-rank="1"] { background: rgba(184, 134, 11, 0.2); color: #ffe066; }
.rank[data-rank="2"] { background: rgba(85, 85, 85, 0.3); color: #c0c0c0; }
.rank[data-rank="3"] { background: rgba(90, 48, 16, 0.3); color: #cd7f32; }

.gameName {
  font-weight: 600;
  color: var(--text-primary);
}

.score {
  font-weight: 700;
  color: var(--color-accent);
  font-size: var(--text-base);
}
```

- [ ] **Step 4: Create TopGamesTable.tsx**

```tsx
// packages/client/src/components/TopGamesTable.tsx
import type { GameScoreSummary } from '@extia-gaming/shared'
import styles from './TopGamesTable.module.css'

interface TopGamesTableProps {
  games: GameScoreSummary[]
}

export default function TopGamesTable({ games }: TopGamesTableProps) {
  if (games.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: '16px 0' }}>Aucune partie jouée pour l'instant.</p>
  }

  return (
    <table className={styles.table} aria-label="Top jeux par score total">
      <thead>
        <tr>
          <th className={styles.rankCell} scope="col">#</th>
          <th scope="col">Jeu</th>
          <th scope="col">Score total</th>
        </tr>
      </thead>
      <tbody>
        {games.map((game, index) => {
          const rank = index + 1
          return (
            <tr key={game.videoGameId}>
              <td className={styles.rankCell}>
                <span className={styles.rank} data-rank={rank <= 3 ? rank : undefined}>
                  {rank}
                </span>
              </td>
              <td>
                <span className={styles.gameName}>{game.nom}</span>
              </td>
              <td>
                <span className={styles.score}>{game.totalScore.toLocaleString('fr-FR')}</span>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 5: Create PlayerLeaderboard.module.css**

```css
/* packages/client/src/components/PlayerLeaderboard.module.css */

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 10px 16px;
  font-size: 0.72rem;
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

.rankCell {
  width: 48px;
  text-align: center;
}

.rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-weight: 700;
  font-size: var(--text-xs);
  background: var(--bg-elevated);
  color: var(--text-muted);
}

.rank[data-rank="1"] { background: rgba(184, 134, 11, 0.2); color: #ffe066; }
.rank[data-rank="2"] { background: rgba(85, 85, 85, 0.3); color: #c0c0c0; }
.rank[data-rank="3"] { background: rgba(90, 48, 16, 0.3); color: #cd7f32; }

.playerName {
  font-weight: 600;
  color: var(--text-primary);
}

.playerLogin {
  color: var(--text-muted);
  font-size: var(--text-xs);
  margin-top: 2px;
}

.score {
  font-weight: 700;
  color: var(--color-secondary);
}
```

- [ ] **Step 6: Create PlayerLeaderboard.tsx**

```tsx
// packages/client/src/components/PlayerLeaderboard.tsx
import type { RankedEntry } from '../hooks/useLeaderboard.ts'
import styles from './PlayerLeaderboard.module.css'

interface PlayerLeaderboardProps {
  rankings: RankedEntry[]
  caption?: string
}

export default function PlayerLeaderboard({ rankings, caption }: PlayerLeaderboardProps) {
  if (rankings.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: '16px 0' }}>Aucun joueur classé pour l'instant.</p>
  }

  return (
    <table className={styles.table} aria-label={caption ?? 'Classement des joueurs'}>
      <thead>
        <tr>
          <th className={styles.rankCell} scope="col">#</th>
          <th scope="col">Joueur</th>
          <th scope="col">Score total</th>
        </tr>
      </thead>
      <tbody>
        {rankings.map((entry) => (
          <tr key={entry.userId}>
            <td className={styles.rankCell}>
              <span className={styles.rank} data-rank={entry.rank <= 3 ? entry.rank : undefined}>
                {entry.rank}
              </span>
            </td>
            <td>
              <div className={styles.playerName}>{entry.login}</div>
              <div className={styles.playerLogin}>
                {entry.firstname} {entry.lastname}
              </div>
            </td>
            <td>
              <span className={styles.score}>{entry.totalScore.toLocaleString('fr-FR')}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 7: Create HomePage.module.css**

```css
/* packages/client/src/pages/HomePage.module.css */

.hero {
  background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%);
  border-bottom: 1px solid var(--border-color);
  padding: 64px var(--page-padding);
  text-align: center;
}

.heroTitle {
  font-size: clamp(var(--text-3xl), 6vw, var(--text-4xl));
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.heroAccent {
  color: var(--color-accent);
}

.heroSubtitle {
  font-size: var(--text-lg);
  color: var(--text-muted);
  max-width: 540px;
  margin: 0 auto;
}

.content {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 48px var(--page-padding);
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 40px;
  align-items: start;
}

@media (max-width: 768px) {
  .content {
    grid-template-columns: 1fr;
  }
}

.section {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.sectionTitle {
  font-size: var(--text-lg);
  font-weight: 700;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
}

.sectionTitle::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}
```

- [ ] **Step 8: Update HomePage.tsx**

```tsx
// packages/client/src/pages/HomePage.tsx
import SEOHead from '../components/SEOHead.tsx'
import TopGamesTable from '../components/TopGamesTable.tsx'
import PlayerLeaderboard from '../components/PlayerLeaderboard.tsx'
import { useTopGames, useGlobalLeaderboard } from '../hooks/useLeaderboard.ts'
import styles from './HomePage.module.css'

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
  const topGames = useTopGames(5)
  const leaderboard = useGlobalLeaderboard(20)

  return (
    <>
      <SEOHead
        title="Extia Gaming 24h"
        description="L'événement gaming interne d'Extia — 24 heures de jeux et de compétition."
        canonicalPath="/"
        jsonLd={EVENT_JSON_LD}
      />

      <section className={styles.hero} aria-labelledby="home-title">
        <h1 className={styles.heroTitle} id="home-title">
          Extia <span className={styles.heroAccent}>Gaming</span> 24h
        </h1>
        <p className={styles.heroSubtitle}>
          24 heures de compétition, de jeux et de fair-play. Que le meilleur gagne !
        </p>
      </section>

      <div className={styles.content}>
        <section aria-labelledby="top-games-title" className={styles.section}>
          <h2 className={styles.sectionTitle} id="top-games-title">
            🏆 Top 5 Jeux
          </h2>
          {topGames.isLoading && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }} aria-live="polite">
              Chargement…
            </p>
          )}
          {topGames.isError && (
            <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }} role="alert">
              Impossible de charger les jeux.
            </p>
          )}
          {topGames.data && <TopGamesTable games={topGames.data} />}
        </section>

        <section aria-labelledby="leaderboard-title" className={styles.section}>
          <h2 className={styles.sectionTitle} id="leaderboard-title">
            🎮 Classement général
          </h2>
          {leaderboard.isLoading && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }} aria-live="polite">
              Chargement…
            </p>
          )}
          {leaderboard.isError && (
            <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }} role="alert">
              Impossible de charger le classement.
            </p>
          )}
          {leaderboard.data && <PlayerLeaderboard rankings={leaderboard.data} />}
        </section>
      </div>
    </>
  )
}
```

- [ ] **Step 9: Run tests**

```bash
cd packages/client && pnpm test src/__tests__/HomePage.test.tsx
```

Expected: All 5 tests pass.

- [ ] **Step 10: Commit**

```bash
git add packages/client/src/pages/HomePage.tsx packages/client/src/pages/HomePage.module.css packages/client/src/components/TopGamesTable.tsx packages/client/src/components/TopGamesTable.module.css packages/client/src/components/PlayerLeaderboard.tsx packages/client/src/components/PlayerLeaderboard.module.css packages/client/src/__tests__/HomePage.test.tsx
git commit -m "feat(client): HomePage with top-5 games and global leaderboard"
```

---

### Task 7: GamesPage — Game Cards Grid

**Files:**
- Create: `packages/client/src/components/GameCard.tsx`
- Create: `packages/client/src/components/GameCard.module.css`
- Create: `packages/client/src/pages/GamesPage.tsx`
- Create: `packages/client/src/pages/GamesPage.module.css`
- Create: `packages/client/src/__tests__/GamesPage.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `packages/client/src/__tests__/GamesPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils.tsx'
import GamesPage from '../pages/GamesPage.tsx'

const mockUseGames = vi.fn()

vi.mock('../hooks/useGames.ts', () => ({
  useGames: () => mockUseGames(),
}))

describe('GamesPage', () => {
  beforeEach(() => {
    mockUseGames.mockReturnValue({ data: undefined, isLoading: true, isError: false })
  })

  it('renders page heading', () => {
    renderWithProviders(<GamesPage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('shows loading state', () => {
    renderWithProviders(<GamesPage />)
    expect(screen.getByText(/chargement/i)).toBeInTheDocument()
  })

  it('renders game cards when loaded', () => {
    mockUseGames.mockReturnValue({
      data: [
        { id: 1, nom: 'League of Legends', imageUrl: null, gameTypes: [{ id: 1, name: '5v5' }], totalScore: 100, happyHourStart: null, happyHourEnd: null },
        { id: 2, nom: 'Échecs', imageUrl: null, gameTypes: [{ id: 2, name: 'Blitz' }], totalScore: 50, happyHourStart: null, happyHourEnd: null },
      ],
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<GamesPage />)
    expect(screen.getByText('League of Legends')).toBeInTheDocument()
    expect(screen.getByText('Échecs')).toBeInTheDocument()
  })

  it('shows happy hour badge when active', () => {
    const now = new Date()
    const start = new Date(now.getTime() - 10 * 60 * 1000).toISOString()
    const end = new Date(now.getTime() + 50 * 60 * 1000).toISOString()
    mockUseGames.mockReturnValue({
      data: [
        { id: 1, nom: 'League of Legends', imageUrl: null, gameTypes: [], totalScore: 0, happyHourStart: start, happyHourEnd: end },
      ],
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<GamesPage />)
    expect(screen.getByText(/happy hour/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/client && pnpm test src/__tests__/GamesPage.test.tsx
```

Expected: FAIL — `GamesPage` not found.

- [ ] **Step 3: Create GameCard.module.css**

```css
/* packages/client/src/components/GameCard.module.css */

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  text-decoration: none !important;
  display: block;
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
  color: var(--text-primary) !important;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: rgba(233, 69, 96, 0.4);
}

.imageWrapper {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--bg-elevated);
  overflow: hidden;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition);
}

.card:hover .image {
  transform: scale(1.05);
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  background: linear-gradient(135deg, var(--bg-elevated), var(--bg-card));
  color: var(--text-muted);
}

.happyHourBadge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: #1a1a1a;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 3px 8px;
  border-radius: 99px;
}

.body {
  padding: 20px;
}

.name {
  font-size: var(--text-lg);
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.score {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.scoreValue {
  font-weight: 700;
  color: var(--color-accent);
}

.typesList {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.typeTag {
  font-size: var(--text-xs);
  padding: 2px 8px;
  background: rgba(76, 201, 240, 0.1);
  color: var(--color-secondary);
  border-radius: 99px;
  border: 1px solid rgba(76, 201, 240, 0.2);
}
```

- [ ] **Step 4: Create GameCard.tsx**

```tsx
// packages/client/src/components/GameCard.tsx
import { Link } from 'react-router-dom'
import type { GameWithScore } from '../hooks/useGames.ts'
import styles from './GameCard.module.css'

interface GameCardProps {
  game: GameWithScore
}

function isHappyHourActive(start: string | null, end: string | null): boolean {
  if (!start || !end) return false
  const now = new Date()
  return now >= new Date(start) && now <= new Date(end)
}

export default function GameCard({ game }: GameCardProps) {
  const happyHour = isHappyHourActive(game.happyHourStart, game.happyHourEnd)

  return (
    <Link
      to={`/jeux/${game.id}`}
      className={styles.card}
      aria-label={`Voir le détail du jeu ${game.nom}`}
    >
      <div className={styles.imageWrapper}>
        {game.imageUrl ? (
          <img
            className={styles.image}
            src={game.imageUrl}
            alt={`Illustration du jeu ${game.nom}`}
            loading="lazy"
          />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">🎮</div>
        )}
        {happyHour && (
          <span className={styles.happyHourBadge} aria-label="Happy Hour active — points doublés">
            ⚡ Happy Hour
          </span>
        )}
      </div>

      <div className={styles.body}>
        <h2 className={styles.name}>{game.nom}</h2>

        {game.gameTypes.length > 0 && (
          <div className={styles.typesList}>
            {game.gameTypes.map((gt) => (
              <span key={gt.id} className={styles.typeTag}>{gt.name}</span>
            ))}
          </div>
        )}

        <div className={styles.meta}>
          <span className={styles.score}>
            Score total : <span className={styles.scoreValue}>{game.totalScore.toLocaleString('fr-FR')}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 5: Create GamesPage.module.css**

```css
/* packages/client/src/pages/GamesPage.module.css */

.page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 48px var(--page-padding);
}

.header {
  margin-bottom: 32px;
}

.title {
  font-size: var(--text-3xl);
  font-weight: 800;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-muted);
  font-size: var(--text-base);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.empty {
  color: var(--text-muted);
  text-align: center;
  padding: 64px 0;
  font-size: var(--text-sm);
}

.error {
  color: var(--color-error);
  text-align: center;
  padding: 32px 0;
  font-size: var(--text-sm);
}
```

- [ ] **Step 6: Create GamesPage.tsx**

```tsx
// packages/client/src/pages/GamesPage.tsx
import SEOHead from '../components/SEOHead.tsx'
import GameCard from '../components/GameCard.tsx'
import { useGames } from '../hooks/useGames.ts'
import styles from './GamesPage.module.css'

export default function GamesPage() {
  const { data: games, isLoading, isError } = useGames()

  return (
    <div className={styles.page}>
      <SEOHead
        title="Jeux"
        description="Découvrez tous les jeux de l'événement Extia Gaming 24h et consultez les classements."
        canonicalPath="/jeux"
      />

      <header className={styles.header}>
        <h1 className={styles.title}>Les jeux</h1>
        <p className={styles.subtitle}>
          Cliquez sur un jeu pour voir le classement détaillé et soumettre votre score.
        </p>
      </header>

      {isLoading && (
        <p className={styles.empty} aria-live="polite">Chargement des jeux…</p>
      )}

      {isError && (
        <p className={styles.error} role="alert">
          Impossible de charger la liste des jeux. Veuillez réessayer.
        </p>
      )}

      {games && games.length === 0 && (
        <p className={styles.empty}>Aucun jeu disponible pour l'instant.</p>
      )}

      {games && games.length > 0 && (
        <ul className={styles.grid} role="list" aria-label="Liste des jeux">
          {games.map((game) => (
            <li key={game.id}>
              <GameCard game={game} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Run tests**

```bash
cd packages/client && pnpm test src/__tests__/GamesPage.test.tsx
```

Expected: All 4 tests pass.

- [ ] **Step 8: Commit**

```bash
git add packages/client/src/components/GameCard.tsx packages/client/src/components/GameCard.module.css packages/client/src/pages/GamesPage.tsx packages/client/src/pages/GamesPage.module.css packages/client/src/__tests__/GamesPage.test.tsx
git commit -m "feat(client): GamesPage with GameCard grid and happy hour badge"
```

---

### Task 8: GameDetailPage

**Files:**
- Create: `packages/client/src/pages/GameDetailPage.tsx`
- Create: `packages/client/src/pages/GameDetailPage.module.css`
- Create: `packages/client/src/__tests__/GameDetailPage.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `packages/client/src/__tests__/GameDetailPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils.tsx'
import GameDetailPage from '../pages/GameDetailPage.tsx'

const mockUseGame = vi.fn()
const mockUseParams = vi.fn()

vi.mock('../hooks/useGames.ts', () => ({
  useGame: (id: number) => mockUseGame(id),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useParams: () => mockUseParams() }
})

const mockGame = {
  id: 1,
  nom: 'League of Legends',
  imageUrl: null,
  happyHourStart: null,
  happyHourEnd: null,
  gameTypes: [{ id: 1, name: '5v5 Classique', calcul: 'Best of 3', win: 'Destroy nexus', team: true, videoGameId: 1 }],
  totalScore: 750,
  rankings: [
    { rank: 1, userId: 1, login: 'alice42', firstname: 'Alice', lastname: 'Doe', gameScore: 400 },
    { rank: 2, userId: 2, login: 'bob99', firstname: 'Bob', lastname: 'Martin', gameScore: 350 },
  ],
}

describe('GameDetailPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: '1' })
  })

  it('shows loading state', () => {
    mockUseGame.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderWithProviders(<GameDetailPage />)
    expect(screen.getByText(/chargement/i)).toBeInTheDocument()
  })

  it('shows game name in heading', () => {
    mockUseGame.mockReturnValue({ data: mockGame, isLoading: false, isError: false })
    renderWithProviders(<GameDetailPage />)
    expect(screen.getByRole('heading', { name: /league of legends/i })).toBeInTheDocument()
  })

  it('shows total score', () => {
    mockUseGame.mockReturnValue({ data: mockGame, isLoading: false, isError: false })
    renderWithProviders(<GameDetailPage />)
    expect(screen.getByText('750')).toBeInTheDocument()
  })

  it('shows player rankings', () => {
    mockUseGame.mockReturnValue({ data: mockGame, isLoading: false, isError: false })
    renderWithProviders(<GameDetailPage />)
    expect(screen.getByText('alice42')).toBeInTheDocument()
    expect(screen.getByText('bob99')).toBeInTheDocument()
  })

  it('shows link to play form for each game type', () => {
    mockUseGame.mockReturnValue({ data: mockGame, isLoading: false, isError: false })
    renderWithProviders(<GameDetailPage />)
    expect(screen.getByRole('link', { name: /soumettre.*5v5/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/client && pnpm test src/__tests__/GameDetailPage.test.tsx
```

Expected: FAIL — `GameDetailPage` not found.

- [ ] **Step 3: Create GameDetailPage.module.css**

```css
/* packages/client/src/pages/GameDetailPage.module.css */

.page {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 48px var(--page-padding);
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: 24px;
  transition: color var(--transition);
}

.back:hover {
  color: var(--text-primary);
}

.header {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 40px;
}

.gameName {
  font-size: var(--text-3xl);
  font-weight: 800;
}

.statsRow {
  display: flex;
  gap: 24px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.statLabel {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.statValue {
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--color-accent);
}

.grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 32px;
  align-items: start;
}

@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
}

.section {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.sectionTitle {
  font-size: var(--text-lg);
  font-weight: 700;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sectionTitle::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.gameTypeCard {
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 12px;
}

.gameTypeCard:last-child {
  margin-bottom: 0;
}

.gameTypeName {
  font-weight: 700;
  font-size: var(--text-base);
  margin-bottom: 8px;
}

.gameTypeMeta {
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: 1.6;
}

.teamBadge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  background: rgba(76, 201, 240, 0.15);
  color: var(--color-secondary);
  border-radius: 99px;
  margin-left: 6px;
}

.playBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 7px 14px;
  background: var(--color-accent);
  color: var(--text-on-accent);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 700;
  text-decoration: none !important;
  transition: background var(--transition), box-shadow var(--transition);
}

.playBtn:hover {
  background: var(--color-accent-hover);
  box-shadow: var(--shadow-glow);
}

.happyHour {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(249, 115, 22, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: var(--text-sm);
  color: #f59e0b;
  font-weight: 600;
}
```

- [ ] **Step 4: Create GameDetailPage.tsx**

```tsx
// packages/client/src/pages/GameDetailPage.tsx
import { Link, useParams } from 'react-router-dom'
import SEOHead from '../components/SEOHead.tsx'
import PlayerLeaderboard from '../components/PlayerLeaderboard.tsx'
import { useGame } from '../hooks/useGames.ts'
import styles from './GameDetailPage.module.css'

function isHappyHourActive(start: string | null, end: string | null): boolean {
  if (!start || !end) return false
  const now = new Date()
  return now >= new Date(start) && now <= new Date(end)
}

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>()
  const gameId = parseInt(id ?? '0', 10)
  const { data: game, isLoading, isError } = useGame(gameId)

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--text-muted)' }} aria-live="polite">Chargement du jeu…</p>
      </div>
    )
  }

  if (isError || !game) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--color-error)' }} role="alert">
          Jeu introuvable ou erreur de chargement.
        </p>
        <Link to="/jeux" className={styles.back}>← Retour aux jeux</Link>
      </div>
    )
  }

  const happyHour = isHappyHourActive(game.happyHourStart, game.happyHourEnd)

  return (
    <div className={styles.page}>
      <SEOHead
        title={game.nom}
        description={`Classement et scores pour ${game.nom} — Extia Gaming 24h.`}
        canonicalPath={`/jeux/${game.id}`}
      />

      <Link to="/jeux" className={styles.back}>← Retour aux jeux</Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.gameName}>{game.nom}</h1>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Score total</span>
              <span className={styles.statValue}>{game.totalScore.toLocaleString('fr-FR')}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Participants</span>
              <span className={styles.statValue}>{game.rankings.length}</span>
            </div>
          </div>
        </div>
      </header>

      {happyHour && (
        <div className={styles.happyHour} role="status" aria-live="polite">
          ⚡ Happy Hour active ! Les points sont doublés jusqu'à{' '}
          {new Date(game.happyHourEnd!).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      <div className={styles.grid}>
        <section aria-labelledby="ranking-title" className={styles.section}>
          <h2 className={styles.sectionTitle} id="ranking-title">
            🏆 Classement
          </h2>
          <PlayerLeaderboard
            rankings={game.rankings.map((r) => ({ ...r, totalScore: r.gameScore }))}
            caption={`Classement des joueurs — ${game.nom}`}
          />
        </section>

        <section aria-labelledby="gametypes-title" className={styles.section}>
          <h2 className={styles.sectionTitle} id="gametypes-title">
            📋 Modes de jeu
          </h2>
          {game.gameTypes.map((gt) => (
            <div key={gt.id} className={styles.gameTypeCard}>
              <div className={styles.gameTypeName}>
                {gt.name}
                {gt.team && <span className={styles.teamBadge}>Équipe</span>}
              </div>
              <div className={styles.gameTypeMeta}>
                <div><strong>Calcul :</strong> {gt.calcul}</div>
                <div><strong>Victoire :</strong> {gt.win}</div>
              </div>
              <Link
                to={`/jeux/${game.id}/jouer?gameTypeId=${gt.id}`}
                className={styles.playBtn}
                aria-label={`Soumettre une partie pour ${gt.name}`}
              >
                🎮 Soumettre une partie — {gt.name}
              </Link>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
cd packages/client && pnpm test src/__tests__/GameDetailPage.test.tsx
```

Expected: All 5 tests pass.

- [ ] **Step 6: Run full test suite**

```bash
cd packages/client && pnpm test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/pages/GameDetailPage.tsx packages/client/src/pages/GameDetailPage.module.css packages/client/src/__tests__/GameDetailPage.test.tsx
git commit -m "feat(client): GameDetailPage with ranking, stats and play links"
```
