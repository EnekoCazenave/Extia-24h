import {useEffect, useState} from 'react'
import Modal from '../Modal.tsx'
import {useConfirmEventAttendance, useEvents} from '../../hooks/useEvents.ts'
import styles from '../../pages/ProgrammePage.module.css'

export default function EventAttendancePrompt({userId}: {userId: number}) {
    const {data: events} = useEvents(userId, {refetchInterval: 30_000})
    const confirmation = useConfirmEventAttendance()
    const [now, setNow] = useState(Date.now)
    const [deferred, setDeferred] = useState<Record<number, number>>({})
    const [error, setError] = useState('')

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000)
        return () => window.clearInterval(timer)
    }, [])

    const event = events?.find((item) => item.isRegistered && item.myAttendance === null &&
        new Date(item.startsAt).getTime() <= now && new Date(item.endsAt).getTime() > now &&
        (deferred[item.id] ?? 0) <= now)

    function defer() {
        if (!event || confirmation.isPending) return
        setDeferred((previous) => ({...previous, [event.id]: Date.now() + 5 * 60_000}))
        setError('')
    }

    async function confirm(isPresent: boolean) {
        if (!event) return
        setError('')
        try {
            await confirmation.mutateAsync({eventId: event.id, isPresent})
        } catch {
            setError('Impossible de confirmer votre présence. Réessayez si la demande est toujours disponible.')
        }
    }

    return <Modal open={Boolean(event)} title="Confirmez votre présence" onClose={defer}>
        <p>L’événement <strong>{event?.name}</strong> est en cours. Êtes-vous présent ?</p>
        {error && <p className={styles.formError} role="alert">{error}</p>}
        <div className={styles.formActions}>
            <button type="button" className={styles.secondaryButton} disabled={confirmation.isPending} onClick={defer}>Plus tard</button>
            <button type="button" className={styles.secondaryButton} disabled={confirmation.isPending} onClick={() => void confirm(false)}>Non, je suis absent</button>
            <button type="button" className={styles.primaryButton} disabled={confirmation.isPending} onClick={() => void confirm(true)}>Oui, je suis présent</button>
        </div>
        {confirmation.isPending && <p role="status">Enregistrement…</p>}
    </Modal>
}
