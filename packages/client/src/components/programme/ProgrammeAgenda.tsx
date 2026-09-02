import {useEffect, useMemo, useState} from 'react'
import {Link} from 'react-router-dom'
import {useAuth} from '../../hooks/useAuth.ts'
import {useEvents} from '../../hooks/useEvents.ts'
import {
    DAY_MINUTES,
    getCoveredDayKeys,
    getDayStart,
    HOUR_HEIGHT,
    layoutEvents,
    toDayKey,
} from './agenda.utils.ts'
import styles from './ProgrammeAgenda.module.css'

const HOURS = Array.from({length: 24}, (_, hour) => hour)

export default function ProgrammeAgenda() {
    const {user} = useAuth()
    const {data: events = [], isLoading, isError} = useEvents(user?.id)

    const availableDays = useMemo(
        () => [...new Set(events.flatMap(getCoveredDayKeys))].sort(),
        [events],
    )
    const [selectedDay, setSelectedDay] = useState('')

    useEffect(() => {
        if (availableDays.length === 0) {
            setSelectedDay('')
            return
        }
        if (!availableDays.includes(selectedDay)) {
            const today = toDayKey(new Date())
            setSelectedDay(availableDays.includes(today) ? today : availableDays[0])
        }
    }, [availableDays, selectedDay])

    const positionedEvents = useMemo(
        () => selectedDay ? layoutEvents(events, selectedDay) : [],
        [events, selectedDay],
    )

    if (isLoading) return <p className={styles.state} aria-live="polite">Chargement de l’agenda…</p>
    if (isError) return <p className={styles.error} role="alert">Impossible de charger l’agenda.</p>
    if (events.length === 0) return <p className={styles.state}>Aucun évènement programmé.</p>
    if (!selectedDay) return <p className={styles.state} aria-live="polite">Préparation de l’agenda…</p>

    const dayStart = getDayStart(selectedDay)
    const todayKey = toDayKey(new Date())
    const now = new Date()
    const currentMinute = now.getHours() * 60 + now.getMinutes()
    const currentTimeTop = (currentMinute / DAY_MINUTES) * (24 * HOUR_HEIGHT)

    return <div className={styles.agenda}>
        <nav className={styles.dayPicker} aria-label="Choisir une journée">
            {availableDays.map((day) =>
                <button key={day} type="button" className={day === selectedDay ? styles.activeDay : ''}
                    aria-pressed={day === selectedDay} onClick={() => setSelectedDay(day)}>
                    {new Intl.DateTimeFormat('fr-FR', {weekday: 'short', day: 'numeric', month: 'short'})
                        .format(getDayStart(day))}
                </button>)}
        </nav>

        <div className={styles.viewport} role="region" aria-label={`Agenda du ${dayStart.toLocaleDateString('fr-FR')}`}
            tabIndex={0}>
            <div className={styles.timeline} style={{height: 24 * HOUR_HEIGHT}}>
                <div className={styles.hours} aria-hidden="true">
                    {HOURS.map((hour) => <div className={styles.hour} key={hour}>{String(hour).padStart(2, '0')}:00</div>)}
                </div>
                <div className={styles.eventsCanvas}>
                    {selectedDay === todayKey && <div className={styles.nowLine} style={{top: currentTimeTop}}>
                        <span>{new Intl.DateTimeFormat('fr-FR', {hour: '2-digit', minute: '2-digit'}).format(now)}</span>
                    </div>}
                    {positionedEvents.map(({event, top, height, left, width}) => {
                        const currentTime = Date.now()
                        const hasEnded = new Date(event.endsAt).getTime() <= currentTime
                        const isOngoing = new Date(event.startsAt).getTime() <= currentTime && !hasEnded
                        const eventClass = [styles.eventCard, hasEnded ? styles.ended : '', isOngoing ? styles.ongoing : '']
                            .filter(Boolean).join(' ')

                        return <Link key={event.id} to={`/programme/${event.id}`} className={eventClass}
                            aria-label={`Voir les détails de ${event.name}`}
                            style={{top, height, left: `${left}%`, width: `${width}%`}}>
                            <p className={styles.eventTime}>
                                {formatTime(event.startsAt)} – {formatTime(event.endsAt)}
                                {isOngoing && <span>En cours</span>}
                            </p>
                            <h3>{event.name}</h3>
                            {event.videoGame && <p className={styles.game}>🎮 {event.videoGame.nom}</p>}
                        </Link>
                    })}
                </div>
            </div>
        </div>
        <Link className={styles.programmeLink} to="/programme">Voir le programme détaillé →</Link>
    </div>
}

function formatTime(value: string) {
    return new Intl.DateTimeFormat('fr-FR', {hour: '2-digit', minute: '2-digit'}).format(new Date(value))
}
