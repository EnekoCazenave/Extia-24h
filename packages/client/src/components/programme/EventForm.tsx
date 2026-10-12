import { usePlatform } from '../../hooks/usePlatform.ts'
import {useState, type FormEvent} from 'react'
import type {CreateEventInput} from '@extia-gaming/shared'
import type {GameWithScore} from '../../hooks/useGames.ts'
import styles from '../../pages/ProgrammePage.module.css'

export type EventDraft = Pick<
    CreateEventInput,
    'name' | 'description' | 'startsAt' | 'endsAt' | 'maxPlaces' | 'videoGameId' | 'pointsEarned' | 'twitchUrl' | 'winnerShare' | 'notifyPush' | 'notifyEmail' | 'notifyDiscord' | 'reminderMinutes'
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
        notifyPush: true, notifyEmail: false, notifyDiscord: false, reminderMinutes: 10,
        description: '',
        startsAt: toLocalInputValue(start),
        endsAt: toLocalInputValue(end),
        maxPlaces: 1,
        pointsEarned: 1,
        twitchUrl: null,
        winnerShare: 0.05,
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
    const channels=usePlatform<{publicKey:string|null;emailReady:boolean;discordReady:boolean}>('/api/notifications/config').data
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
        <label>Nombre de points gagnés<input required min="0.000001" max="100000" step="any" type="number" value={draft.pointsEarned}
            onChange={(event) => setDraft({...draft, pointsEarned: Number(event.target.value)})}/></label>
        <label>Lien Twitch (facultatif)<input type="url" value={draft.twitchUrl??''} onChange={e=>setDraft({...draft,twitchUrl:e.target.value||null})}/></label>
        <label>Part du pot réservée au gagnant (%)<input type="number" min="0" max="100" step="any" value={(draft.winnerShare??0.05)*100} onChange={e=>setDraft({...draft,winnerShare:Number(e.target.value)/100})}/></label>
        <p>Chaque présence confirmée alimente le pot. Par défaut, 95 % sont partagés et 5 % reviennent au gagnant. Les points sont distribués après la fin par l’organisation.</p>
        <fieldset className={styles.notificationSettings}><legend>Rappel avant le début</legend>
          <label>Délai du rappel (minutes avant le début)<input required type="number" min="0" max="10080" step="1" value={draft.reminderMinutes??10} onChange={e=>setDraft({...draft,reminderMinutes:Number(e.target.value)})}/></label>
          <p>0 = au début de l’événement. Maximum : 7 jours. Ce délai s’applique aux canaux cochés.</p>
          <div className={styles.notificationOptions}>
            <label className={styles.notificationOption}>
              <input type="checkbox" checked={draft.notifyPush??true} onChange={e=>setDraft({...draft,notifyPush:e.target.checked})}/>
              <span><strong>Notification push aux inscrits</strong><small>{channels?.publicKey?'Sur les appareils abonnés':'Service à configurer'}</small></span>
            </label>
            <label className={styles.notificationOption}>
              <input type="checkbox" checked={draft.notifyEmail??false} onChange={e=>setDraft({...draft,notifyEmail:e.target.checked})}/>
              <span><strong>Email aux inscrits</strong><small>{channels?.emailReady?'Un email par participant inscrit':'Service à configurer'}</small></span>
            </label>
            <label className={styles.notificationOption}>
              <input type="checkbox" checked={draft.notifyDiscord??false} onChange={e=>setDraft({...draft,notifyDiscord:e.target.checked})}/>
              <span><strong>Message dans le salon Discord</strong><small>{channels?.discordReady?'Un message partagé dans le salon':'Webhook à configurer'}</small></span>
            </label>
          </div>
          <p>Les choix sont conservés même si le service n’est pas encore connecté. Le push nécessite l’autorisation du navigateur ; Discord publie un seul rappel dans le salon de l’événement.</p>
        </fieldset>
        {error && <p className={styles.formError} role="alert">{error}</p>}
        <div className={styles.formActions}>
            <button type="button" className={styles.secondaryButton} onClick={onCancel}>Annuler</button>
            <button type="submit" disabled={isSaving} className={styles.primaryButton}>
                {isSaving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
        </div>
    </form>
}
