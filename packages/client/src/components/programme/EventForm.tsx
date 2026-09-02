import {useState, type FormEvent} from 'react'
import type {CreateEventInput} from '@extia-gaming/shared'
import type {GameWithScore} from '../../hooks/useGames.ts'
import styles from '../../pages/ProgrammePage.module.css'

export type EventDraft = Pick<
    CreateEventInput,
    'name' | 'description' | 'startsAt' | 'endsAt' | 'maxPlaces' | 'videoGameId'
>

export function toLocalInputValue(date: Date) {
    const offset = date.getTimezoneOffset() * 60_000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function createEmptyEventDraft(): EventDraft {
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

interface EventFormProps {
    initialValue: EventDraft
    initialGameName: string
    games: GameWithScore[]
    gamesLoading: boolean
    isSaving: boolean
    onSubmit: (draft: EventDraft) => Promise<void>
    onCancel: () => void
}

export default function EventForm({
    initialValue,
    initialGameName,
    games,
    gamesLoading,
    isSaving,
    onSubmit,
    onCancel,
}: EventFormProps) {
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
            onChange={(event) => setDraft({...draft, description: event.target.value})}/></label>
        <label>Jeu vidéo associé <span>(facultatif)</span>
            <div className={styles.gameSearch}>
                <input role="combobox" aria-autocomplete="list"
                    aria-expanded={matchingGames.length > 0 && !draft.videoGameId}
                    aria-controls="event-game-suggestions"
                    placeholder={gamesLoading ? 'Chargement des jeux…' : 'Rechercher un jeu…'}
                    disabled={gamesLoading} value={gameSearch}
                    onChange={(event) => {
                        setGameSearch(event.target.value)
                        setDraft({...draft, videoGameId: null})
                    }}/>
                {matchingGames.length > 0 && !draft.videoGameId &&
                    <ul id="event-game-suggestions" className={styles.gameSuggestions} role="listbox">
                        {matchingGames.map((game) => <li key={game.id} role="option" aria-selected={false}>
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
            onChange={(event) => setDraft({...draft, maxPlaces: Number(event.target.value)})}/></label>
        {error && <p className={styles.formError} role="alert">{error}</p>}
        <div className={styles.formActions}>
            <button type="button" className={styles.secondaryButton} onClick={onCancel}>Annuler</button>
            <button type="submit" disabled={isSaving} className={styles.primaryButton}>
                {isSaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
        </div>
    </form>
}
