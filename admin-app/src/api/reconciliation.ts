import { apiClient } from './client'

export const reconciliationApi = {
  run: () =>
    apiClient.post<{ message: string }>('/admin/reconciliation/run'),
}
