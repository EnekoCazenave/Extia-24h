import type {ProgramEvent} from '@extia-gaming/shared'

export const HOUR_HEIGHT = 64
export const DAY_MINUTES = 24 * 60

export interface PositionedEvent {
    event: ProgramEvent
    top: number
    height: number
    left: number
    width: number
}

export function toDayKey(value: string | Date) {
    const date = typeof value === 'string' ? new Date(value) : value
    const pad = (number: number) => String(number).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function getDayStart(dayKey: string) {
    return new Date(`${dayKey}T00:00:00`)
}

export function getCoveredDayKeys(event: ProgramEvent) {
    const end = new Date(event.endsAt)
    const cursor = getDayStart(toDayKey(event.startsAt))
    const days: string[] = []

    while (cursor < end) {
        days.push(toDayKey(cursor))
        cursor.setDate(cursor.getDate() + 1)
    }

    return days
}

export function layoutEvents(events: ProgramEvent[], dayKey: string): PositionedEvent[] {
    const dayStart = getDayStart(dayKey)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const eventsInDay = events
        .filter((event) => new Date(event.startsAt) < dayEnd && new Date(event.endsAt) > dayStart)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())

    const laneEnds: number[] = []
    const withLanes = eventsInDay.map((event) => {
        const start = Math.max(new Date(event.startsAt).getTime(), dayStart.getTime())
        const end = Math.min(new Date(event.endsAt).getTime(), dayEnd.getTime())
        let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start)
        if (lane === -1) lane = laneEnds.length
        laneEnds[lane] = end
        return {event, start, end, lane}
    })

    const laneCount = Math.max(laneEnds.length, 1)
    const minuteHeight = HOUR_HEIGHT / 60

    return withLanes.map(({event, start, end, lane}) => ({
        event,
        top: ((start - dayStart.getTime()) / 60_000) * minuteHeight,
        height: Math.max(((end - start) / 60_000) * minuteHeight, 34),
        left: (lane / laneCount) * 100,
        width: 100 / laneCount,
    }))
}
