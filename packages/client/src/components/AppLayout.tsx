import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import styles from './AppLayout.module.css'
import EventAttendancePrompt from './programme/EventAttendancePrompt.tsx'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const isAdmin = user?.role?.name === 'admin'
  const isModerator = user?.role?.name === 'moderator' || isAdmin

  return (
    <>
      {user && <EventAttendancePrompt key={user.id} userId={user.id}/>}
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Navigation principale">
          <Link to="/" className={styles.logo}>
            Extia <span>Gaming</span> 24h
          </Link>

          <div className={styles.navLinks}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Accueil
            </NavLink>
            <NavLink
              to="/jeux"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Jeux
            </NavLink>
            <NavLink
              to="/classement"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Classement
            </NavLink>
            <NavLink
                to="/programme"
                className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
            >
              Programme
            </NavLink>
            <NavLink
              to="/associations"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              Associations
            </NavLink>
            {isModerator && (
              <NavLink
                to="/moderation"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                Modération <span className={styles.adminBadge}>modo</span>
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                Admin <span className={styles.adminBadge}>admin</span>
              </NavLink>
            )}
          </div>

          <div className={styles.navActions}>
            {user ? (
              <>
                <NavLink
                  to="/profil"
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                  aria-label={`Profil de ${user.login}`}
                >
                  {user.login}
                </NavLink>
                <button
                  type="button"
                  className={styles.logoutBtn}
                  onClick={logout}
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                Se connecter
              </NavLink>
            )}
          </div>
        </nav>
      </header>

      <main id="main-content" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <p>
          Extia Gaming 24h &mdash;{' '}
          <Link to="/politique-de-confidentialite">Politique de confidentialité</Link>
        </p>
      </footer>
    </>
  )
}
