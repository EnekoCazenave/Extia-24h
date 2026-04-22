# Frontend — Plan 4/5 : Protected Pages (Play Form + Profile)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build PlayGamePage (game submission form pre-filled from URL params) and ProfilePage (user info edit form).

**Prerequisites:** Plans 1–3 complete. Backend `POST /api/play` and `PUT /api/users/me` routes live.

**Architecture:** Both pages are behind `<ProtectedRoute>`. `PlayGamePage` reads `gameTypeId` from `URLSearchParams` and the game `id` from route params to pre-fill the form. On success, navigate back to the game detail. `ProfilePage` uses the authenticated user from `useAuth()`.

**Tech Stack:** React 18, React Router v6, TanStack Query v5 mutations, CSS Modules

**Working directory:** `.worktrees/foundation/` — all paths relative to monorepo root.

---

## File Structure

```
packages/client/src/
├── pages/
│   ├── PlayGamePage.tsx            CREATE
│   ├── PlayGamePage.module.css     CREATE
│   ├── ProfilePage.tsx             CREATE
│   └── ProfilePage.module.css      CREATE
└── __tests__/
    ├── PlayGamePage.test.tsx        CREATE
    └── ProfilePage.test.tsx         CREATE
```

---

### Task 9: PlayGamePage — Score Submission Form

**Files:**
- Create: `packages/client/src/pages/PlayGamePage.tsx`
- Create: `packages/client/src/pages/PlayGamePage.module.css`
- Create: `packages/client/src/__tests__/PlayGamePage.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `packages/client/src/__tests__/PlayGamePage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils.tsx'
import PlayGamePage from '../pages/PlayGamePage.tsx'

const mockUseGame = vi.fn()
const mockUseSubmitPlay = vi.fn()
const mockUseParams = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../hooks/useGames.ts', () => ({
  useGame: (id: number) => mockUseGame(id),
  useSubmitPlay: () => mockUseSubmitPlay(),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockNavigate,
    // useSearchParams needs URL with ?gameTypeId=1
  }
})

const mockGame = {
  id: 1,
  nom: 'League of Legends',
  imageUrl: null,
  happyHourStart: null,
  happyHourEnd: null,
  gameTypes: [
    { id: 1, name: '5v5 Classique', calcul: 'Best of 3', win: 'Nexus', team: true, videoGameId: 1 },
    { id: 2, name: 'ARAM', calcul: '1 partie', win: 'Nexus', team: true, videoGameId: 1 },
  ],
  totalScore: 0,
  rankings: [],
}

describe('PlayGamePage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: '1' })
    mockUseGame.mockReturnValue({ data: mockGame, isLoading: false, isError: false })
    mockUseSubmitPlay.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: 1, score: 100, happyHourApplied: false, originalScore: 100 }),
      isPending: false,
    })
    mockNavigate.mockReset()
  })

  it('renders heading', () => {
    renderWithProviders(<PlayGamePage />, { initialEntries: ['/jeux/1/jouer?gameTypeId=1'] })
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders game type selector', () => {
    renderWithProviders(<PlayGamePage />, { initialEntries: ['/jeux/1/jouer?gameTypeId=1'] })
    expect(screen.getByLabelText(/mode de jeu/i)).toBeInTheDocument()
  })

  it('renders score input', () => {
    renderWithProviders(<PlayGamePage />, { initialEntries: ['/jeux/1/jouer?gameTypeId=1'] })
    expect(screen.getByLabelText(/score/i)).toBeInTheDocument()
  })

  it('calls submitPlay on form submit', async () => {
    const mockMutate = vi.fn().mockResolvedValue({ id: 1, score: 100, happyHourApplied: false, originalScore: 100 })
    mockUseSubmitPlay.mockReturnValue({ mutateAsync: mockMutate, isPending: false })

    const user = userEvent.setup()
    renderWithProviders(<PlayGamePage />, { initialEntries: ['/jeux/1/jouer?gameTypeId=1'] })

    await user.clear(screen.getByLabelText(/score/i))
    await user.type(screen.getByLabelText(/score/i), '250')
    await user.click(screen.getByRole('button', { name: /soumettre/i }))

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ score: 250 })
      )
    )
  })

  it('shows success message after submit', async () => {
    const mockMutate = vi.fn().mockResolvedValue({ id: 1, score: 100, happyHourApplied: false, originalScore: 100 })
    mockUseSubmitPlay.mockReturnValue({ mutateAsync: mockMutate, isPending: false })

    const user = userEvent.setup()
    renderWithProviders(<PlayGamePage />, { initialEntries: ['/jeux/1/jouer?gameTypeId=1'] })

    await user.type(screen.getByLabelText(/score/i), '100')
    await user.click(screen.getByRole('button', { name: /soumettre/i }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toBeInTheDocument()
    )
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/client && pnpm test src/__tests__/PlayGamePage.test.tsx
```

Expected: FAIL — `PlayGamePage` not found.

- [ ] **Step 3: Create PlayGamePage.module.css**

```css
/* packages/client/src/pages/PlayGamePage.module.css */

.page {
  max-width: 600px;
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
  text-decoration: none;
}

.back:hover {
  color: var(--text-primary);
}

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 36px;
}

.title {
  font-size: var(--text-2xl);
  font-weight: 700;
  margin-bottom: 6px;
}

.gameName {
  color: var(--color-accent);
  font-size: var(--text-base);
  font-weight: 500;
  margin-bottom: 28px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 22px;
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

.required::after {
  content: ' *';
  color: var(--color-accent);
}

.select,
.input {
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  padding: 11px 14px;
  width: 100%;
  transition: border-color var(--transition), box-shadow var(--transition);
  font-family: inherit;
}

.select {
  appearance: none;
  cursor: pointer;
}

.select:focus,
.input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.15);
}

.happyHour {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(249, 115, 22, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  font-size: var(--text-sm);
  color: #f59e0b;
  font-weight: 600;
}

.submitBtn {
  width: 100%;
  padding: 13px;
  background: var(--color-accent);
  color: var(--text-on-accent);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
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
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: var(--radius-md);
  padding: 16px;
  color: var(--color-success);
  font-weight: 600;
  text-align: center;
}

.successBonus {
  font-size: var(--text-sm);
  margin-top: 4px;
  color: #f59e0b;
}

.error {
  color: var(--color-error);
  font-size: var(--text-sm);
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-md);
}
```

- [ ] **Step 4: Create PlayGamePage.tsx**

```tsx
// packages/client/src/pages/PlayGamePage.tsx
import { useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import SEOHead from '../components/SEOHead.tsx'
import { useGame, useSubmitPlay } from '../hooks/useGames.ts'
import styles from './PlayGamePage.module.css'

function isHappyHourActive(start: string | null, end: string | null): boolean {
  if (!start || !end) return false
  const now = new Date()
  return now >= new Date(start) && now <= new Date(end)
}

interface SubmitResult {
  score: number
  happyHourApplied: boolean
  originalScore: number
}

export default function PlayGamePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const gameId = parseInt(id ?? '0', 10)
  const preselectedGameTypeId = parseInt(searchParams.get('gameTypeId') ?? '0', 10)

  const { data: game, isLoading } = useGame(gameId)
  const submitPlay = useSubmitPlay()

  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)

  const happyHour = game ? isHappyHourActive(game.happyHourStart, game.happyHourEnd) : false

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setResult(null)

    const data = new FormData(e.currentTarget)
    const gameTypeId = parseInt(data.get('gameTypeId') as string, 10)
    const score = parseInt(data.get('score') as string, 10)

    if (isNaN(gameTypeId) || isNaN(score) || score < 0) {
      setError('Veuillez remplir tous les champs correctement.')
      return
    }

    try {
      const session = await submitPlay.mutateAsync({ gameTypeId, score })
      setResult(session)
    } catch {
      setError('Une erreur est survenue lors de la soumission. Veuillez réessayer.')
    }
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--text-muted)' }} aria-live="polite">Chargement…</p>
      </div>
    )
  }

  if (!game) {
    return (
      <div className={styles.page}>
        <p style={{ color: 'var(--color-error)' }} role="alert">Jeu introuvable.</p>
        <Link to="/jeux" className={styles.back}>← Retour aux jeux</Link>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <SEOHead
        title={`Soumettre une partie — ${game.nom}`}
        description={`Entrez votre score pour ${game.nom}.`}
        canonicalPath={`/jeux/${game.id}/jouer`}
      />

      <Link to={`/jeux/${game.id}`} className={styles.back}>
        ← Retour au jeu
      </Link>

      <div className={styles.card}>
        <h1 className={styles.title}>Soumettre une partie</h1>
        <p className={styles.gameName}>🎮 {game.nom}</p>

        {happyHour && (
          <div className={styles.happyHour} role="status" aria-live="polite">
            ⚡ Happy Hour active — votre score sera doublé !
          </div>
        )}

        {result ? (
          <div className={styles.success} role="status" aria-live="polite">
            <div>✅ Score soumis avec succès !</div>
            <div>Score final : <strong>{result.score.toLocaleString('fr-FR')} pts</strong></div>
            {result.happyHourApplied && (
              <div className={styles.successBonus}>
                ⚡ Bonus Happy Hour appliqué — score original : {result.originalScore.toLocaleString('fr-FR')} pts
              </div>
            )}
            <div style={{ marginTop: '12px' }}>
              <Link to={`/jeux/${game.id}`} style={{ color: 'var(--color-secondary)', fontSize: 'var(--text-sm)' }}>
                Voir le classement →
              </Link>
            </div>
          </div>
        ) : (
          <form
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
            aria-label={`Formulaire de soumission pour ${game.nom}`}
          >
            <div className={styles.field}>
              <label className={`${styles.label} ${styles.required}`} htmlFor="gameTypeId">
                Mode de jeu
              </label>
              <select
                className={styles.select}
                id="gameTypeId"
                name="gameTypeId"
                defaultValue={preselectedGameTypeId || game.gameTypes[0]?.id}
                required
                aria-required="true"
              >
                {game.gameTypes.map((gt) => (
                  <option key={gt.id} value={gt.id}>
                    {gt.name}{gt.team ? ' (équipe)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={`${styles.label} ${styles.required}`} htmlFor="score">
                Score obtenu
                {happyHour && <span style={{ color: '#f59e0b', marginLeft: '6px' }}>× 2</span>}
              </label>
              <input
                className={styles.input}
                id="score"
                name="score"
                type="number"
                min="0"
                step="1"
                required
                aria-required="true"
                placeholder="ex: 1500"
              />
            </div>

            {error && (
              <p className={styles.error} role="alert" aria-live="assertive">
                {error}
              </p>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitPlay.isPending}
            >
              {submitPlay.isPending ? 'Envoi…' : '🏅 Soumettre ma partie'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
cd packages/client && pnpm test src/__tests__/PlayGamePage.test.tsx
```

Expected: All 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/pages/PlayGamePage.tsx packages/client/src/pages/PlayGamePage.module.css packages/client/src/__tests__/PlayGamePage.test.tsx
git commit -m "feat(client): PlayGamePage — score submission form with happy hour indicator"
```

---

### Task 10: ProfilePage — Edit User Info

**Files:**
- Create: `packages/client/src/pages/ProfilePage.tsx`
- Create: `packages/client/src/pages/ProfilePage.module.css`
- Create: `packages/client/src/__tests__/ProfilePage.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `packages/client/src/__tests__/ProfilePage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils.tsx'
import ProfilePage from '../pages/ProfilePage.tsx'

const mockUseAuth = vi.fn()

vi.mock('../hooks/useAuth.ts', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../services/api.ts', () => ({
  api: { put: vi.fn() },
}))

const mockUser = {
  id: 1,
  login: 'alice42',
  email: 'alice@test.com',
  firstname: 'Alice',
  lastname: 'Doe',
  intern: false,
  role: { id: 1, name: 'user' },
}

describe('ProfilePage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false })
  })

  it('renders profile heading', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByRole('heading', { name: /mon profil/i })).toBeInTheDocument()
  })

  it('pre-fills form with current user data', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByDisplayValue('alice42')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
  })

  it('shows email as read-only', () => {
    renderWithProviders(<ProfilePage />)
    const emailInput = screen.getByDisplayValue('alice@test.com')
    expect(emailInput).toHaveAttribute('readonly')
  })

  it('shows save button', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeInTheDocument()
  })

  it('calls PUT /api/users/me on submit', async () => {
    const { api } = await import('../services/api.ts')
    vi.mocked(api.put).mockResolvedValue({ data: { user: { ...mockUser, login: 'alice_new' } } })

    const user = userEvent.setup()
    renderWithProviders(<ProfilePage />)

    const loginInput = screen.getByDisplayValue('alice42')
    await user.clear(loginInput)
    await user.type(loginInput, 'alice_new')
    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith(
        '/api/users/me',
        expect.objectContaining({ login: 'alice_new' })
      )
    )
  })

  it('shows success message after save', async () => {
    const { api } = await import('../services/api.ts')
    vi.mocked(api.put).mockResolvedValue({ data: { user: mockUser } })

    const user = userEvent.setup()
    renderWithProviders(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toBeInTheDocument()
    )
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/client && pnpm test src/__tests__/ProfilePage.test.tsx
```

Expected: FAIL — `ProfilePage` not found.

- [ ] **Step 3: Create ProfilePage.module.css**

```css
/* packages/client/src/pages/ProfilePage.module.css */

.page {
  max-width: 600px;
  margin: 0 auto;
  padding: 48px var(--page-padding);
}

.title {
  font-size: var(--text-3xl);
  font-weight: 800;
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-muted);
  font-size: var(--text-sm);
  margin-bottom: 32px;
}

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 32px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 480px) {
  .row { grid-template-columns: 1fr; }
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

.input {
  background: var(--bg-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  padding: 11px 14px;
  width: 100%;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.15);
}

.inputReadonly {
  opacity: 0.55;
  cursor: not-allowed;
}

.hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: 2px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

.saveBtn {
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

.saveBtn:hover:not(:disabled) {
  background: var(--color-accent-hover);
  box-shadow: var(--shadow-glow);
}

.saveBtn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.success {
  padding: 12px 16px;
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
```

- [ ] **Step 4: Create ProfilePage.tsx**

```tsx
// packages/client/src/pages/ProfilePage.tsx
import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth.ts'
import { api } from '../services/api.ts'
import SEOHead from '../components/SEOHead.tsx'
import type { UserPublic } from '@extia-gaming/shared'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const { user } = useAuth()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user) return null

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSuccess(false)
    setError(null)

    const data = new FormData(e.currentTarget)
    const payload = {
      login: data.get('login') as string,
      firstname: data.get('firstname') as string,
      lastname: data.get('lastname') as string,
    }

    setIsSubmitting(true)
    try {
      await api.put<{ user: UserPublic }>('/api/users/me', payload)
      setSuccess(true)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <SEOHead
        title="Mon profil"
        description="Modifiez vos informations personnelles."
        canonicalPath="/profil"
      />

      <h1 className={styles.title}>Mon profil</h1>
      <p className={styles.subtitle}>Modifiez vos informations de participant.</p>

      <div className={styles.card}>
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          aria-label="Formulaire de modification du profil"
        >
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login">
              Pseudo
            </label>
            <input
              className={styles.input}
              id="login"
              name="login"
              type="text"
              defaultValue={user.login}
              minLength={3}
              maxLength={50}
              required
              autoComplete="username"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="firstname">
                Prénom
              </label>
              <input
                className={styles.input}
                id="firstname"
                name="firstname"
                type="text"
                defaultValue={user.firstname}
                required
                autoComplete="given-name"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="lastname">
                Nom
              </label>
              <input
                className={styles.input}
                id="lastname"
                name="lastname"
                type="text"
                defaultValue={user.lastname}
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Adresse email
            </label>
            <input
              className={`${styles.input} ${styles.inputReadonly}`}
              id="email"
              name="email"
              type="email"
              value={user.email}
              readOnly
              aria-describedby="email-hint"
              autoComplete="email"
            />
            <span id="email-hint" className={styles.hint}>
              L'adresse email ne peut pas être modifiée.
            </span>
          </div>

          {success && (
            <p className={styles.success} role="status" aria-live="polite">
              ✅ Profil mis à jour avec succès.
            </p>
          )}

          {error && (
            <p className={styles.error} role="alert" aria-live="assertive">
              {error}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
cd packages/client && pnpm test src/__tests__/ProfilePage.test.tsx
```

Expected: All 6 tests pass.

- [ ] **Step 6: Run full test suite**

```bash
cd packages/client && pnpm test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/pages/PlayGamePage.tsx packages/client/src/pages/PlayGamePage.module.css packages/client/src/__tests__/PlayGamePage.test.tsx packages/client/src/pages/ProfilePage.tsx packages/client/src/pages/ProfilePage.module.css packages/client/src/__tests__/ProfilePage.test.tsx
git commit -m "feat(client): PlayGamePage and ProfilePage — protected user pages"
```
