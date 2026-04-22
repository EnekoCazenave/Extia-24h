import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api.ts'

export interface UserSummary {
  id: number
  login: string
  firstname: string
  lastname: string
  email: string
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<{ users: UserSummary[] }>('/api/users')
      return res.data.users
    },
  })
}
