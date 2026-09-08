import styles from "./AppLayout.module.css";
import {Link, NavLink, useLocation} from "react-router-dom";
import {MouseEventHandler, useEffect, useRef, useState} from "react";
import type {UserPublic} from "@extia-gaming/shared";

interface NavigationBarProps {
    logout: MouseEventHandler<HTMLButtonElement>,
    user: UserPublic | null,
    isAdmin: boolean,
    isModerator: boolean
}

export default function NavigationBar({logout, user, isAdmin, isModerator}: NavigationBarProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleRef = useRef<HTMLButtonElement>(null);
    const location = useLocation();

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 1280px)');
        const closeMenu = () => setIsMenuOpen(false);
        desktop.addEventListener('change', closeMenu);
        return () => desktop.removeEventListener('change', closeMenu);
    }, []);

    const navItems = [
        {id: 1, name: "Accueil", path: "/"},
        {id: 2, name: "Jeux", path: "/jeux"},
        {id: 3, name: "Classement", path: "/classement"},
        {id: 4, name: "Programme", path: "/programme"},
        {id: 5, name: "Association", path: "/associations"},
    ]

    return (
        <header className={styles.header}>
            <nav className={styles.nav} aria-label="Navigation principale"
                 onKeyDown={(event) => {
                     if (event.key === 'Escape' && isMenuOpen) {
                         setIsMenuOpen(false);
                         toggleRef.current?.focus();
                     }
                 }}>
                <Link to="/" className={styles.logo} onClick={() => setIsMenuOpen(false)}>
                    Extia <span>Gaming</span> 24h
                </Link>

                <button
                    ref={toggleRef}
                    type="button"
                    className={styles.menuToggle}
                    aria-expanded={isMenuOpen}
                    aria-controls="navigation-menu"
                    aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                    onClick={() => setIsMenuOpen(open => !open)}
                >
                    <span aria-hidden="true">{isMenuOpen ? '✕' : '☰'}</span>
                </button>

                <div id="navigation-menu"
                     className={`${styles.navigationMenu} ${isMenuOpen ? styles.navigationMenuOpen : ''}`}
                     onClick={(event) => {
                         if ((event.target as HTMLElement).closest('a, button')) {
                             setIsMenuOpen(false);
                         }
                     }}>
                <div className={styles.navLinks}>
                    { navItems.map(navItem => (
                        <NavLink to={navItem.path}
                                 key={navItem.id}
                                 className={({isActive}) =>
                                     `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                                 }
                        >
                            {navItem.name}
                        </NavLink>
                    ))}


                    {isModerator && (
                        <NavLink
                            to="/moderation"
                            className={({isActive}) =>
                                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                            }
                        >
                            Modération <span className={styles.adminBadge}>modo</span>
                        </NavLink>
                    )}
                    {isAdmin && (
                        <NavLink
                            to="/admin"
                            className={({isActive}) =>
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
                                className={({isActive}) =>
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
                            className={({isActive}) =>
                                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                            }
                        >
                            Se connecter
                        </NavLink>
                    )}
                </div>
                </div>
            </nav>
        </header>
    )

}
