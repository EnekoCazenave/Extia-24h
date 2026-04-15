import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'

export default function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <>
      <header>
        <nav aria-label="Navigation principale">
          <NavLink to="/" aria-current="page">Accueil</NavLink>
          {user ? (
            <button type="button" onClick={logout}>Se déconnecter</button>
          ) : (
            <NavLink to="/login">Se connecter</NavLink>
          )}
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer>
        <p>Extia Gaming 24h</p>
      </footer>
    </>
  )
}
