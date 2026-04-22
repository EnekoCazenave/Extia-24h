import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api.ts'

export interface ModerationSession {
  id: number
  submitterId: number
  submitter: { id: number; login: string; firstname: string; lastname: string }
  gameTypeId: number
  gameType: {
    id: number
    name: string
    team: boolean
    videoGame: { id: number; nom: string }
  }
  score: number
  proofUrl: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  reviewedAt: string | null
  teamMembers: Array<{
    userId: number
    user: { id: number; login: string; firstname: string; lastname: string }
  }>
}

export function useModerationSessions(gameId?: number, status = 'PENDING') {
  return useQuery({
    queryKey: ['moderation', 'sessions', gameId, status],
    queryFn: async () => {
      const params = new URLSearchParams({ status })
      if (gameId) params.set('gameId', String(gameId))
      const res = await api.get<{ sessions: ModerationSession[] }>(`/api/moderation/sessions?${params}`)
      return res.data.sessions
    },
  })
}

export function useApproveSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/api/moderation/sessions/${id}/approve`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['moderation'] })
      qc.invalidateQueries({ queryKey: ['leaderboard'] })
      qc.invalidateQueries({ queryKey: ['games'] })
    },
  })
}

export function useRejectSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/api/moderation/sessions/${id}/reject`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['moderation'] })
    },
  })
}
