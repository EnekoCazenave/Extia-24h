import {useState} from 'react'
import type {ProgramEvent} from '@extia-gaming/shared'
import EventCard from '../components/programme/EventCard.tsx'
import EventForm, {
    createEmptyEventDraft,
    toLocalInputValue,
    type EventDraft,
} from '../components/programme/EventForm.tsx'
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
import {useGames} from '../hooks/useGames.ts'
import styles from './ProgrammePage.module.css'
import {Link} from "react-router-dom";

export default function ProgrammePage() {
    const {user} = useAuth()
    const isAdmin = user?.role?.name === 'admin'
    const {data: events, isLoading, isError} = useEvents(user?.id)
    const {data: games, isLoading: gamesLoading} = useGames({enabled: isAdmin})
    const register = useRegisterToEvent()
    const unregister = useUnregisterFromEvent()
    const createEvent = useCreateEvent()
    const updateEvent = useUpdateEvent()
    const deleteEvent = useDeleteEvent()

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
        if (!user || new Date(event.startsAt).getTime() <= Date.now()) return
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

    const isSaving = createEvent.isPending || updateEvent.isPending
    const registrationPending = register.isPending || unregister.isPending

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
        {!isLoading && !isError && events?.length === 0 && <EmptyProgramme/>}

        {events && events.length > 0 &&
            <ol className={styles.timeline} aria-label="Programme des évènements">
                {events.map((event) =>
                    <EventCard key={event.id} event={event} isAdmin={isAdmin}
                    isAuthenticated={Boolean(user)} registrationPending={registrationPending}
                    deletionPending={deleteEvent.isPending} onEdit={setEditing} onDelete={removeEvent}
                    onToggleRegistration={toggleRegistration}/>
                ) }
            </ol>}

        <Modal open={editing !== null} title={editing === 'new' ? 'Ajouter un évènement' : 'Modifier l’évènement'}
            onClose={() => setEditing(null)}>
            {editing && <EventForm
                initialValue={editing === 'new' ? createEmptyEventDraft() : toEventDraft(editing)}
                initialGameName={editing === 'new' ? '' : editing.videoGame?.nom ?? ''}
                games={games ?? []} gamesLoading={gamesLoading} isSaving={isSaving}
                onSubmit={saveEvent} onCancel={() => setEditing(null)}/>} 
        </Modal>
    </div>
}

function EmptyProgramme() {
    return <div className={styles.empty}><span>📅</span><h2>Le programme arrive bientôt</h2>
        <p>Aucun évènement à venir pour le moment.</p></div>
}

function toEventDraft(event: ProgramEvent): EventDraft {
    return {
        name: event.name,
        description: event.description,
        startsAt: toLocalInputValue(new Date(event.startsAt)),
        endsAt: toLocalInputValue(new Date(event.endsAt)),
        maxPlaces: event.maxPlaces,
        videoGameId: event.videoGameId,
    }
}
