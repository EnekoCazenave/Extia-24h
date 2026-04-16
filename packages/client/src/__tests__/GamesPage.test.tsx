import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils.tsx'
import GamesPage from '../pages/GamesPage.tsx'

const mockUseGames = vi.fn()

vi.mock('../hooks/useGames.ts', () => ({
  useGames: () => mockUseGames(),
}))

describe('GamesPage', () => {
  beforeEach(() => {
    mockUseGames.mockReturnValue({ data: undefined, isLoading: true, isError: false })
  })

  it('renders page heading', () => {
    renderWithProviders(<GamesPage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('shows loading state', () => {
    renderWithProviders(<GamesPage />)
    expect(screen.getByText(/chargement/i)).toBeInTheDocument()
  })

  it('renders game cards when loaded', () => {
    mockUseGames.mockReturnValue({
      data: [
        { id: 1, nom: 'League of Legends', imageUrl: null, gameTypes: [{ id: 1, name: '5v5' }], totalScore: 100, happyHourStart: null, happyHourEnd: null },
        { id: 2, nom: 'Échecs', imageUrl: null, gameTypes: [{ id: 2, name: 'Blitz' }], totalScore: 50, happyHourStart: null, happyHourEnd: null },
      ],
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<GamesPage />)
    expect(screen.getByText('League of Legends')).toBeInTheDocument()
    expect(screen.getByText('Échecs')).toBeInTheDocument()
  })

  it('shows happy hour badge when active', () => {
    const now = new Date()
    const start = new Date(now.getTime() - 10 * 60 * 1000).toISOString()
    const end = new Date(now.getTime() + 50 * 60 * 1000).toISOString()
    mockUseGames.mockReturnValue({
      data: [
        { id: 1, nom: 'League of Legends', imageUrl: null, gameTypes: [], totalScore: 0, happyHourStart: start, happyHourEnd: end },
      ],
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<GamesPage />)
    expect(screen.getByText(/happy hour/i)).toBeInTheDocument()
  })
})
