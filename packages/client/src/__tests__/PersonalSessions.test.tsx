import {expect, it, vi} from 'vitest'
import {fireEvent, screen} from '@testing-library/react'
import {renderWithProviders} from '../test-utils.tsx'
import PersonalLeaderboardPage from '../pages/PersonalLeaderboardPage.tsx'
import {api} from '../services/api.ts'
vi.mock('../services/api.ts', () => ({api: {get: vi.fn()}}))
vi.mock('../hooks/useAuth.ts', () => ({useAuth: () => ({user: {id: 7}})}))

it('shows submitted and credited scores and loads the next page on demand', async () => {
  vi.mocked(api.get).mockImplementation(async (url) => ({data: {
    ranking: {userId: 7, login: 'alice', firstname: 'Alice', lastname: 'Martin', rank: 3, totalScore: 200},
    page: url.endsWith('=1') ? 1 : 2, hasNextPage: url.endsWith('=1'),
    sessions: [{id: 1, createdAt: '2026-09-07T10:00:00Z', gameName: url.endsWith('=1') ? 'Jeu A' : 'Jeu B',
      gameTypeName: 'Solo', status: 'APPROVED', submittedScore: 50, creditedPoints: 100}],
  }}))
  renderWithProviders(<PersonalLeaderboardPage/>)
  expect(await screen.findByText('Jeu A')).toBeInTheDocument()
  expect(screen.getByText('50 pts')).toBeInTheDocument()
  expect(screen.getByText('100 pts')).toBeInTheDocument()
  expect(screen.getByRole('button', {name: 'Précédent'})).toBeDisabled()
  expect(api.get).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', {name: 'Suivant'}))
  expect(await screen.findByText('Jeu B')).toBeInTheDocument()
  expect(api.get).toHaveBeenCalledWith('/api/leaderboard/me?page=2')
  expect(screen.getByRole('button', {name: 'Suivant'})).toBeDisabled()
})
