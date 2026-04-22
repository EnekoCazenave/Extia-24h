import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'moderator' | 'user'
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div
        style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}
        aria-live="polite"
      >
        Chargement…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole === 'admin' && user.role?.name !== 'admin') {
    return <Navigate to="/" replace />
  }

  if (requiredRole === 'moderator' && user.role?.name !== 'moderator' && user.role?.name !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
