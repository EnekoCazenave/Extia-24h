import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api.ts'
import type { CreateGameInput, CreateGameTypeInput, UpdateHappyHourInput, GrantBonusInput } from '@extia-gaming/shared'

export function useCreateGame() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateGameInput) => {
      const res = await api.post('/api/admin/games', data)
      return res.data.game
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  })
}

export function useAddGameType(videoGameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateGameTypeInput) => {
      const res = await api.post(`/api/admin/games/${videoGameId}/game-types`, data)
      return res.data.gameType
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games', videoGameId] }),
  })
}

export function useUpdateHappyHour(videoGameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateHappyHourInput) => {
      const res = await api.put(`/api/admin/games/${videoGameId}/happy-hour`, data)
      return res.data.game
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  })
}

export function useGrantBonus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: GrantBonusInput) => {
      const res = await api.post('/api/admin/bonuses', data)
      return res.data.bonus
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaderboard'] }),
  })
}
