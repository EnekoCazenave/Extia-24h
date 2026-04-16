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
