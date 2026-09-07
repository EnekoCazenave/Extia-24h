import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils.tsx'
import GameDetailPage from '../pages/GameDetailPage.tsx'

const mockUseGame = vi.fn()
const mockUseParams = vi.fn()

vi.mock('../hooks/useGames.ts', () => ({
  useGame: (id: number) => mockUseGame(id),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useParams: () => mockUseParams() }
})

const mockGame = {
  id: 1,
  nom: 'League of Legends',
  imageUrl: null,
  happyHourStart: null,
  happyHourEnd: null,
  gameTypes: [{ id: 1, name: '5v5 Classique', calculType: 'BOOLEAN', calculConfig: { type: 'BOOLEAN', trueValue: 100, falseValue: 0 }, win: 'Destroy nexus', team: true, videoGameId: 1 }],
  totalScore: 750,
  rankings: [
    { rank: 1, userId: 1, login: 'alice42', firstname: 'Alice', lastname: 'Doe', gameScore: 400 },
    { rank: 2, userId: 2, login: 'bob99', firstname: 'Bob', lastname: 'Martin', gameScore: 350 },
  ],
}

describe('GameDetailPage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: '1' })
  })

  it('shows loading state', () => {
    mockUseGame.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    renderWithProviders(<GameDetailPage />)
    expect(screen.getByText(/chargement/i)).toBeInTheDocument()
  })

  it('shows game name in heading', () => {
    mockUseGame.mockReturnValue({ data: mockGame, isLoading: false, isError: false })
    renderWithProviders(<GameDetailPage />)
    expect(screen.getByRole('heading', { name: /league of legends/i })).toBeInTheDocument()
  })

  it('shows total score', () => {
    mockUseGame.mockReturnValue({ data: mockGame, isLoading: false, isError: false })
    renderWithProviders(<GameDetailPage />)
    expect(screen.getByText('750')).toBeInTheDocument()
  })

  it('shows player rankings', () => {
    mockUseGame.mockReturnValue({ data: mockGame, isLoading: false, isError: false })
    renderWithProviders(<GameDetailPage />)
    expect(screen.getByText('alice42')).toBeInTheDocument()
    expect(screen.getByText('bob99')).toBeInTheDocument()
  })

  it('shows link to play form for each game type', () => {
    mockUseGame.mockReturnValue({ data: mockGame, isLoading: false, isError: false })
    renderWithProviders(<GameDetailPage />)
    expect(screen.getByRole('link', { name: /soumettre.*5v5/i })).toBeInTheDocument()
  })
})
