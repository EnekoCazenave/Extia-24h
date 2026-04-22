# Frontend — Plan 5/5 : Admin, Legal, Error Boundary + Router Wiring

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build AdminPage (create game/type, happy hour, point bonus), PrivacyPage, ErrorBoundary, styled NotFoundPage, then wire all routes in App.tsx.

**Prerequisites:** Plans 1–4 complete. Backend admin routes and all pages from plans 2–4 exist.

**Architecture:** AdminPage uses tabbed interface with 4 panels. ErrorBoundary is a class component wrapping the app in main.tsx. All routes registered in App.tsx — admin routes wrapped with `<ProtectedRoute requiredRole="admin">`.

**Tech Stack:** React 18, React Router v6, TanStack Query v5, CSS Modules

**Working directory:** `.worktrees/foundation/` — all paths relative to monorepo root.

---

## File Structure

```
packages/client/src/
├── pages/
│   ├── AdminPage.tsx               CREATE  tabbed admin interface
│   ├── AdminPage.module.css        CREATE
│   ├── PrivacyPage.tsx             CREATE  RGPD policy document
│   ├── PrivacyPage.module.css      CREATE
│   ├── NotFoundPage.tsx            MODIFY  add styling
│   └── NotFoundPage.module.css     CREATE
├── components/
│   ├── ErrorBoundary.tsx           CREATE  class component, catches runtime errors
│   └── ErrorBoundary.module.css    CREATE
├── App.tsx                         MODIFY  add all routes
└── __tests__/
    ├── AdminPage.test.tsx           CREATE
    └── ErrorBoundary.test.tsx       CREATE
```

---

### Task 11: AdminPage — Tabbed Admin Interface

**Files:**
- Create: `packages/client/src/pages/AdminPage.tsx`
- Create: `packages/client/src/pages/AdminPage.module.css`
- Create: `packages/client/src/__tests__/AdminPage.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `packages/client/src/__tests__/AdminPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils.tsx'
import AdminPage from '../pages/AdminPage.tsx'

vi.mock('../hooks/useAdmin.ts', () => ({
  useCreateGame: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddGameType: (_id: number) => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateHappyHour: (_id: number) => ({ mutateAsync: vi.fn(), isPending: false }),
  useGrantBonus: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('../hooks/useGames.ts', () => ({
  useGames: () => ({
    data: [
      { id: 1, nom: 'League of Legends', imageUrl: null, gameTypes: [], totalScore: 0, happyHourStart: null, happyHourEnd: null },
    ],
    isLoading: false,
  }),
}))

describe('AdminPage', () => {
  it('renders admin heading', () => {
    renderWithProviders(<AdminPage />)
    expect(screen.getByRole('heading', { name: /administration/i })).toBeInTheDocument()
  })

  it('renders all 4 tabs', () => {
    renderWithProviders(<AdminPage />)
    expect(screen.getByRole('tab', { name: /ajouter un jeu/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /type de partie/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /happy hour/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /bonus de points/i })).toBeInTheDocument()
  })

  it('shows add game form by default', () => {
    renderWithProviders(<AdminPage />)
    expect(screen.getByLabelText(/nom du jeu/i)).toBeInTheDocument()
  })

  it('switches to game type tab', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminPage />)
    await user.click(screen.getByRole('tab', { name: /type de partie/i }))
    expect(screen.getByLabelText(/nom du mode/i)).toBeInTheDocument()
  })

  it('switches to happy hour tab', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminPage />)
    await user.click(screen.getByRole('tab', { name: /happy hour/i }))
    expect(screen.getByLabelText(/heure de début/i)).toBeInTheDocument()
  })

  it('switches to bonus tab', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminPage />)
    await user.click(screen.getByRole('tab', { name: /bonus de points/i }))
    expect(screen.getByLabelText(/identifiant du joueur/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/client && pnpm test src/__tests__/AdminPage.test.tsx
```

Expected: FAIL — `AdminPage` not found.

- [ ] **Step 3: Create AdminPage.module.css**

```css
/* packages/client/src/pages/AdminPage.module.css */

.page {
  max-width: 800px;
  margin: 0 auto;
  padding: 48px var(--page-padding);
}

.title {
  font-size: var(--text-3xl);
  font-weight: 800;
  margin-bottom: 6px;
}

.subtitle {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-bottom: 32px;
}

/* Tabs */
.tabList {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 32px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabList::-webkit-scrollbar { display: none; }

.tab {
  padding: 10px 18px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: color var(--transition), border-color var(--transition);
  white-space: nowrap;
  margin-bottom: -1px;
}

.tab:hover {
  color: var(--text-primary);
}

.tabActive {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

/* Panels */
.panel {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 32px;
}

.panelTitle {
  font-size: var(--text-xl);
  font-weight: 700;
  margin-bottom: 24px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

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
  font-family: inherit;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.input:focus,
.select:focus,
.textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.15);
}

.select {
  appearance: none;
  cursor: pointer;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 540px) {
  .row { grid-template-columns: 1fr; }
}

.checkRow {
  display: flex;
  align-items: center;
  gap: 10px;
}

.checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.submitBtn {
  align-self: flex-start;
  padding: 10px 24px;
  background: var(--color-accent);
  color: var(--text-on-accent);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 700;
  cursor: pointer;
  transition: background var(--transition), box-shadow var(--transition);
}

.submitBtn:hover:not(:disabled) {
  background: var(--color-accent-hover);
  box-shadow: var(--shadow-glow);
}

.submitBtn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.success {
  padding: 10px 14px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--radius-md);
  color: var(--color-success);
  font-size: var(--text-sm);
  font-weight: 600;
}

.error {
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: var(--text-sm);
}

.hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
```

- [ ] **Step 4: Create AdminPage.tsx**

```tsx
// packages/client/src/pages/AdminPage.tsx
import { useState, type FormEvent } from 'react'
import SEOHead from '../components/SEOHead.tsx'
import { useGames } from '../hooks/useGames.ts'
import { useCreateGame, useAddGameType, useUpdateHappyHour, useGrantBonus } from '../hooks/useAdmin.ts'
import styles from './AdminPage.module.css'

type Tab = 'create-game' | 'add-game-type' | 'happy-hour' | 'bonus'

const TABS: { id: Tab; label: string }[] = [
  { id: 'create-game', label: 'Ajouter un jeu' },
  { id: 'add-game-type', label: 'Type de partie' },
  { id: 'happy-hour', label: 'Happy Hour' },
  { id: 'bonus', label: 'Bonus de points' },
]

/* ── Panel: Create Game ──────────────────────────────── */
function CreateGamePanel() {
  const createGame = useCreateGame()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSuccess(false)
    setError(null)
    const data = new FormData(e.currentTarget)
    try {
      await createGame.mutateAsync({
        nom: data.get('nom') as string,
        imageUrl: (data.get('imageUrl') as string) || undefined,
        happyHourStart: (data.get('happyHourStart') as string) || undefined,
        happyHourEnd: (data.get('happyHourEnd') as string) || undefined,
      })
      setSuccess(true)
      ;(e.target as HTMLFormElement).reset()
    } catch {
      setError('Erreur lors de la création du jeu.')
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Ajouter un jeu</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="nom">Nom du jeu *</label>
          <input className={styles.input} id="nom" name="nom" type="text" required maxLength={100} placeholder="ex: Rocket League" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="imageUrl">URL de l'image</label>
          <input className={styles.input} id="imageUrl" name="imageUrl" type="url" placeholder="https://..." />
          <span className={styles.hint}>Laisser vide pour l'image par défaut.</span>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="happyHourStart">Happy Hour — début</label>
            <input className={styles.input} id="happyHourStart" name="happyHourStart" type="datetime-local" />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="happyHourEnd">Happy Hour — fin</label>
            <input className={styles.input} id="happyHourEnd" name="happyHourEnd" type="datetime-local" />
          </div>
        </div>
        {success && <p className={styles.success} role="status">✅ Jeu créé avec succès !</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" className={styles.submitBtn} disabled={createGame.isPending}>
          {createGame.isPending ? 'Création…' : '+ Créer le jeu'}
        </button>
      </form>
    </div>
  )
}

/* ── Panel: Add Game Type ────────────────────────────── */
function AddGameTypePanel() {
  const { data: games } = useGames()
  const [selectedGameId, setSelectedGameId] = useState<number>(0)
  const addGameType = useAddGameType(selectedGameId)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedGameId) { setError('Sélectionnez un jeu.'); return }
    setSuccess(false)
    setError(null)
    const data = new FormData(e.currentTarget)
    try {
      await addGameType.mutateAsync({
        name: data.get('name') as string,
        calcul: data.get('calcul') as string,
        win: data.get('win') as string,
        team: data.get('team') === 'on',
      })
      setSuccess(true)
      ;(e.target as HTMLFormElement).reset()
    } catch {
      setError('Erreur lors de l\'ajout du type de partie.')
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Ajouter un type de partie</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="gameId">Jeu *</label>
          <select
            className={styles.select}
            id="gameId"
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(parseInt(e.target.value, 10))}
            required
          >
            <option value={0}>Sélectionner un jeu…</option>
            {games?.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">Nom du mode *</label>
          <input className={styles.input} id="name" name="name" type="text" required maxLength={100} placeholder="ex: 5v5 Classique" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="calcul">Méthode de calcul *</label>
          <input className={styles.input} id="calcul" name="calcul" type="text" required placeholder="ex: Meilleur de 3" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="win">Condition de victoire *</label>
          <input className={styles.input} id="win" name="win" type="text" required placeholder="ex: Destruction du Nexus" />
        </div>
        <div className={styles.checkRow}>
          <input className={styles.checkbox} id="team" name="team" type="checkbox" />
          <label className={styles.label} htmlFor="team">Mode équipe</label>
        </div>
        {success && <p className={styles.success} role="status">✅ Type de partie ajouté !</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" className={styles.submitBtn} disabled={addGameType.isPending}>
          {addGameType.isPending ? 'Ajout…' : '+ Ajouter le type'}
        </button>
      </form>
    </div>
  )
}

/* ── Panel: Happy Hour ───────────────────────────────── */
function HappyHourPanel() {
  const { data: games } = useGames()
  const [selectedGameId, setSelectedGameId] = useState<number>(0)
  const updateHappyHour = useUpdateHappyHour(selectedGameId)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedGameId) { setError('Sélectionnez un jeu.'); return }
    setSuccess(false)
    setError(null)
    const data = new FormData(e.currentTarget)
    const start = data.get('happyHourStart') as string
    const end = data.get('happyHourEnd') as string
    try {
      await updateHappyHour.mutateAsync({
        happyHourStart: start ? new Date(start).toISOString() : null,
        happyHourEnd: end ? new Date(end).toISOString() : null,
      })
      setSuccess(true)
    } catch {
      setError('Erreur lors de la mise à jour de la Happy Hour.')
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Configurer une Happy Hour</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="hhGameId">Jeu *</label>
          <select
            className={styles.select}
            id="hhGameId"
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(parseInt(e.target.value, 10))}
            required
          >
            <option value={0}>Sélectionner un jeu…</option>
            {games?.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
          </select>
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="happyHourStart">Heure de début</label>
            <input className={styles.input} id="happyHourStart" name="happyHourStart" type="datetime-local" />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="happyHourEnd">Heure de fin</label>
            <input className={styles.input} id="happyHourEnd" name="happyHourEnd" type="datetime-local" />
          </div>
        </div>
        <span className={styles.hint}>Laissez vide pour désactiver la Happy Hour sur ce jeu.</span>
        {success && <p className={styles.success} role="status">✅ Happy Hour mise à jour !</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" className={styles.submitBtn} disabled={updateHappyHour.isPending}>
          {updateHappyHour.isPending ? 'Mise à jour…' : '⚡ Enregistrer la Happy Hour'}
        </button>
      </form>
    </div>
  )
}

/* ── Panel: Grant Bonus ──────────────────────────────── */
function GrantBonusPanel() {
  const grantBonus = useGrantBonus()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSuccess(false)
    setError(null)
    const data = new FormData(e.currentTarget)
    const userId = parseInt(data.get('userId') as string, 10)
    const points = parseInt(data.get('points') as string, 10)
    if (isNaN(userId) || isNaN(points) || points < 1) {
      setError('Identifiant joueur et points requis (points ≥ 1).')
      return
    }
    try {
      await grantBonus.mutateAsync({
        userId,
        points,
        reason: (data.get('reason') as string) || undefined,
      })
      setSuccess(true)
      ;(e.target as HTMLFormElement).reset()
    } catch {
      setError('Erreur lors de l\'attribution du bonus. Vérifiez l\'ID du joueur.')
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Attribuer des points bonus</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="userId">Identifiant du joueur (ID) *</label>
          <input className={styles.input} id="userId" name="userId" type="number" min="1" required placeholder="ex: 42" />
          <span className={styles.hint}>L'ID numérique du joueur dans la base de données.</span>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="points">Nombre de points *</label>
          <input className={styles.input} id="points" name="points" type="number" min="1" required placeholder="ex: 100" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="reason">Raison (optionnel)</label>
          <input className={styles.input} id="reason" name="reason" type="text" maxLength={255} placeholder="ex: Prix fair-play" />
        </div>
        {success && <p className={styles.success} role="status">✅ Bonus attribué avec succès !</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" className={styles.submitBtn} disabled={grantBonus.isPending}>
          {grantBonus.isPending ? 'Attribution…' : '🎁 Attribuer le bonus'}
        </button>
      </form>
    </div>
  )
}

/* ── Main AdminPage ──────────────────────────────────── */
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('create-game')

  return (
    <div className={styles.page}>
      <SEOHead
        title="Administration"
        description="Interface administrateur — Extia Gaming 24h."
        canonicalPath="/admin"
      />

      <h1 className={styles.title}>Administration</h1>
      <p className={styles.subtitle}>Gérez les jeux, les modes de partie et les scores.</p>

      <div className={styles.tabList} role="tablist" aria-label="Sections d'administration">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'create-game' && <CreateGamePanel />}
        {activeTab === 'add-game-type' && <AddGameTypePanel />}
        {activeTab === 'happy-hour' && <HappyHourPanel />}
        {activeTab === 'bonus' && <GrantBonusPanel />}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
cd packages/client && pnpm test src/__tests__/AdminPage.test.tsx
```

Expected: All 6 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/pages/AdminPage.tsx packages/client/src/pages/AdminPage.module.css packages/client/src/__tests__/AdminPage.test.tsx
git commit -m "feat(client): AdminPage with tabbed panels (game, type, happy hour, bonus)"
```

---

### Task 12: PrivacyPage + ErrorBoundary + NotFoundPage

**Files:**
- Create: `packages/client/src/pages/PrivacyPage.tsx`
- Create: `packages/client/src/pages/PrivacyPage.module.css`
- Create: `packages/client/src/components/ErrorBoundary.tsx`
- Create: `packages/client/src/components/ErrorBoundary.module.css`
- Modify: `packages/client/src/pages/NotFoundPage.tsx`
- Create: `packages/client/src/pages/NotFoundPage.module.css`
- Create: `packages/client/src/__tests__/ErrorBoundary.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `packages/client/src/__tests__/ErrorBoundary.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils.tsx'
import ErrorBoundary from '../components/ErrorBoundary.tsx'

// Suppress console.error for expected error boundary logs
vi.spyOn(console, 'error').mockImplementation(() => {})

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error')
  return <div>OK</div>
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('OK')).toBeInTheDocument()
  })

  it('renders error UI when child throws', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByRole('heading', { name: /erreur/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /accueil/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/client && pnpm test src/__tests__/ErrorBoundary.test.tsx
```

Expected: FAIL — `ErrorBoundary` not found.

- [ ] **Step 3: Create ErrorBoundary.module.css**

```css
/* packages/client/src/components/ErrorBoundary.module.css */

.container {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
  padding: 48px var(--page-padding);
  text-align: center;
}

.icon {
  font-size: 4rem;
  line-height: 1;
}

.title {
  font-size: var(--text-2xl);
  font-weight: 700;
}

.message {
  color: var(--text-muted);
  max-width: 480px;
  font-size: var(--text-sm);
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.homeLink {
  padding: 10px 22px;
  background: var(--color-accent);
  color: var(--text-on-accent);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  text-decoration: none;
  transition: background var(--transition);
}

.homeLink:hover {
  background: var(--color-accent-hover);
  text-decoration: none;
}

.retryBtn {
  padding: 10px 22px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}

.retryBtn:hover {
  border-color: var(--border-color-hover);
  color: var(--text-primary);
}
```

- [ ] **Step 4: Create ErrorBoundary.tsx**

```tsx
// packages/client/src/components/ErrorBoundary.tsx
import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Link } from 'react-router-dom'
import styles from './ErrorBoundary.module.css'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container} role="main">
          <div className={styles.icon} aria-hidden="true">💥</div>
          <h1 className={styles.title}>Une erreur est survenue</h1>
          <p className={styles.message}>
            Quelque chose s'est mal passé. L'équipe a été notifiée.
            {this.state.error?.message && (
              <><br /><code style={{ fontSize: '0.75rem', opacity: 0.6 }}>{this.state.error.message}</code></>
            )}
          </p>
          <div className={styles.actions}>
            <button className={styles.retryBtn} onClick={this.handleRetry} type="button">
              Réessayer
            </button>
            <Link to="/" className={styles.homeLink}>
              Retour à l'accueil
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
```

- [ ] **Step 5: Create PrivacyPage.module.css**

```css
/* packages/client/src/pages/PrivacyPage.module.css */

.page {
  max-width: 760px;
  margin: 0 auto;
  padding: 48px var(--page-padding);
}

.title {
  font-size: var(--text-3xl);
  font-weight: 800;
  margin-bottom: 8px;
}

.updated {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-bottom: 40px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section {
  border-left: 3px solid var(--color-accent);
  padding-left: 20px;
}

.sectionTitle {
  font-size: var(--text-xl);
  font-weight: 700;
  margin-bottom: 12px;
}

.text {
  color: var(--text-muted);
  line-height: 1.75;
  font-size: var(--text-sm);
}

.text + .text {
  margin-top: 10px;
}

.list {
  color: var(--text-muted);
  font-size: var(--text-sm);
  line-height: 1.75;
  padding-left: 20px;
  list-style: disc;
}

.contact {
  margin-top: 40px;
  padding: 24px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  color: var(--text-muted);
}
```

- [ ] **Step 6: Create PrivacyPage.tsx**

```tsx
// packages/client/src/pages/PrivacyPage.tsx
import SEOHead from '../components/SEOHead.tsx'
import styles from './PrivacyPage.module.css'

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <SEOHead
        title="Politique de confidentialité"
        description="Politique de confidentialité de l'événement Extia Gaming 24h."
        canonicalPath="/politique-de-confidentialite"
      />

      <h1 className={styles.title}>Politique de confidentialité</h1>
      <p className={styles.updated}>Dernière mise à jour : avril 2026</p>

      <div className={styles.content}>
        <section className={styles.section} aria-labelledby="intro-title">
          <h2 className={styles.sectionTitle} id="intro-title">Introduction</h2>
          <p className={styles.text}>
            Dans le cadre de l'événement <strong>Extia Gaming 24h</strong>, nous collectons et traitons
            vos données personnelles conformément au Règlement Général sur la Protection des Données
            (RGPD — Règlement UE 2016/679) et à la loi Informatique et Libertés.
          </p>
          <p className={styles.text}>
            En créant un compte sur cette plateforme, vous consentez expressément au traitement de
            vos données dans les conditions décrites ci-dessous.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="data-title">
          <h2 className={styles.sectionTitle} id="data-title">Données collectées</h2>
          <p className={styles.text}>Nous collectons les informations suivantes :</p>
          <ul className={styles.list}>
            <li>Nom et prénom</li>
            <li>Adresse email</li>
            <li>Pseudo (login) choisi par l'utilisateur</li>
            <li>Statut interne/externe Extia</li>
            <li>Scores et résultats de parties</li>
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="purpose-title">
          <h2 className={styles.sectionTitle} id="purpose-title">Finalités du traitement</h2>
          <p className={styles.text}>Vos données sont utilisées exclusivement pour :</p>
          <ul className={styles.list}>
            <li>Gérer votre inscription et authentification à l'événement</li>
            <li>Afficher les classements et scores sur la plateforme</li>
            <li>Attribuer des récompenses et trophées</li>
            <li>Organiser et animer l'événement</li>
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="retention-title">
          <h2 className={styles.sectionTitle} id="retention-title">Durée de conservation</h2>
          <p className={styles.text}>
            Vos données sont conservées pendant la durée de l'événement et supprimées dans un délai
            de <strong>90 jours</strong> après la clôture de celui-ci, sauf obligation légale contraire.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="rights-title">
          <h2 className={styles.sectionTitle} id="rights-title">Vos droits</h2>
          <p className={styles.text}>
            Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
          </p>
          <ul className={styles.list}>
            <li><strong>Droit d'accès</strong> — consulter les données que nous détenons sur vous</li>
            <li><strong>Droit de rectification</strong> — corriger vos informations via la page Profil</li>
            <li><strong>Droit à l'effacement</strong> — demander la suppression de votre compte</li>
            <li><strong>Droit d'opposition</strong> — vous opposer au traitement de vos données</li>
            <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="security-title">
          <h2 className={styles.sectionTitle} id="security-title">Sécurité</h2>
          <p className={styles.text}>
            Vos mots de passe sont chiffrés avec bcrypt (12 rounds) et ne sont jamais stockés en clair.
            Les communications sont protégées par HTTPS. Les tokens d'authentification sont stockés
            dans des cookies <code>httpOnly; Secure; SameSite=Strict</code>, inaccessibles aux scripts.
          </p>
        </section>

        <div className={styles.contact}>
          <strong>Contact DPO</strong><br />
          Pour exercer vos droits ou pour toute question relative à vos données personnelles,
          contactez-nous à : <a href="mailto:dpo@extia.fr" style={{ color: 'var(--color-accent)' }}>dpo@extia.fr</a>
          <br /><br />
          Vous pouvez également adresser une réclamation à la{' '}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-secondary)' }}>CNIL</a>.
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create NotFoundPage.module.css**

```css
/* packages/client/src/pages/NotFoundPage.module.css */

.page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
  padding: 48px var(--page-padding);
  text-align: center;
}

.icon {
  font-size: 5rem;
  line-height: 1;
}

.code {
  font-size: clamp(4rem, 10vw, 8rem);
  font-weight: 800;
  color: var(--color-accent);
  line-height: 1;
  opacity: 0.3;
}

.title {
  font-size: var(--text-2xl);
  font-weight: 700;
}

.message {
  color: var(--text-muted);
  max-width: 400px;
  font-size: var(--text-sm);
}

.link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 22px;
  background: var(--color-accent);
  color: var(--text-on-accent);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  margin-top: 8px;
  transition: background var(--transition), box-shadow var(--transition);
  text-decoration: none !important;
}

.link:hover {
  background: var(--color-accent-hover);
  box-shadow: var(--shadow-glow);
}
```

- [ ] **Step 8: Update NotFoundPage.tsx**

```tsx
// packages/client/src/pages/NotFoundPage.tsx
import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead.tsx'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <SEOHead
        title="Page introuvable"
        description="La page que vous cherchez n'existe pas."
        canonicalPath="/404"
      />

      <div className={styles.code} aria-hidden="true">404</div>
      <h1 className={styles.title}>Page introuvable</h1>
      <p className={styles.message}>
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Link to="/" className={styles.link}>
        ← Retour à l'accueil
      </Link>
    </div>
  )
}
```

- [ ] **Step 9: Run tests**

```bash
cd packages/client && pnpm test src/__tests__/ErrorBoundary.test.tsx
```

Expected: 2 tests pass.

- [ ] **Step 10: Commit**

```bash
git add packages/client/src/components/ErrorBoundary.tsx packages/client/src/components/ErrorBoundary.module.css packages/client/src/pages/PrivacyPage.tsx packages/client/src/pages/PrivacyPage.module.css packages/client/src/pages/NotFoundPage.tsx packages/client/src/pages/NotFoundPage.module.css packages/client/src/__tests__/ErrorBoundary.test.tsx
git commit -m "feat(client): ErrorBoundary, PrivacyPage, styled NotFoundPage"
```

---

### Task 13: App Router — Wire All Routes

**Files:**
- Modify: `packages/client/src/App.tsx`
- Modify: `packages/client/src/main.tsx` (wrap with ErrorBoundary)
- Create: `packages/client/src/__tests__/App.test.tsx` (replace existing)

- [ ] **Step 1: Write failing tests**

Replace `packages/client/src/__tests__/App.test.tsx` with:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils.tsx'
import App from '../App.tsx'

vi.mock('../hooks/useAuth.ts', () => ({
  useAuth: () => ({ user: null, isLoading: false, logout: vi.fn() }),
}))

// Mock all page components to avoid their data dependencies
vi.mock('../pages/HomePage.tsx', () => ({ default: () => <div>HomePage</div> }))
vi.mock('../pages/LoginPage.tsx', () => ({ default: () => <div>LoginPage</div> }))
vi.mock('../pages/RegisterPage.tsx', () => ({ default: () => <div>RegisterPage</div> }))
vi.mock('../pages/GamesPage.tsx', () => ({ default: () => <div>GamesPage</div> }))
vi.mock('../pages/GameDetailPage.tsx', () => ({ default: () => <div>GameDetailPage</div> }))
vi.mock('../pages/PlayGamePage.tsx', () => ({ default: () => <div>PlayGamePage</div> }))
vi.mock('../pages/ProfilePage.tsx', () => ({ default: () => <div>ProfilePage</div> }))
vi.mock('../pages/AdminPage.tsx', () => ({ default: () => <div>AdminPage</div> }))
vi.mock('../pages/PrivacyPage.tsx', () => ({ default: () => <div>PrivacyPage</div> }))
vi.mock('../pages/NotFoundPage.tsx', () => ({ default: () => <div>NotFoundPage</div> }))

describe('App routing', () => {
  it('renders HomePage at /', () => {
    renderWithProviders(<App />, { initialEntries: ['/'] })
    expect(screen.getByText('HomePage')).toBeInTheDocument()
  })

  it('renders LoginPage at /login', () => {
    renderWithProviders(<App />, { initialEntries: ['/login'] })
    expect(screen.getByText('LoginPage')).toBeInTheDocument()
  })

  it('renders RegisterPage at /register', () => {
    renderWithProviders(<App />, { initialEntries: ['/register'] })
    expect(screen.getByText('RegisterPage')).toBeInTheDocument()
  })

  it('renders GamesPage at /jeux', () => {
    renderWithProviders(<App />, { initialEntries: ['/jeux'] })
    expect(screen.getByText('GamesPage')).toBeInTheDocument()
  })

  it('renders PrivacyPage at /politique-de-confidentialite', () => {
    renderWithProviders(<App />, { initialEntries: ['/politique-de-confidentialite'] })
    expect(screen.getByText('PrivacyPage')).toBeInTheDocument()
  })

  it('renders NotFoundPage for unknown routes', () => {
    renderWithProviders(<App />, { initialEntries: ['/does-not-exist'] })
    expect(screen.getByText('NotFoundPage')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/client && pnpm test src/__tests__/App.test.tsx
```

Expected: FAIL — routes `/register`, `/jeux`, etc. not registered.

- [ ] **Step 3: Update App.tsx**

```tsx
// packages/client/src/App.tsx
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'
import GamesPage from './pages/GamesPage.tsx'
import GameDetailPage from './pages/GameDetailPage.tsx'
import PlayGamePage from './pages/PlayGamePage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import AdminPage from './pages/AdminPage.tsx'
import PrivacyPage from './pages/PrivacyPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/jeux" element={<GamesPage />} />
        <Route path="/jeux/:id" element={<GameDetailPage />} />
        <Route path="/politique-de-confidentialite" element={<PrivacyPage />} />

        {/* Protected routes — any authenticated user */}
        <Route element={<ProtectedRoute />}>
          <Route path="/jeux/:id/jouer" element={<PlayGamePage />} />
          <Route path="/profil" element={<ProfilePage />} />
        </Route>

        {/* Protected routes — admin only */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 4: Update ProtectedRoute to accept requiredRole prop**

Read current `ProtectedRoute.tsx`, then update:

```tsx
// packages/client/src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'user'
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div
        style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}
        aria-live="polite"
      >
        Chargement…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole === 'admin' && user.role?.name !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
```

- [ ] **Step 5: Update main.tsx to wrap app with ErrorBoundary**

```tsx
// packages/client/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './contexts/AuthContext.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
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
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
```

- [ ] **Step 6: Run tests**

```bash
cd packages/client && pnpm test src/__tests__/App.test.tsx
```

Expected: All 6 tests pass.

- [ ] **Step 7: Run full test suite**

```bash
cd packages/client && pnpm test
```

Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add packages/client/src/App.tsx packages/client/src/main.tsx packages/client/src/components/ProtectedRoute.tsx packages/client/src/__tests__/App.test.tsx
git commit -m "feat(client): wire all routes in App.tsx — public, protected, admin"
```

---

## Self-Review

**Spec coverage:**
- ✅ Home — top 5 games + player leaderboard → `HomePage` with `useTopGames(5)` + `useGlobalLeaderboard(20)`
- ✅ Games list with clickable images → `GamesPage` + `GameCard` (Link wraps whole card)
- ✅ Game detail — player ranking, total points, link to play form → `GameDetailPage`
- ✅ Game play form pre-filled from URL params → `PlayGamePage` with `useSearchParams`
- ✅ User profile edit → `ProfilePage`
- ✅ Login page → `LoginPage` (styled)
- ✅ Register page → `RegisterPage`
- ✅ Admin interface — add game, add type, happy hour, bonus → `AdminPage` (4 tabs)
- ✅ Error page → `NotFoundPage` (styled 404) + `ErrorBoundary` (runtime errors)
- ✅ Privacy policy with consent → `PrivacyPage` + consent checkbox in `RegisterPage`
- ✅ Admin point bonuses → "Bonus de points" tab in `AdminPage`

**No placeholders found.**

**Type consistency:**
- `GameWithScore` defined in `useGames.ts`, used in `GameCard`, `GamesPage` — consistent
- `RankedEntry` defined in `useLeaderboard.ts`, used in `PlayerLeaderboard`, `HomePage` — consistent
- `GameDetail` extends `GameWithScore`, used in `GameDetailPage` — consistent
- `Tab` type `'create-game' | 'add-game-type' | 'happy-hour' | 'bonus'` local to `AdminPage` — consistent
- `ProtectedRoute.requiredRole` accepts `'admin' | 'user'`, App passes `'admin'` — consistent
