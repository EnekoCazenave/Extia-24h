import {useEffect, useMemo, useState, type FormEvent} from 'react'
import {Link} from 'react-router-dom'
import Modal from '../components/Modal.tsx'
import SEOHead from '../components/SEOHead.tsx'
import {useAuth} from '../hooks/useAuth.ts'
import styles from './ProgrammePage.module.css'

export interface ProgramEvent {
    id: string;
    name: string;
    description: string;
    location: string;
    startsAt: string;
    endsAt: string;
    capacity: number | null;
    participantIds: number[]
}

type EventDraft = Omit<ProgramEvent, 'id' | 'participantIds'>
const STORAGE_KEY = 'extia-program-events-v1'

function toLocalInputValue(date: Date) {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function initialEvents(): ProgramEvent[] {
    const now = new Date();
    const at = (hours: number) => new Date(now.getTime() + hours * 3_600_000).toISOString()
    return [
        {
            id: 'welcome',
            name: 'Cérémonie d’ouverture',
            description: 'Lancement officiel des 24h, présentation des associations et des défis.',
            location: 'Scène principale',
            startsAt: at(2),
            endsAt: at(3),
            capacity: null,
            participantIds: []
        },
        {
            id: 'tournament',
            name: 'Tournoi Rocket League',
            description: 'Formez votre équipe et tentez de décrocher la première place du tournoi.',
            location: 'Espace gaming',
            startsAt: at(5),
            endsAt: at(7),
            capacity: 24,
            participantIds: []
        },
        {
            id: 'quiz',
            name: 'Quiz pop culture',
            description: 'Une heure de questions, de surprises et de bonne humeur.',
            location: 'Amphithéâtre',
            startsAt: at(9),
            endsAt: at(10),
            capacity: 80,
            participantIds: []
        },
    ]
}

function loadEvents(): ProgramEvent[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored) as ProgramEvent[]
    } catch { /* Storage can be unavailable. */
    }
    return initialEvents()
}

function emptyDraft(): EventDraft {
    const start = new Date(Date.now() + 3_600_000);
    const end = new Date(start.getTime() + 3_600_000);
    return {
        name: '',
        description: '',
        location: '',
        startsAt: toLocalInputValue(start),
        endsAt: toLocalInputValue(end),
        capacity: null
    }
}

function EventForm({initialValue, onSubmit, onCancel}: {
    initialValue: EventDraft;
    onSubmit: (draft: EventDraft) => void;
    onCancel: () => void
}) {
    const [draft, setDraft] = useState(initialValue);
    const [error, setError] = useState('')

    function submit(e: FormEvent) {
        e.preventDefault();
        if (new Date(draft.endsAt) <= new Date(draft.startsAt)) {
            setError('La fin doit être postérieure au début de l’évènement.');
            return
        }
        onSubmit({
            ...draft,
            name: draft.name.trim(),
            description: draft.description.trim(),
            location: draft.location.trim()
        })
    }

    return <form className={styles.form} onSubmit={submit}>
        <label>Nom de l’évènement<input required value={draft.name}
                                        onChange={(e) => setDraft({...draft, name: e.target.value})}/></label>
        <label>Description<textarea required rows={3} value={draft.description}
                                    onChange={(e) => setDraft({...draft, description: e.target.value})}/></label>
        <label>Lieu<input required value={draft.location}
                          onChange={(e) => setDraft({...draft, location: e.target.value})}/></label>
        <div className={styles.formRow}><label>Début<input required type="datetime-local"
                                                           value={draft.startsAt.slice(0, 16)}
                                                           onChange={(e) => setDraft({
                                                               ...draft,
                                                               startsAt: e.target.value
                                                           })}/></label><label>Fin<input required type="datetime-local"
                                                                                         value={draft.endsAt.slice(0, 16)}
                                                                                         onChange={(e) => setDraft({
                                                                                             ...draft,
                                                                                             endsAt: e.target.value
                                                                                         })}/></label></div>
        <label>Nombre de places <span>(facultatif)</span><input min="1" type="number" value={draft.capacity ?? ''}
                                                                onChange={(e) => setDraft({
                                                                    ...draft,
                                                                    capacity: e.target.value ? Number(e.target.value) : null
                                                                })}/></label>
        {error && <p className={styles.formError} role="alert">{error}</p>}
        <div className={styles.formActions}>
            <button type="button" className={styles.secondaryButton} onClick={onCancel}>Annuler</button>
            <button type="submit" className={styles.primaryButton}>Enregistrer</button>
        </div>
    </form>
}

export default function ProgrammePage() {
    const {user} = useAuth();
    const isAdmin = user?.role?.name === 'admin'
    const [events, setEvents] = useState(loadEvents);
    const [editing, setEditing] = useState<ProgramEvent | 'new' | null>(null);
    const [notice, setNotice] = useState('')
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
        } catch { /* Keep the in-memory experience functional. */
        }
    }, [events])
    const futureEvents = useMemo(() => events.filter((event) => new Date(event.endsAt).getTime() > Date.now()).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()), [events])

    function saveEvent(draft: EventDraft) {
        const normalized = {
            ...draft,
            startsAt: new Date(draft.startsAt).toISOString(),
            endsAt: new Date(draft.endsAt).toISOString()
        };
        if (editing === 'new') {
            setEvents((current) => [...current, {...normalized, id: crypto.randomUUID(), participantIds: []}]);
            setNotice('L’évènement a été ajouté au programme.')
        } else if (editing) {
            setEvents((current) => current.map((event) => event.id === editing.id ? {...event, ...normalized} : event));
            setNotice('L’évènement a été modifié.')
        }
        setEditing(null)
    }

    function removeEvent(event: ProgramEvent) {
        if (!window.confirm(`Supprimer « ${event.name} » ?`)) return;
        setEvents((current) => current.filter(({id}) => id !== event.id));
        setNotice('L’évènement a été supprimé.')
    }

    function toggleRegistration(event: ProgramEvent) {
        if (!user) return;
        const registered = event.participantIds.includes(user.id);
        if (!registered && event.capacity !== null && event.participantIds.length >= event.capacity) return;
        setEvents((current) => current.map((item) => item.id === event.id ? {
            ...item,
            participantIds: registered ? item.participantIds.filter((id) => id !== user.id) : [...item.participantIds, user.id]
        } : item));
        setNotice(registered ? 'Votre inscription a été annulée.' : 'Votre inscription est confirmée !')
    }

    const formatDate = (value: string) => new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));
    const formatTime = (value: string) => new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value))
    return <div className={styles.page}>
        <SEOHead title="Programme"
                 description="Découvrez les prochains temps forts des 24h Extia Gaming et inscrivez-vous."
                 canonicalPath="/programme"/>
        <header className={styles.hero}>
            <div><p className={styles.eyebrow}>Extia Gaming 24h</p><h1>Le programme</h1><p>Retrouvez tous les
                rendez-vous à venir et réservez votre place.</p></div>
            {isAdmin &&
                <button className={styles.primaryButton} type="button" onClick={() => setEditing('new')}>＋ Ajouter un
                    évènement</button>}</header>
        {notice && <div className={styles.notice} role="status"><span>{notice}</span>
            <button type="button" onClick={() => setNotice('')} aria-label="Fermer la notification">×</button>
        </div>}
        {futureEvents.length === 0 ?
            <div className={styles.empty}><span>📅</span><h2>Le programme arrive bientôt</h2><p>Aucun évènement à venir
                pour le moment.</p></div> :
            <ol className={styles.timeline} aria-label="Évènements à venir">{futureEvents.map((event) => {
                const registered = !!user && event.participantIds.includes(user.id);
                const full = event.capacity !== null && event.participantIds.length >= event.capacity;
                return <li className={styles.event} key={event.id}>
                    <div className={styles.time}>
                        <strong>{formatTime(event.startsAt)}</strong><span>à {formatTime(event.endsAt)}</span></div>
                    <article className={registered ? `${styles.card} ${styles.registered}` : styles.card}>
                        <div className={styles.cardTop}>
                            <div><p className={styles.date}>{formatDate(event.startsAt)}</p><h2>{event.name}</h2></div>
                            {registered && <span className={styles.registeredBadge}>✓ Inscrit</span>}</div>
                        <p className={styles.description}>{event.description}</p>
                        <div className={styles.meta}><span>⌖ {event.location}</span>{event.capacity !== null &&
                            <span>♟ {event.participantIds.length} / {event.capacity} places</span>}</div>
                        <div className={styles.actions}>{isAdmin ? <>
                            <button className={styles.secondaryButton} type="button"
                                    onClick={() => setEditing(event)}>Modifier
                            </button>
                            <button className={styles.dangerButton} type="button"
                                    onClick={() => removeEvent(event)}>Supprimer
                            </button>
                        </> : user ? <button className={registered ? styles.secondaryButton : styles.primaryButton}
                                             disabled={!registered && full} type="button"
                                             onClick={() => toggleRegistration(event)}>{registered ? 'Se désinscrire' : full ? 'Complet' : 'S’inscrire'}</button> :
                            <Link className={styles.primaryButton} to="/login" state={{from: '/programme'}}>Se connecter
                                pour s’inscrire</Link>}</div>
                    </article>
                </li>
            })}</ol>}
        <Modal open={editing !== null} title={editing === 'new' ? 'Ajouter un évènement' : 'Modifier l’évènement'}
               onClose={() => setEditing(null)}>{editing && <EventForm
            initialValue={editing === 'new' ? emptyDraft() : {
                name: editing.name,
                description: editing.description,
                location: editing.location,
                startsAt: toLocalInputValue(new Date(editing.startsAt)),
                endsAt: toLocalInputValue(new Date(editing.endsAt)),
                capacity: editing.capacity
            }} onSubmit={saveEvent} onCancel={() => setEditing(null)}/>}</Modal>
    </div>
}