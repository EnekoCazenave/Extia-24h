import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils.tsx'
import HomePage from '../pages/HomePage.tsx'

const mockUseTopGames = vi.fn()
const mockUseGlobalLeaderboard = vi.fn()

vi.mock('../hooks/useLeaderboard.ts', () => ({
  useTopGames: () => mockUseTopGames(),
  useGlobalLeaderboard: () => mockUseGlobalLeaderboard(),
}))

describe('HomePage', () => {
  beforeEach(() => {
    mockUseTopGames.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    mockUseGlobalLeaderboard.mockReturnValue({ data: undefined, isLoading: true, isError: false })
  })

  it('renders main heading', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders top games section heading', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByText(/top.*jeux/i)).toBeInTheDocument()
  })

  it('renders classement section heading', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByText(/classement/i)).toBeInTheDocument()
  })

  it('shows top games when data loaded', () => {
    mockUseTopGames.mockReturnValue({
      data: [
        { videoGameId: 1, nom: 'League of Legends', imageUrl: null, totalScore: 500 },
        { videoGameId: 2, nom: 'Échecs', imageUrl: null, totalScore: 200 },
      ],
      isLoading: false,
      isError: false,
    })
    mockUseGlobalLeaderboard.mockReturnValue({ data: [], isLoading: false, isError: false })
    renderWithProviders(<HomePage />)
    expect(screen.getByText('League of Legends')).toBeInTheDocument()
    expect(screen.getByText('Échecs')).toBeInTheDocument()
  })

  it('shows player rankings when data loaded', () => {
    mockUseTopGames.mockReturnValue({ data: [], isLoading: false, isError: false })
    mockUseGlobalLeaderboard.mockReturnValue({
      data: [{ rank: 1, userId: 1, login: 'alice42', firstname: 'Alice', lastname: 'Doe', totalScore: 300 }],
      isLoading: false,
      isError: false,
    })
    renderWithProviders(<HomePage />)
    expect(screen.getByText('alice42')).toBeInTheDocument()
    expect(screen.getByText('300')).toBeInTheDocument()
  })
})
