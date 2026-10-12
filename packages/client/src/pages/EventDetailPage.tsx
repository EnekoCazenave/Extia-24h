import {usePlatformAction} from '../hooks/usePlatform.ts'
import {api} from '../services/api.ts'
import {useState} from 'react'
import {Link, useParams} from 'react-router-dom'
import SEOHead from '../components/SEOHead.tsx'
import {useAuth} from '../hooks/useAuth.ts'
import {useEvent, useRegisterToEvent, useUnregisterFromEvent, useUpdateEvent} from '../hooks/useEvents.ts'
import styles from './EventDetailPage.module.css'

export default function EventDetailPage() {
    const {id} = useParams<{id: string}>()
    const eventId = Number(id)
    const {user} = useAuth()
    const {data: event, isLoading, isError} = useEvent(eventId, user?.id)
    const register = useRegisterToEvent()
    const unregister = useUnregisterFromEvent()
    const updateEvent = useUpdateEvent()
    const [actionError, setActionError] = useState('')
    const action=usePlatformAction()
    const [winner,setWinner]=useState('')
    const [notice, setNotice] = useState('')

    if (isLoading) return <main className={styles.page}><p className={styles.state}>Chargement de l’évènement…</p></main>

    if (isError || !event) return <main className={styles.page}>
        <p className={styles.error} role="alert">Évènement introuvable ou erreur de chargement.</p>
        <Link to="/programme" className={styles.back}>← Retour au programme</Link>
    </main>

    const now = Date.now()
    const hasEnded = new Date(event.endsAt).getTime() <= now
    const isOngoing = new Date(event.startsAt).getTime() <= now && !hasEnded
    const registrationPending = register.isPending || unregister.isPending

    async function toggleRegistration() {
        if (!user || !event || hasEnded || (isOngoing && event.isRegistered)) return
        try {
            setActionError('')
            if (event.isRegistered) {
                await unregister.mutateAsync(event.id)
                setNotice('Votre inscription a été annulée.')
            } else {
                await register.mutateAsync(event.id)
                setNotice('Votre inscription est confirmée !')
            }
        } catch {
            setActionError('Impossible de modifier votre inscription.')
        }
    }

    async function saveAttendance(userId: number, value: string) {
        try {
            setActionError('')
            setNotice('')
            await updateEvent.mutateAsync({eventId, data: {
                attendance: {userId, isPresent: value === '' ? null : value === 'yes'},
            }})
            setNotice('Présence enregistrée.')
        } catch {
            setActionError('Impossible d’enregistrer la présence. Veuillez réessayer.')
        }
    }

    return <main className={styles.page}>
        <SEOHead title={event.name} description={event.description} canonicalPath={`/programme/${event.id}`}/>
        <Link to="/programme" className={styles.back}>← Retour au programme</Link>

        <header className={styles.hero}>
            <div className={styles.heroContent}>
                <div className={styles.badges}>
                    {hasEnded && <span className={styles.endedBadge}>Terminé</span>}
                    {isOngoing && <span className={styles.ongoingBadge}>En cours</span>}
                    {!hasEnded && !isOngoing && event.isRegistered &&
                        <span className={styles.registeredBadge}>✓ Inscrit</span>}
                </div>
                <p className={styles.date}>{formatLongDate(event.startsAt)}</p>
                <h1>{event.name}</h1>
                <p className={styles.description}>{event.description}</p>
            </div>
            {event.videoGame?.imageUrl &&
                <img className={styles.gameImage} src={event.videoGame.imageUrl} alt=""/>}
        </header>

        {notice && <p className={styles.notice} role="status">{notice}</p>}
        {actionError && <p className={styles.error} role="alert">{actionError}</p>}

        {event.twitchUrl&&<a href={event.twitchUrl} target="_blank" rel="noreferrer">Voir le direct Twitch ↗</a>}
        {action.error&&<p role="alert">{action.error}</p>}
        <div className={styles.grid}>
            <section className={styles.details} aria-labelledby="event-information-title">
                <h2 id="event-information-title">Informations</h2>
                <dl>
                    <div><dt>Début</dt><dd>{formatDateTime(event.startsAt)}</dd></div>
                    <div><dt>Fin</dt><dd>{formatDateTime(event.endsAt)}</dd></div>
                    {event.videoGame && <div><dt>Jeu</dt><dd>🎮 {event.videoGame.nom}</dd></div>}
                    <div><dt>Participants</dt><dd>{event.participantCount} / {event.maxPlaces}</dd></div>
                    <div><dt>Places restantes</dt><dd>{event.remainingPlaces}</dd></div>
                    <div><dt>Points de participation</dt><dd>{event.pointsEarned}</dd></div>
                </dl>
            </section>

            <aside className={styles.registration} aria-labelledby="event-registration-title">
                <h2 id="event-registration-title">Inscription</h2>
                {hasEnded ? <><strong>Évènement terminé</strong><p>Les inscriptions sont closes.</p></> :
                    isOngoing && event.isRegistered ? <><strong>Vous êtes inscrit</strong><p>L’évènement est en cours.</p></> :
                    !user ? <><p>Connectez-vous pour réserver votre place.</p>
                        <Link className={styles.primaryButton} to="/login" state={{from: `/programme/${event.id}`}}>
                            Se connecter</Link></> : <>
                        <p>{event.isRegistered ? 'Votre place est réservée.' :
                            event.isFull ? 'Toutes les places ont été réservées.' :
                                `${event.remainingPlaces} place${event.remainingPlaces > 1 ? 's' : ''} disponible${event.remainingPlaces > 1 ? 's' : ''}.`}</p>
                        <button type="button" onClick={toggleRegistration} disabled={registrationPending || (!event.isRegistered && event.isFull)}
                            className={event.isRegistered ? styles.secondaryButton : styles.primaryButton}>
                            {registrationPending ? 'Mise à jour…' : event.isRegistered ? 'Se désinscrire' : event.isFull ? 'Complet' : 'S’inscrire'}
                        </button>
                    </>}
            </aside>
        </div>
        {user?.role?.name === 'admin' && event.participants &&
            <section className={`${styles.details} ${styles.participants}`} aria-labelledby="event-participants-title">
                {event.settledAt?<p>Points distribués.</p>:hasEnded&&<div><label>Gagnant<select value={winner} onChange={e=>setWinner(e.target.value)}><option value="">Choisir un participant présent</option>{event.participants.filter(p=>p.isPresent).map(p=><option key={p.id} value={p.id}>{p.firstname} {p.lastname}</option>)}</select></label><button type="button" disabled={action.busy||((event.winnerShare??0.05)>0&&!winner)} onClick={()=>action.run(()=>api.post(`/api/admin/events/${eventId}/settle`,{winnerId:winner?Number(winner):null}))}>Distribuer les points</button></div>}
                <h2 id="event-participants-title">Participants inscrits ({event.participants.length})</h2>
                {event.participants.length === 0 ? <p>Aucun participant inscrit pour le moment.</p> :
                    <ul className={styles.participantList}>
                        {event.participants.map((participant) => <li key={participant.id}>
                            <span>{participant.firstname} {participant.lastname}</span>
                            <select aria-label={`Présence de ${participant.firstname} ${participant.lastname}`}
                                value={participant.isPresent === null ? '' : participant.isPresent ? 'yes' : 'no'}
                                disabled={updateEvent.isPending || !isOngoing || Boolean(event.settledAt)}
                                onChange={(change) => void saveAttendance(participant.id, change.target.value)}>
                                <option value="">Non renseigné</option>
                                <option value="yes">Oui — Présent</option>
                                <option value="no">Non — Absent</option>
                            </select>
                            <button type="button" disabled={action.busy||Boolean(event.settledAt)} onClick={()=>{if(confirm('Retirer ce participant ?'))void action.run(()=>api.delete(`/api/admin/events/${eventId}/participants/${participant.id}`))}}>Retirer l’inscription</button>
                        </li>)}
                    </ul>}
            </section>}
    </main>
}

function formatLongDate(value: string) {
    return new Intl.DateTimeFormat('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})
        .format(new Date(value))
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    }).format(new Date(value))
}
