import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'

interface Props {
  requiredRole?: string
}

export default function ProtectedRoute({ requiredRole }: Props) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main aria-live="polite" aria-label="Chargement en cours">
        <p>Chargement…</p>
      </main>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (requiredRole && user.role.name !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
