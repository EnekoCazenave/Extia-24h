import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api.ts'
import type { PlayInput, GameLeaderboardEntry } from '@extia-gaming/shared'

export interface GameWithScore {
  id: number
  nom: string
  imageUrl: string | null
  happyHourStart: string | null
  happyHourEnd: string | null
  gameTypes: Array<{ id: number; name: string; calcul: string; win: string; team: boolean; videoGameId: number }>
  totalScore: number
}

export interface GameDetail extends GameWithScore {
  rankings: (GameLeaderboardEntry & { rank: number })[]
}

export function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await api.get<{ games: GameWithScore[] }>('/api/games')
      return res.data.games
    },
  })
}

export function useGame(id: number) {
  return useQuery({
    queryKey: ['games', id],
    enabled: id > 0,
    queryFn: async () => {
      const res = await api.get<{ game: GameDetail }>(`/api/games/${id}`)
      return res.data.game
    },
  })
}

export function useSubmitPlay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: PlayInput) => {
      const res = await api.post<{ session: { id: number; score: number; happyHourApplied: boolean; originalScore: number } }>('/api/play', data)
      return res.data.session
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['games'] })
      qc.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })
}
