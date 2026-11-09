vi.mock('../hooks/useAuth.ts',()=>({useAuth:()=>({user:null})}))
vi.mock('../hooks/useEvents.ts',()=>({useEvents:()=>({data:[],isLoading:false,isError:false})}))
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils.tsx'
import HomePage from '../pages/HomePage.tsx'
import { setMediaChoice } from '../components/ExternalMedia.tsx'

const platform = vi.hoisted(() => ({ settings: {} as Record<string, unknown> }))
vi.mock('../hooks/usePlatform.ts', async original => ({ ...await original<typeof import('../hooks/usePlatform.ts')>(), usePlatform: () => ({ data: { settings: platform.settings } }) }))

const mockUseTopGames = vi.fn()
const mockUseGlobalLeaderboard = vi.fn()

vi.mock('../hooks/useLeaderboard.ts', () => ({
  useTopGames: () => mockUseTopGames(),
  useGlobalLeaderboard: () => mockUseGlobalLeaderboard(),
}))

describe('HomePage', () => {
  beforeEach(() => {
    platform.settings = {}
    setMediaChoice('YouTube', 'allowed')
    mockUseTopGames.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    mockUseGlobalLeaderboard.mockReturnValue({ data: undefined, isLoading: true, isError: false })
  })

  it('propose une inscription depuis l’accueil', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByRole('link',{name:'S’inscrire aux 24 heures'})).toHaveAttribute('href','/register')
    expect(screen.getByRole('link',{name:/Voir tout le programme/})).toHaveAttribute('href','/programme')
  })
  it('affiche la vidéo YouTube configurée par l’administration', () => {
    platform.settings = { homeVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
    renderWithProviders(<HomePage />)
    expect(screen.getByTitle('Explication Challenge')).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
  })

  it('affiche la vidéo par défaut sans réglage', () => {
    renderWithProviders(<HomePage />)
    expect(screen.getByTitle('Explication Challenge')).toHaveAttribute('src', 'https://www.youtube.com/embed/b-qNl-lpJMI')
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
    expect(screen.queryByText('Alice Doe')).not.toBeInTheDocument()
    expect(screen.getByText('300')).toBeInTheDocument()
  })
})
