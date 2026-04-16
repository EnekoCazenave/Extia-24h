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
