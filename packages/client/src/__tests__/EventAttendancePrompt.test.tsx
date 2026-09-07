import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react'
import EventAttendancePrompt from '../components/programme/EventAttendancePrompt.tsx'

const mocks = vi.hoisted(() => ({events: vi.fn(), confirm: vi.fn()}))
vi.mock('../hooks/useEvents.ts', () => ({
    useEvents: () => ({data: mocks.events()}),
    useConfirmEventAttendance: () => ({mutateAsync: mocks.confirm, isPending: false}),
}))

const event = {id: 3, name: 'Tournoi', isRegistered: true, myAttendance: null,
    startsAt: '2026-09-07T10:00:00Z', endsAt: '2026-09-07T12:00:00Z'}

describe('EventAttendancePrompt', () => {
    beforeEach(() => {
        vi.setSystemTime(new Date('2026-09-07T11:00:00Z'))
        mocks.events.mockReturnValue([event])
        mocks.confirm.mockReset().mockResolvedValue({})
    })
    afterEach(() => { vi.useRealTimers() })

    it.each([true, false])('envoie la réponse %s pour l’événement', async (isPresent) => {
        render(<EventAttendancePrompt userId={7}/>)
        fireEvent.click(screen.getByRole('button', {name: isPresent ? 'Oui, je suis présent' : 'Non, je suis absent'}))
        await waitFor(() => expect(mocks.confirm).toHaveBeenCalledWith({eventId: 3, isPresent}))
    })

    it.each([
        {...event, isRegistered: false}, {...event, myAttendance: false},
        {...event, myAttendance: true}, {...event, startsAt: '2026-09-07T11:30:00Z'},
        {...event, endsAt: '2026-09-07T11:00:00Z'},
    ])('ne sollicite pas un événement non éligible %#', (item) => {
        mocks.events.mockReturnValue([item])
        render(<EventAttendancePrompt userId={7}/>)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('apparaît au début sans recharger la page et peut être reportée', () => {
        vi.useRealTimers()
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-09-07T09:59:59Z'))
        render(<EventAttendancePrompt userId={7}/>)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        act(() => vi.advanceTimersByTime(1000))
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', {name: 'Plus tard'}))
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(mocks.confirm).not.toHaveBeenCalled()
        act(() => vi.advanceTimersByTime(300_000))
        expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
})
