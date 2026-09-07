import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api.ts'
import type { CreateGameInput, UpdateGameInput, CreateGameTypeInput, UpdateGameTypeInput, UpdateHappyHourInput, GrantBonusInput } from '@extia-gaming/shared'

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

export function useUpdateGame(videoGameId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpdateGameInput) => {
      const res = await api.put(`/api/admin/games/${videoGameId}`, data)
      return res.data.game
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  })
}

export function useDeleteGame() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (videoGameId: number) => {
      await api.delete(`/api/admin/games/${videoGameId}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  })
}

export function useUpdateGameType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ gameTypeId, data }: { gameTypeId: number; data: UpdateGameTypeInput }) => {
      const res = await api.put(`/api/admin/game-types/${gameTypeId}`, data)
      return res.data.gameType
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['games'] }),
  })
}

export function useDeleteGameType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (gameTypeId: number) => {
      await api.delete(`/api/admin/game-types/${gameTypeId}`)
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
