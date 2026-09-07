import {Link} from 'react-router-dom'
import type {ProgramEvent} from '@extia-gaming/shared'
import styles from '../../pages/ProgrammePage.module.css'

interface EventCardProps {
    event: ProgramEvent
    isAdmin: boolean
    isAuthenticated: boolean
    registrationPending: boolean
    deletionPending: boolean
    onEdit: (event: ProgramEvent) => void
    onDelete: (event: ProgramEvent) => void
    onToggleRegistration: (event: ProgramEvent) => void
}

export default function EventCard({
                                      event,
                                      isAdmin,
                                      isAuthenticated,
                                      registrationPending,
                                      deletionPending,
                                      onEdit,
                                      onDelete,
                                      onToggleRegistration,
                                  }: EventCardProps) {
    const now = Date.now()
    const hasStarted = new Date(event.startsAt).getTime() <= now
    const hasEnded = new Date(event.endsAt).getTime() <= now
    const isOngoing = hasStarted && !hasEnded
    const cardClassName = [
        styles.card,
        event.isRegistered ? styles.registered : '',
        hasEnded ? styles.past : '',
    ].filter(Boolean).join(' ')

    return <li className={styles.event}>
        <div className={styles.time}><strong>{formatTime(event.startsAt)}</strong>
            <span>à {formatTime(event.endsAt)}</span></div>
        <article className={cardClassName}>
            <Link to={`/programme/${event.id}`}>
                <div className={styles.cardTop}>
                    <div><p className={styles.date}>{formatDate(event.startsAt)}</p><h2>{event.name}</h2></div>
                    {hasEnded
                        ? <span className={styles.endedBadge}>Terminé</span>
                        : isOngoing
                            ? <span className={styles.ongoingBadge}>En cours</span>
                            : event.isRegistered && <span className={styles.registeredBadge}>✓ Inscrit</span>}
                </div>
                <p className={styles.description}>{event.description}</p>
                <div className={styles.meta}>
                    {event.videoGame && <span>🎮 {event.videoGame.nom}</span>}
                    <span>♟ {event.participantCount} / {event.maxPlaces} places</span>
                </div>
            </Link>
            <div className={styles.actions}>
                {isAdmin ? <>
                    <button className={styles.secondaryButton} type="button" onClick={() => onEdit(event)}>Modifier
                    </button>
                    <button className={styles.dangerButton} type="button" disabled={deletionPending}
                            onClick={() => onDelete(event)}>Supprimer
                    </button>
                </> : hasEnded ?
                    <button className={styles.secondaryButton} disabled type="button">Terminé</button> : isOngoing && event.isRegistered ?
                        <button className={styles.secondaryButton} disabled type="button">Inscrit — En cours</button> : isAuthenticated ?
                            <button className={event.isRegistered ? styles.secondaryButton : styles.primaryButton}
                                    disabled={(!event.isRegistered && event.isFull) || registrationPending}
                                    type="button" onClick={() => onToggleRegistration(event)}>
                                {event.isRegistered ? 'Se désinscrire' : event.isFull ? 'Complet' : 'S’inscrire'}
                            </button> :
                            <Link className={styles.primaryButton} to="/login" state={{from: '/programme'}}>
                                Se connecter pour s’inscrire</Link>}
            </div>
        </article>
    </li>
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    }).format(new Date(value))
}

function formatTime(value: string) {
    return new Intl.DateTimeFormat('fr-FR', {hour: '2-digit', minute: '2-digit'}).format(new Date(value))
}
