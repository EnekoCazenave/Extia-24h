import {useState} from 'react'
import styles from './NotificationBell.module.css'

const DISMISSED_KEY = 'extia-notification-prompt-dismissed'

function canSuggestNotifications() {
    return typeof window !== 'undefined'
        && 'Notification' in window
        && Notification.permission === 'default'
        && localStorage.getItem(DISMISSED_KEY) !== 'true'
}

export default function NotificationBell() {
    const [visible, setVisible] = useState(canSuggestNotifications)
    const [isRequesting, setIsRequesting] = useState(false)
    const [error, setError] = useState('')

    if (!visible) return null

    async function enableNotifications() {
        setIsRequesting(true)
        setError('')
        try {
            const permission = await Notification.requestPermission()
            if (permission !== 'default') setVisible(false)
        } catch {
            setError('Impossible d’activer les notifications.')
        } finally {
            setIsRequesting(false)
        }
    }

    function dismiss() {
        localStorage.setItem(DISMISSED_KEY, 'true')
        setVisible(false)
    }

    return <aside className={styles.prompt} aria-label="Activer les notifications">
        <button type="button" className={styles.dismiss} onClick={dismiss}
            aria-label="Fermer la suggestion de notifications">×</button>
        <button type="button" className={styles.action} onClick={enableNotifications} disabled={isRequesting}>
            <span className={styles.bell} aria-hidden="true">🔔</span>
            <span className={styles.copy}>
                <strong>{isRequesting ? 'Activation…' : 'Suivre les actualités'}</strong>
                <small>Activez les notifications</small>
            </span>
        </button>
        {error && <span className={styles.error} role="alert">{error}</span>}
    </aside>
}
