import {Outlet, Link} from 'react-router-dom'
import {useAuth} from '../hooks/useAuth.ts'
import styles from './AppLayout.module.css'
import EventAttendancePrompt from './programme/EventAttendancePrompt.tsx'
import NavigationBar from "./Navigationbar.tsx";

export default function AppLayout() {
    const {user, logout} = useAuth()
    const isAdmin = user?.role?.name === 'admin'
    const isModerator = user?.role?.name === 'moderator' || isAdmin

    return (
        <>
            {user && <EventAttendancePrompt key={user.id} userId={user.id}/>}
            <a href="#main-content" className="skip-link">
                Aller au contenu principal
            </a>

            <NavigationBar logout={logout} user={user} isModerator={isModerator} isAdmin={isAdmin}></NavigationBar>

            <main id="main-content" className={styles.main} tabIndex={-1}>
                <Outlet/>
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
