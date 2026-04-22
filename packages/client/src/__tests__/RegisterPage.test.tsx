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
    expect(screen.getByLabelText(/prénom/i, { selector: 'input[type="text"]' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^nom/i, { selector: 'input[type="text"]' })).toBeInTheDocument()
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
    await user.type(screen.getByLabelText(/prénom/i, { selector: 'input[type="text"]' }), 'Alice')
    await user.type(screen.getByLabelText(/^nom/i, { selector: 'input[type="text"]' }), 'Dupont')
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

  it('shows error on registration failure (409)', async () => {
    mockRegister.mockRejectedValue({ response: { status: 409 } })
    const user = userEvent.setup()
    renderWithProviders(<RegisterPage />)

    await user.type(screen.getByLabelText(/pseudo/i), 'alice42')
    await user.type(screen.getByLabelText(/prénom/i, { selector: 'input[type="text"]' }), 'Alice')
    await user.type(screen.getByLabelText(/^nom/i, { selector: 'input[type="text"]' }), 'Dupont')
    await user.type(screen.getByLabelText(/adresse email/i), 'alice@test.com')
    await user.type(screen.getByLabelText(/mot de passe/i), 'Password1!')
    await user.click(screen.getByRole('checkbox', { name: /politique de confidentialité/i }))
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/email déjà utilisé/i)
    )
  })
})
