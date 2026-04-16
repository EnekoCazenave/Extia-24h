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
    const adminLinks = screen.getAllByRole('link', { name: /admin/i })
    expect(adminLinks.some((el) => el.getAttribute('href') === '/admin')).toBe(true)
  })
})
