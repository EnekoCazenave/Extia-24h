import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { UserPublic, RegisterInput } from '@extia-gaming/shared'
import { api } from '../services/api.ts'

interface AuthContextValue {
  user: UserPublic | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: RegisterInput) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get<{ user: UserPublic }>('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const res = await api.post<{ user: UserPublic }>('/auth/login', { email, password })
    setUser(res.data.user)
  }

  async function logout() {
    await api.post('/auth/logout')
    setUser(null)
  }

  async function register(data: RegisterInput) {
    const res = await api.post<{ user: UserPublic }>('/auth/register', data)
    setUser(res.data.user)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}
