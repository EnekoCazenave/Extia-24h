import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useGames } from '../hooks/useGames.ts'
import { useGlobalLeaderboard } from '../hooks/useLeaderboard.ts'

vi.mock('../services/api.ts', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useGames', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('fetches games list', async () => {
    const { api } = await import('../services/api.ts')
    vi.mocked(api.get).mockResolvedValue({
      data: { games: [{ id: 1, nom: 'League of Legends', imageUrl: null, gameTypes: [], totalScore: 0 }] },
    })
    const { result } = renderHook(() => useGames(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].nom).toBe('League of Legends')
  })
})

describe('useGlobalLeaderboard', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('fetches leaderboard rankings', async () => {
    const { api } = await import('../services/api.ts')
    vi.mocked(api.get).mockResolvedValue({
      data: {
        rankings: [
          { rank: 1, userId: 1, login: 'player1', firstname: 'Alice', lastname: 'Doe', totalScore: 300 },
        ],
      },
    })
    const { result } = renderHook(() => useGlobalLeaderboard(10), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data![0].login).toBe('player1')
  })
})
