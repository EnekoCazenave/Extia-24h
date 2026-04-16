import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api.ts'
import type { LeaderboardEntry, GameScoreSummary } from '@extia-gaming/shared'

export interface RankedEntry extends LeaderboardEntry {
  rank: number
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

export function useTopGames(limit = 5) {
  return useQuery({
    queryKey: ['leaderboard', 'top-games', limit],
    queryFn: async () => {
      const res = await api.get<{ games: GameScoreSummary[] }>(`/api/leaderboard/top-games?limit=${limit}`)
      return res.data.games
    },
  })
}
