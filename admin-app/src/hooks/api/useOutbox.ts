import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { outboxApi, type OutboxParams } from '@/api/outbox'

export function useOutbox(params?: OutboxParams) {
  return useQuery({
    queryKey: ['admin', 'outbox', params],
    queryFn: () => outboxApi.list(params).then((r) => r.data),
  })
}

export function useProcessOutboxEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (eventId: string) => outboxApi.process(eventId).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'outbox'] }),
  })
}
