import { apiClient } from './client'
import type { Page, Transaction, TransactionStatus } from '@/types'

export interface TransactionsParams {
  page?: number
  size?: number
  sort?: string
  status?: TransactionStatus
}

export const transactionsApi = {
  list: (params?: TransactionsParams) =>
    apiClient.get<Page<Transaction>>('/admin/transactions', {
      params: { page: 0, size: 20, ...params },
    }),

  refund: (transactionId: string, reason?: string) =>
    apiClient.post<{ transactionId: string; status: string }>(
      `/admin/transactions/${transactionId}/refund`,
      null,
      { params: reason ? { reason } : {} }
    ),

  retry: (transactionId: string) =>
    apiClient.post<{ transactionId: string; status: string }>(
      `/admin/transactions/${transactionId}/retry`
    ),

  cancel: (transactionId: string, reason?: string) =>
    apiClient.post<{ transactionId: string; status: string }>(
      `/admin/transactions/${transactionId}/cancel`,
      null,
      { params: reason ? { reason } : {} }
    ),
}
