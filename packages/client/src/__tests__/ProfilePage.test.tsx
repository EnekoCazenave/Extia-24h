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
    mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, updateUser: vi.fn() })
  })

  it('renders profile heading', () => {
    renderWithProviders(<ProfilePage />)
    expect(screen.getByRole('heading', { name: /mon profil/i })).toBeInTheDocument()
  })

  it('retire le consentement aux statistiques en une action', async () => {
    const { api } = await import('../services/api.ts')
    const updateUser = vi.fn()
    mockUseAuth.mockReturnValue({ user: { ...mockUser, statisticsConsent: true }, updateUser })
    vi.mocked(api.put).mockResolvedValue({ data: { user: { ...mockUser, statisticsConsent: false } } })
    renderWithProviders(<ProfilePage />)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retirer mon consentement' }))
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/api/users/me', { statisticsConsent: false }))
    expect(await screen.findByText('Votre choix a été enregistré.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Autoriser les statistiques' })).toBeInTheDocument()
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ statisticsConsent: false }))
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
