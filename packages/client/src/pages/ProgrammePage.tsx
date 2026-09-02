import {useState, type FormEvent} from 'react'
import {Link} from 'react-router-dom'
import type {CreateEventInput, ProgramEvent} from '@extia-gaming/shared'
import Modal from '../components/Modal.tsx'
import SEOHead from '../components/SEOHead.tsx'
import {useAuth} from '../hooks/useAuth.ts'
import {
    useCreateEvent,
    useDeleteEvent,
    useEvents,
    useRegisterToEvent,
    useUnregisterFromEvent,
    useUpdateEvent,
} from '../hooks/useEvents.ts'
import {useGames, type GameWithScore} from '../hooks/useGames.ts'
import styles from './ProgrammePage.module.css'

type EventDraft = Pick<
    CreateEventInput,
    'name' | 'description' | 'startsAt' | 'endsAt' | 'maxPlaces' | 'videoGameId'
>

function toLocalInputValue(date: Date) {
    const offset = date.getTimezoneOffset() * 60_000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function emptyDraft(): EventDraft {
    const start = new Date(Date.now() + 3_600_000)
    const end = new Date(start.getTime() + 3_600_000)
    return {
        name: '',
        description: '',
        startsAt: toLocalInputValue(start),
        endsAt: toLocalInputValue(end),
        maxPlaces: 1,
        videoGameId: null,
    }
}

function EventForm({initialValue, initialGameName, games, gamesLoading, isSaving, onSubmit, onCancel}: {
    initialValue: EventDraft
    initialGameName: string
    games: GameWithScore[]
    gamesLoading: boolean
    isSaving: boolean
    onSubmit: (draft: EventDraft) => Promise<void>
    onCancel: () => void
}) {
    const [draft, setDraft] = useState(initialValue)
    const [gameSearch, setGameSearch] = useState(initialGameName)
    const [error, setError] = useState('')

    const normalizedSearch = gameSearch.trim().toLocaleLowerCase('fr')
    const matchingGames = normalizedSearch
        ? games.filter((game) => game.nom.toLocaleLowerCase('fr').includes(normalizedSearch)).slice(0, 6)
        : []

    async function submit(event: FormEvent) {
        event.preventDefault()
        if (new Date(draft.endsAt) <= new Date(draft.startsAt)) {
            setError('La fin doit être postérieure au début de l’évènement.')
            return
        }
        if (gameSearch.trim() && !draft.videoGameId) {
            setError('Sélectionnez un jeu dans la liste de suggestions.')
            return
        }

        setError('')
        await onSubmit({
            ...draft,
            name: draft.name.trim(),
            description: draft.description.trim(),
        })
    }

    return <form className={styles.form} onSubmit={submit}>
        <label>Nom de l’évènement<input required value={draft.name}
                                        onChange={(event) => setDraft({...draft, name: event.target.value})}/></label>
        <label>Description<textarea required rows={3} value={draft.description}
                                    onChange={(event) => setDraft({
                                        ...draft,
                                        description: event.target.value
                                    })}/></label>
        <label>Jeu vidéo associé <span>(facultatif)</span>
            <div className={styles.gameSearch}>
                <input
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={matchingGames.length > 0 && !draft.videoGameId}
                    aria-controls="event-game-suggestions"
                    placeholder={gamesLoading ? 'Chargement des jeux…' : 'Rechercher un jeu…'}
                    disabled={gamesLoading}
                    value={gameSearch}
                    onChange={(event) => {
                        setGameSearch(event.target.value)
                        setDraft({...draft, videoGameId: null})
                    }}
                />
                {matchingGames.length > 0 && !draft.videoGameId &&
                    <ul id="event-game-suggestions" className={styles.gameSuggestions} role="listbox">
                        {matchingGames.map((game) =>
                            <li key={game.id} role="option" aria-selected={false}>
                                <button type="button" onClick={() => {
                                    setGameSearch(game.nom)
                                    setDraft({...draft, videoGameId: game.id})
                                }}>
                                    {game.imageUrl && <img src={game.imageUrl} alt=""/>}
                                    <span>{game.nom}</span>
                                </button>
                            </li>)}
                    </ul>}
            </div>
            {draft.videoGameId && <span className={styles.selectedGame}>✓ Jeu sélectionné
                <button type="button" onClick={() => {
                    setGameSearch('')
                    setDraft({...draft, videoGameId: null})
                }}>Retirer</button>
            </span>}
        </label>
        <div className={styles.formRow}>
            <label>Début<input required type="datetime-local" value={draft.startsAt.slice(0, 16)}
                               onChange={(event) => setDraft({...draft, startsAt: event.target.value})}/></label>
            <label>Fin<input required type="datetime-local" value={draft.endsAt.slice(0, 16)}
                             onChange={(event) => setDraft({...draft, endsAt: event.target.value})}/></label>
        </div>
        <label>Nombre de places<input required min="1" type="number" value={draft.maxPlaces}
                                      onChange={(event) => setDraft({
                                          ...draft,
                                          maxPlaces: Number(event.target.value)
                                      })}/></label>
        {error && <p className={styles.formError} role="alert">{error}</p>}
        <div className={styles.formActions}>
            <button type="button" className={styles.secondaryButton} onClick={onCancel}>Annuler</button>
            <button type="submit" disabled={isSaving} className={styles.primaryButton}>
                {isSaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
        </div>
    </form>
}

export default function ProgrammePage() {
    const {user} = useAuth()
    const isAdmin = user?.role?.name === 'admin'
    const {data: events, isLoading, isError} = useEvents(user?.id)
    const register = useRegisterToEvent()
    const unregister = useUnregisterFromEvent()
    const createEvent = useCreateEvent()
    const updateEvent = useUpdateEvent()
    const deleteEvent = useDeleteEvent()
    const {data: games, isLoading: gamesLoading} = useGames({enabled: isAdmin})

    const [editing, setEditing] = useState<ProgramEvent | 'new' | null>(null)
    const [notice, setNotice] = useState('')
    const [actionError, setActionError] = useState('')

    async function saveEvent(draft: EventDraft) {
        const data = {
            ...draft,
            startsAt: new Date(draft.startsAt).toISOString(),
            endsAt: new Date(draft.endsAt).toISOString(),
        }

        try {
            setActionError('')
            if (editing === 'new') {
                await createEvent.mutateAsync(data)
                setNotice('L’évènement a été ajouté au programme.')
            } else if (editing) {
                await updateEvent.mutateAsync({eventId: editing.id, data})
                setNotice('L’évènement a été modifié.')
            }
            setEditing(null)
        } catch {
            setActionError('Impossible d’enregistrer l’évènement. Veuillez réessayer.')
        }
    }

    async function removeEvent(event: ProgramEvent) {
        if (!window.confirm(`Supprimer « ${event.name} » ?`)) return
        try {
            setActionError('')
            await deleteEvent.mutateAsync(event.id)
            setNotice('L’évènement a été supprimé.')
        } catch {
            setActionError('Impossible de supprimer l’évènement.')
        }
    }

    async function toggleRegistration(event: ProgramEvent) {
        if (!user) return
        if (new Date(event.startsAt).getTime() <= Date.now()) return
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

    const formatDate = (value: string) => new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    }).format(new Date(value))
    const formatTime = (value: string) => new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit', minute: '2-digit',
    }).format(new Date(value))

    const isSaving = createEvent.isPending || updateEvent.isPending

    return <div className={styles.page}>
        <SEOHead title="Programme"
                 description="Découvrez les prochains temps forts des 24h Extia Gaming et inscrivez-vous."
                 canonicalPath="/programme"/>
        <header className={styles.hero}>
            <div><p className={styles.eyebrow}>Extia Gaming 24h</p><h1>Le programme</h1>
                <p>Retrouvez tous les rendez-vous à venir et réservez votre place.</p></div>
            {isAdmin && <button className={styles.primaryButton} type="button"
                                onClick={() => setEditing('new')}>＋ Ajouter un évènement</button>}
        </header>

        {notice && <div className={styles.notice} role="status"><span>{notice}</span>
            <button type="button" onClick={() => setNotice('')} aria-label="Fermer la notification">×</button>
        </div>}
        {actionError && <p className={styles.formError} role="alert">{actionError}</p>}
        {isLoading && <p className={styles.empty} aria-live="polite">Chargement du programme…</p>}
        {isError && <p className={styles.formError} role="alert">Impossible de charger le programme.</p>}

        {!isLoading && !isError && events?.length === 0 &&
            <div className={styles.empty}><span>📅</span><h2>Le programme arrive bientôt</h2>
                <p>Aucun évènement à venir pour le moment.</p></div>}

        {events && events.length > 0 &&
            <ol className={styles.timeline} aria-label="Programme des évènements">{events.map((event) => {
                const now = Date.now()
                const hasStarted = new Date(event.startsAt).getTime() <= now
                const hasEnded = new Date(event.endsAt).getTime() <= now
                const isOngoing = hasStarted && !hasEnded
                const cardClassName = [
                    styles.card,
                    event.isRegistered ? styles.registered : '',
                    hasEnded ? styles.past : '',
                ].filter(Boolean).join(' ')

                return <li className={styles.event} key={event.id}>
                    <div className={styles.time}><strong>{formatTime(event.startsAt)}</strong>
                        <span>à {formatTime(event.endsAt)}</span></div>
                    <article className={cardClassName}>
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
                        <div className={styles.actions}>{isAdmin ? <>
                            <button className={styles.secondaryButton} type="button"
                                    onClick={() => setEditing(event)}>Modifier
                            </button>
                            <button className={styles.dangerButton} type="button"
                                    disabled={deleteEvent.isPending} onClick={() => removeEvent(event)}>Supprimer
                            </button>
                        </> : hasEnded ?
                            <button className={styles.secondaryButton} disabled type="button">Terminé</button> : isOngoing ?
                            <button className={styles.secondaryButton} disabled type="button">En cours</button> : user ?
                            <button className={event.isRegistered ? styles.secondaryButton : styles.primaryButton}
                                    disabled={(!event.isRegistered && event.isFull) || register.isPending || unregister.isPending}
                                    type="button" onClick={() => toggleRegistration(event)}>
                                {event.isRegistered ? 'Se désinscrire' : event.isFull ? 'Complet' : 'S’inscrire'}
                            </button> :
                            <Link className={styles.primaryButton} to="/login" state={{from: '/programme'}}>
                                Se connecter pour s’inscrire</Link>}
                        </div>
                    </article>
                </li>
            })}</ol>}

        <Modal open={editing !== null} title={editing === 'new' ? 'Ajouter un évènement' : 'Modifier l’évènement'}
               onClose={() => setEditing(null)}>{editing && <EventForm
                initialValue={editing === 'new' ? emptyDraft() : {
                name: editing.name,
                description: editing.description,
                startsAt: toLocalInputValue(new Date(editing.startsAt)),
                endsAt: toLocalInputValue(new Date(editing.endsAt)),
                    maxPlaces: editing.maxPlaces,
                    videoGameId: editing.videoGameId,
                }} initialGameName={editing === 'new' ? '' : editing.videoGame?.nom ?? ''}
                games={games ?? []} gamesLoading={gamesLoading} isSaving={isSaving}
                onSubmit={saveEvent} onCancel={() => setEditing(null)}/>}</Modal>
    </div>
}
