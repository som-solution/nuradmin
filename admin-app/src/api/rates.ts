import { apiClient } from './client'
import type { ExchangeRate, UpsertRateRequest } from '@/types'

export const ratesApi = {
  list: () => apiClient.get<ExchangeRate[]>('/admin/rates'),

  upsert: (body: UpsertRateRequest) =>
    apiClient.put<{ id: string; sendCurrency: string; receiveCurrency: string; rate: number }>(
      '/admin/rates',
      body
    ),
}
