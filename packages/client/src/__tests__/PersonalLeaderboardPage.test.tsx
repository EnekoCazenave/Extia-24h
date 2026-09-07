import {beforeEach, describe, expect, it, vi} from 'vitest'
import {fireEvent, screen} from '@testing-library/react'
import {Route, Routes} from 'react-router-dom'
import {renderWithProviders} from '../test-utils.tsx'
import LeaderboardPage from '../pages/LeaderboardPage.tsx'
import PersonalLeaderboardPage from '../pages/PersonalLeaderboardPage.tsx'
import ProtectedRoute from '../components/ProtectedRoute.tsx'
import {api} from '../services/api.ts'

const auth = vi.hoisted(() => ({user: null as null | {id: number}}))
vi.mock('../hooks/useAuth.ts', () => ({useAuth: () => ({user: auth.user, isLoading: false})}))
vi.mock('../hooks/useGames.ts', () => ({useGames: () => ({data: []})}))
vi.mock('../services/api.ts', () => ({api: {get: vi.fn()}}))

function renderPages(path = '/classement') {
  return renderWithProviders(<Routes>
    <Route path="/classement" element={<LeaderboardPage/>}/>
    <Route element={<ProtectedRoute/>}>
      <Route path="/classement/me" element={<PersonalLeaderboardPage/>}/>
    </Route>
    <Route path="/login" element={<p>Connexion requise</p>}/>
  </Routes>, {initialEntries: [path]})
}

describe('Personal leaderboard', () => {
  beforeEach(() => {
    auth.user = {id: 7}
    vi.mocked(api.get).mockReset().mockImplementation(async (url) => ({data: url.startsWith('/api/leaderboard/me?')
      ? {sessions: [], page: 1, hasNextPage: false, ranking: {userId: 7, login: 'alice', firstname: 'Alice', lastname: 'Martin', rank: 150, totalScore: 0}}
      : url.includes('/sessions') ? {sessions: [], page: 1, hasNextPage: false} : {rankings: []}}))
  })

  it('opens personal details from the leaderboard button', async () => {
    renderPages()
    fireEvent.click(screen.getByRole('link', {name: 'Voir mon classement'}))
    expect(await screen.findByText('alice')).toBeInTheDocument()
    expect(screen.getByText('150e')).toBeInTheDocument()
    expect(screen.getByText('0 pts')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/api/leaderboard/me?page=1')
    fireEvent.click(screen.getByRole('link', {name: /Retour au classement/}))
    expect(screen.getByRole('heading', {name: 'Classement des joueurs'})).toBeInTheDocument()
  })

  it('hides the button for anonymous visitors', () => {
    auth.user = null
    renderPages()
    expect(screen.queryByRole('link', {name: 'Voir mon classement'})).not.toBeInTheDocument()
  })

  it('protects direct access for anonymous visitors', () => {
    auth.user = null
    renderPages('/classement/me')
    expect(screen.getByText('Connexion requise')).toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })

  it('shows a loading state', () => {
    vi.mocked(api.get).mockImplementation(() => new Promise(() => {}))
    renderPages('/classement/me')
    expect(screen.getByText('Chargement de votre classement…')).toBeInTheDocument()
  })

  it('offers retry when the request fails', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
    renderPages('/classement/me')
    expect(await screen.findByText('Impossible de charger votre classement.')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Réessayer'})).toBeInTheDocument()
  })
})
