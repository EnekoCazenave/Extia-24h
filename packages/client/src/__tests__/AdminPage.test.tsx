import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils.tsx'
import AdminPage from '../pages/AdminPage.tsx'

vi.mock('../hooks/useAdmin.ts', () => ({
  useCreateGame: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGame: (_id: number) => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteGame: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAddGameType: (_id: number) => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateGameType: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteGameType: () => ({ mutateAsync: vi.fn(), isPending: false }),
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

  it('renders 4 tabs (no happy hour)', () => {
    renderWithProviders(<AdminPage />)
    expect(screen.getByRole('tab', { name: /^jeux$/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /type de partie/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /bonus de points/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /associations/i })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /happy hour/i })).not.toBeInTheDocument()
  })

  it('shows games list by default with add button', () => {
    renderWithProviders(<AdminPage />)
    expect(screen.getByRole('button', { name: /\+ ajouter/i })).toBeInTheDocument()
    expect(screen.getByText('League of Legends')).toBeInTheDocument()
  })

  it('switches to game types tab', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminPage />)
    await user.click(screen.getByRole('tab', { name: /type de partie/i }))
    expect(screen.getByRole('heading', { name: /types de partie/i })).toBeInTheDocument()
  })

  it('switches to bonus tab', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminPage />)
    await user.click(screen.getByRole('tab', { name: /bonus de points/i }))
    expect(screen.getByLabelText(/identifiant du joueur/i)).toBeInTheDocument()
  })
})
