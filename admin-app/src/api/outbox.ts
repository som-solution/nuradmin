import { apiClient } from './client'
import type { Page, OutboxEvent } from '@/types'

export interface OutboxParams {
  page?: number
  size?: number
}

export const outboxApi = {
  list: (params?: OutboxParams) =>
    apiClient.get<Page<OutboxEvent>>('/admin/outbox', {
      params: { page: 0, size: 20, ...params },
    }),

  process: (eventId: string) =>
    apiClient.post<{ message: string }>(`/admin/outbox/${eventId}/process`),
}
