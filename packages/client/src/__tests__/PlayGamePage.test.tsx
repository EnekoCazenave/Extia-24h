import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test-utils.tsx'
import PlayGamePage from '../pages/PlayGamePage.tsx'

const mockUseGame = vi.fn()
const mockUseSubmitPlay = vi.fn()
const mockUseParams = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../hooks/useGames.ts', () => ({
  useGame: (id: number) => mockUseGame(id),
  useSubmitPlay: () => mockUseSubmitPlay(),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockNavigate,
  }
})

const mockGame = {
  id: 1,
  nom: 'League of Legends',
  imageUrl: null,
  happyHourStart: null,
  happyHourEnd: null,
  gameTypes: [
    { id: 1, name: '5v5 Classique', calculType: 'BOOLEAN', calculConfig: { type: 'BOOLEAN', trueValue: 100, falseValue: 0 }, win: 'Nexus', team: true, videoGameId: 1 },
    { id: 2, name: 'ARAM', calculType: 'NUMBER', calculConfig: { type: 'NUMBER', multiplier: 1 }, win: 'Nexus', team: true, videoGameId: 1 },
  ],
  totalScore: 0,
  rankings: [],
}

describe('PlayGamePage', () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: '1' })
    mockUseGame.mockReturnValue({ data: mockGame, isLoading: false, isError: false })
    mockUseSubmitPlay.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: 1, score: 100, happyHourApplied: false, originalScore: 100 }),
      isPending: false,
    })
    mockNavigate.mockReset()
  })

  it('renders heading', () => {
    renderWithProviders(<PlayGamePage />, { initialEntries: ['/jeux/1/jouer?gameTypeId=1'] })
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders game type selector', () => {
    renderWithProviders(<PlayGamePage />, { initialEntries: ['/jeux/1/jouer?gameTypeId=1'] })
    expect(screen.getByLabelText(/mode de jeu/i)).toBeInTheDocument()
  })

  it('renders score input for NUMBER type', () => {
    renderWithProviders(<PlayGamePage />, { initialEntries: ['/jeux/1/jouer?gameTypeId=2'] })
    expect(screen.getByLabelText(/score obtenu/i)).toBeInTheDocument()
  })

  it('calls submitPlay with NUMBER payload', async () => {
    const mockMutate = vi.fn().mockResolvedValue({ id: 1 })
    mockUseSubmitPlay.mockReturnValue({ mutateAsync: mockMutate, isPending: false })

    const user = userEvent.setup()
    renderWithProviders(<PlayGamePage />, { initialEntries: ['/jeux/1/jouer?gameTypeId=2'] })

    await user.clear(screen.getByLabelText(/score obtenu/i))
    await user.type(screen.getByLabelText(/score obtenu/i), '250')
    await user.click(screen.getByRole('button', { name: /soumettre/i }))

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ calculType: 'NUMBER', value: 250, gameTypeId: 2 })
      )
    )
  })

  it('shows success message after submit', async () => {
    const mockMutate = vi.fn().mockResolvedValue({ id: 1 })
    mockUseSubmitPlay.mockReturnValue({ mutateAsync: mockMutate, isPending: false })

    const user = userEvent.setup()
    renderWithProviders(<PlayGamePage />, { initialEntries: ['/jeux/1/jouer?gameTypeId=2'] })

    await user.type(screen.getByLabelText(/score obtenu/i), '100')
    await user.click(screen.getByRole('button', { name: /soumettre/i }))

    await waitFor(() =>
      expect(screen.getByRole('status')).toBeInTheDocument()
    )
  })
})
