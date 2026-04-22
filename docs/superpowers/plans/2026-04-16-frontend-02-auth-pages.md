# Frontend — Plan 2/5 : Auth Pages (Login + Register)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Style the existing LoginPage and create a RegisterPage with consent checkbox for RGPD compliance.

**Prerequisites:** Plan 1/5 complete (design system tokens + test-utils available).

**Architecture:** CSS Modules per page. Auth forms use controlled `<form>` with `FormData`. `useAuth()` hook provides `login()` and `register()`. On success, navigate to `/`.

**Tech Stack:** React 18, React Router v6, CSS Modules

**Working directory:** `.worktrees/foundation/` — all paths relative to monorepo root.

---

## File Structure

```
packages/client/src/
├── pages/
│   ├── LoginPage.tsx           MODIFY  add styles, link to register
│   ├── LoginPage.module.css    CREATE
│   ├── RegisterPage.tsx        CREATE  full registration form + consent
│   └── RegisterPage.module.css CREATE
└── __tests__/
    ├── LoginPage.test.tsx      CREATE
    └── RegisterPage.test.tsx  CREATE
```

---

### Task 4: LoginPage Styled

**Files:**
- Modify: `packages/client/src/pages/LoginPage.tsx`
- Create: `packages/client/src/pages/LoginPage.module.css`
- Create: `packages/client/src/__tests__/LoginPage.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `packages/client/src/__tests__/LoginPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils.tsx'
import LoginPage from '../pages/LoginPage.tsx'

const mockLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../hooks/useAuth.ts', () => ({
  useAuth: () => ({ login: mockLogin, user: null, isLoading: false }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockReset()
    mockNavigate.mockReset()
  })

  it('renders email and password fields', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
  })

  it('renders submit button', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('calls login and navigates on success', async () => {
    mockLogin.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText(/adresse email/i), 'alice@test.com')
    await user.type(screen.getByLabelText(/mot de passe/i), 'password123')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('alice@test.com', 'password123'))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
  })

  it('shows error message on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)

    await user.type(screen.getByLabelText(/adresse email/i), 'bad@test.com')
    await user.type(screen.getByLabelText(/mot de passe/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/email ou mot de passe incorrect/i)
    )
  })

  it('has link to registration page', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('link', { name: /créer un compte/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/client && pnpm test src/__tests__/LoginPage.test.tsx
```

Expected: FAIL — link to register not found, styles missing (no visual failures but link test fails).

- [ ] **Step 3: Create LoginPage.module.css**

```css
/* packages/client/src/pages/LoginPage.module.css */

.page {
  min-height: calc(100vh - var(--header-height));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px var(--page-padding);
}

.card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 40px;
}

.title {
  font-size: var(--text-2xl);
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
}

.subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 32px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.submitBtn {
  width: 100%;
  padding: 12px;
  background: var(--color-accent);
  color: var(--text-on-accent);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition), box-shadow var(--transition);
  margin-top: 8px;
}

.submitBtn:hover:not(:disabled) {
  background: var(--color-accent-hover);
  box-shadow: var(--shadow-glow);
}

.submitBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: var(--color-error);
  font-size: var(--text-sm);
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-md);
}

.footer {
  margin-top: 24px;
  text-align: center;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.footer a {
  color: var(--color-accent);
  font-weight: 600;
}

.footer a:hover {
  color: var(--color-accent-hover);
}
```

- [ ] **Step 4: Update LoginPage.tsx**

```tsx
// packages/client/src/pages/LoginPage.tsx
import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import SEOHead from '../components/SEOHead.tsx'
import styles from './LoginPage.module.css'

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
    <div className={styles.page}>
      <SEOHead
        title="Connexion"
        description="Connectez-vous à l'événement Extia Gaming 24h."
        canonicalPath="/login"
      />

      <div className={styles.card}>
        <h1 className={styles.title} id="login-title">Connexion</h1>
        <p className={styles.subtitle}>Bon retour parmi nous !</p>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
          aria-labelledby="login-title"
        >
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Adresse email
            </label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Mot de passe
            </label>
            <input
              className={styles.input}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          {error && (
            <p
              id="login-error"
              className={styles.error}
              role="alert"
              aria-live="assertive"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className={styles.footer}>
          Pas encore de compte ?{' '}
          <Link to="/register">Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
cd packages/client && pnpm test src/__tests__/LoginPage.test.tsx
```

Expected: All 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/client/src/pages/LoginPage.tsx packages/client/src/pages/LoginPage.module.css packages/client/src/__tests__/LoginPage.test.tsx
git commit -m "feat(client): styled LoginPage with register link"
```

---

### Task 5: RegisterPage with RGPD Consent

**Files:**
- Create: `packages/client/src/pages/RegisterPage.tsx`
- Create: `packages/client/src/pages/RegisterPage.module.css`
- Create: `packages/client/src/__tests__/RegisterPage.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `packages/client/src/__tests__/RegisterPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils.tsx'
import RegisterPage from '../pages/RegisterPage.tsx'

const mockRegister = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../hooks/useAuth.ts', () => ({
  useAuth: () => ({ register: mockRegister, user: null, isLoading: false }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('RegisterPage', () => {
  beforeEach(() => {
    mockRegister.mockReset()
    mockNavigate.mockReset()
  })

  it('renders all required fields', () => {
    renderWithProviders(<RegisterPage />)
    expect(screen.getByLabelText(/pseudo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /politique de confidentialité/i })).toBeInTheDocument()
  })

  it('disables submit when consent not checked', () => {
    renderWithProviders(<RegisterPage />)
    expect(screen.getByRole('button', { name: /créer mon compte/i })).toBeDisabled()
  })

  it('enables submit when consent checked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)
    await user.click(screen.getByRole('checkbox', { name: /politique de confidentialité/i }))
    expect(screen.getByRole('button', { name: /créer mon compte/i })).not.toBeDisabled()
  })

  it('calls register with form data on submit', async () => {
    mockRegister.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await user.type(screen.getByLabelText(/pseudo/i), 'alice42')
    await user.type(screen.getByLabelText(/prénom/i), 'Alice')
    await user.type(screen.getByLabelText(/nom/i), 'Dupont')
    await user.type(screen.getByLabelText(/adresse email/i), 'alice@test.com')
    await user.type(screen.getByLabelText(/mot de passe/i), 'Password1!')
    await user.click(screen.getByRole('checkbox', { name: /politique de confidentialité/i }))
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          login: 'alice42',
          firstname: 'Alice',
          lastname: 'Dupont',
          email: 'alice@test.com',
          password: 'Password1!',
          consentAccepted: true,
        })
      )
    )
  })

  it('shows error on registration failure', async () => {
    mockRegister.mockRejectedValue({ response: { status: 409 } })
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await user.type(screen.getByLabelText(/pseudo/i), 'alice42')
    await user.type(screen.getByLabelText(/prénom/i), 'Alice')
    await user.type(screen.getByLabelText(/nom/i), 'Dupont')
    await user.type(screen.getByLabelText(/adresse email/i), 'alice@test.com')
    await user.type(screen.getByLabelText(/mot de passe/i), 'Password1!')
    await user.click(screen.getByRole('checkbox', { name: /politique de confidentialité/i }))
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/email déjà utilisé/i)
    )
  })
})
```

- [ ] **Step 2: Run to see failure**

```bash
cd packages/client && pnpm test src/__tests__/RegisterPage.test.tsx
```

Expected: FAIL — cannot find `RegisterPage`.

- [ ] **Step 3: Create RegisterPage.module.css**

```css
/* packages/client/src/pages/RegisterPage.module.css */

.page {
  min-height: calc(100vh - var(--header-height));
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px var(--page-padding);
}

.card {
  width: 100%;
  max-width: 480px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 40px;
}

.title {
  font-size: var(--text-2xl);
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
}

.subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 32px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

.consentBox {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  background: rgba(233, 69, 96, 0.05);
  border: 1px solid rgba(233, 69, 96, 0.2);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.consentCheckbox {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.consentLabel {
  font-size: var(--text-sm);
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1.5;
}

.consentLabel a {
  color: var(--color-accent);
  font-weight: 500;
}

.submitBtn {
  width: 100%;
  padding: 12px;
  background: var(--color-accent);
  color: var(--text-on-accent);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition), box-shadow var(--transition);
  margin-top: 4px;
}

.submitBtn:hover:not(:disabled) {
  background: var(--color-accent-hover);
  box-shadow: var(--shadow-glow);
}

.submitBtn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.error {
  color: var(--color-error);
  font-size: var(--text-sm);
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-md);
}

.footer {
  margin-top: 24px;
  text-align: center;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.footer a {
  color: var(--color-accent);
  font-weight: 600;
}
```

- [ ] **Step 4: Create RegisterPage.tsx**

```tsx
// packages/client/src/pages/RegisterPage.tsx
import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import SEOHead from '../components/SEOHead.tsx'
import styles from './RegisterPage.module.css'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!consentChecked) return

    setError(null)
    const data = new FormData(e.currentTarget)

    setIsSubmitting(true)
    try {
      await register({
        login: data.get('login') as string,
        firstname: data.get('firstname') as string,
        lastname: data.get('lastname') as string,
        email: data.get('email') as string,
        password: data.get('password') as string,
        intern: false,
        consentAccepted: true,
      })
      navigate('/')
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status
      if (status === 409) {
        setError('Email déjà utilisé. Essayez de vous connecter.')
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <SEOHead
        title="Créer un compte"
        description="Rejoignez l'événement Extia Gaming 24h."
        canonicalPath="/register"
      />

      <div className={styles.card}>
        <h1 className={styles.title} id="register-title">Créer un compte</h1>
        <p className={styles.subtitle}>Rejoignez l'événement Extia Gaming 24h !</p>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
          noValidate
          aria-labelledby="register-title"
        >
          <div className={styles.field}>
            <label className={`${styles.label} ${styles.required}`} htmlFor="login">
              Pseudo
            </label>
            <input
              className={styles.input}
              id="login"
              name="login"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={50}
              placeholder="Votre pseudo en jeu"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={`${styles.label} ${styles.required}`} htmlFor="firstname">
                Prénom
              </label>
              <input
                className={styles.input}
                id="firstname"
                name="firstname"
                type="text"
                autoComplete="given-name"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={`${styles.label} ${styles.required}`} htmlFor="lastname">
                Nom
              </label>
              <input
                className={styles.input}
                id="lastname"
                name="lastname"
                type="text"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={`${styles.label} ${styles.required}`} htmlFor="email">
              Adresse email
            </label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={`${styles.label} ${styles.required}`} htmlFor="password">
              Mot de passe
            </label>
            <input
              className={styles.input}
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>

          <div className={styles.consentBox}>
            <input
              className={styles.consentCheckbox}
              id="consent"
              name="consent"
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              aria-required="true"
              aria-describedby="consent-desc"
            />
            <label className={styles.consentLabel} htmlFor="consent" id="consent-desc">
              J'ai lu et j'accepte la{' '}
              <Link to="/politique-de-confidentialite" target="_blank" rel="noopener">
                politique de confidentialité
              </Link>
              . Je consens au traitement de mes données personnelles (nom, prénom, email) dans le cadre de l'événement Extia Gaming 24h.
            </label>
          </div>

          {error && (
            <p className={styles.error} role="alert" aria-live="assertive">
              {error}
            </p>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting || !consentChecked}
          >
            {isSubmitting ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className={styles.footer}>
          Déjà inscrit ?{' '}
          <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
cd packages/client && pnpm test src/__tests__/RegisterPage.test.tsx
```

Expected: All 5 tests pass.

- [ ] **Step 6: Run full test suite**

```bash
cd packages/client && pnpm test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/client/src/pages/RegisterPage.tsx packages/client/src/pages/RegisterPage.module.css packages/client/src/__tests__/RegisterPage.test.tsx
git commit -m "feat(client): RegisterPage with RGPD consent checkbox"
```
