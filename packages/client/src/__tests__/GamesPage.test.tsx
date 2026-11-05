import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils.tsx'
import GamesPage from '../pages/GamesPage.tsx'

const mockUseGames = vi.fn()
const account = {id:1}
vi.mock('../hooks/useAuth.ts',()=>({useAuth:()=>({user:account})}))

vi.mock('../hooks/useGames.ts', () => ({
  useGames: () => mockUseGames(),
}))

describe('GamesPage', () => {
  beforeEach(() => {
    localStorage.clear()
    account.id=1
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

describe('Favoris personnels',()=>{
  const games=[{id:1,nom:'Échecs',imageUrl:null,gameTypes:[],totalScore:0,happyHourStart:null,happyHourEnd:null},{id:2,nom:'Tetris',imageUrl:null,gameTypes:[],totalScore:0,happyHourStart:null,happyHourEnd:null}]
  it('épingle, persiste et isole les favoris par compte, avec recherche sans accents',async()=>{
    localStorage.clear();account.id=1
    mockUseGames.mockReturnValue({data:games,isLoading:false,isError:false})
    const user=userEvent.setup(),view=renderWithProviders(<GamesPage />)
    await user.click(screen.getByRole('button',{name:'Ajouter Tetris aux favoris'}))
    expect(screen.getAllByRole('link')[0]).toHaveAccessibleName('Voir le détail du jeu Tetris')
    expect(screen.getByRole('button',{name:'Retirer Tetris des favoris'}).closest('a')).toBeNull()
    expect(JSON.parse(localStorage.getItem('extia:favorite-games:1')!)).toEqual([2])
    await user.type(screen.getByRole('searchbox'),'echecs')
    expect(screen.queryByText('Tetris')).not.toBeInTheDocument()
    expect(screen.getByText('Échecs')).toBeInTheDocument()
    account.id=2; view.unmount();renderWithProviders(<GamesPage />)
    expect(screen.getByRole('button',{name:'Ajouter Tetris aux favoris'})).toHaveAttribute('aria-pressed','false')
    account.id=1
  })
})
