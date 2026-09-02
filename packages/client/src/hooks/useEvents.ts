import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import type {CreateEventInput, ProgramEvent, UpdateEventInput} from '@extia-gaming/shared'
import {api} from '../services/api.ts'

export function useEvents(userId?: number) {
    return useQuery({
        queryKey: ['events', userId ?? 'anonymous'],
        queryFn: async () => {
            const response = await api.get<{events: ProgramEvent[]}>('/api/events')
            return response.data.events
        },
    })
}

function useInvalidateEvents() {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({queryKey: ['events']})
}

export function useRegisterToEvent() {
    const invalidateEvents = useInvalidateEvents()
    return useMutation({
        mutationFn: (eventId: number) => api.post(`/api/events/${eventId}/participation`),
        onSuccess: invalidateEvents,
    })
}

export function useUnregisterFromEvent() {
    const invalidateEvents = useInvalidateEvents()
    return useMutation({
        mutationFn: (eventId: number) => api.delete(`/api/events/${eventId}/participation`),
        onSuccess: invalidateEvents,
    })
}

export function useCreateEvent() {
    const invalidateEvents = useInvalidateEvents()
    return useMutation({
        mutationFn: (data: CreateEventInput) => api.post('/api/admin/events', data),
        onSuccess: invalidateEvents,
    })
}

export function useUpdateEvent() {
    const invalidateEvents = useInvalidateEvents()
    return useMutation({
        mutationFn: ({eventId, data}: {eventId: number; data: UpdateEventInput}) =>
            api.put(`/api/admin/events/${eventId}`, data),
        onSuccess: invalidateEvents,
    })
}

export function useDeleteEvent() {
    const invalidateEvents = useInvalidateEvents()
    return useMutation({
        mutationFn: (eventId: number) => api.delete(`/api/admin/events/${eventId}`),
        onSuccess: invalidateEvents,
    })
}
