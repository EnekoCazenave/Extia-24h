import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api.ts'
import type { LeaderboardEntry, GameScoreSummary } from '@extia-gaming/shared'

export interface RankedEntry extends LeaderboardEntry {
  rank: number
}

export function usePersonalLeaderboard(userId?: number) {
  return useQuery({
    queryKey: ['leaderboard', 'me', userId],
    enabled: userId !== undefined,
    queryFn: async () => {
      const res = await api.get<{ranking: RankedEntry}>('/api/leaderboard/me')
      return res.data.ranking
    },
  })
}

export interface FilteredRankedEntry extends RankedEntry {
  gameCount: number
}

export function useGlobalLeaderboard(limit = 20) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
      const res = await api.get<{ rankings: RankedEntry[] }>(`/api/leaderboard?limit=${limit}`)
      return res.data.rankings
    },
  })
}

export function useFilteredLeaderboard(filters: {
  gameId?: number
  gameTypeId?: number
  team?: boolean
}) {
  const isGlobal = filters.gameId === undefined && filters.gameTypeId === undefined && filters.team === undefined
  return useQuery({
    queryKey: ['leaderboard', 'players', filters],
    queryFn: async () => {
      if (isGlobal) {
        const res = await api.get<{ rankings: RankedEntry[] }>('/api/leaderboard?limit=100')
        return res.data.rankings.map((r) => ({ ...r, gameCount: undefined as number | undefined }))
      }
      const params = new URLSearchParams()
      if (filters.gameId !== undefined) params.set('gameId', String(filters.gameId))
      if (filters.gameTypeId !== undefined) params.set('gameTypeId', String(filters.gameTypeId))
      if (filters.team !== undefined) params.set('team', String(filters.team))
      const res = await api.get<{ rankings: FilteredRankedEntry[] }>(`/api/leaderboard/players?${params}`)
      return res.data.rankings
    },
  })
}

export function useTopGames(limit = 5) {
  return useQuery({
    queryKey: ['leaderboard', 'top-games', limit],
    queryFn: async () => {
      const res = await api.get<{ games: GameScoreSummary[] }>(`/api/leaderboard/top-games?limit=${limit}`)
      return res.data.games
    },
  })
}
