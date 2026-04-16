import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils.tsx'
import App from '../App.tsx'

vi.mock('../hooks/useAuth.ts', () => ({
  useAuth: () => ({ user: null, isLoading: false, logout: vi.fn() }),
}))

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
