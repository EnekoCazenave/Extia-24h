import {Link} from 'react-router-dom'
import {useAuth} from '../hooks/useAuth.ts'
import styles from './NotificationBell.module.css'
export default function NotificationBell() {
 const {user}=useAuth()
 return user?<aside className={styles.prompt} aria-label="Notifications"><Link className={styles.action} to="/profil"><span className={styles.bell} aria-hidden="true">🔔</span><span className={styles.copy}><strong>Mes rappels</strong><small>Gérer les notifications de cet appareil</small></span></Link></aside>:null
}
