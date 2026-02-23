import { apiClient } from './client'
import type { ProviderStatus } from '@/types'

export const providerApi = {
  setEnabled: (providerCode: string, enabled: boolean, reason?: string) =>
    apiClient.put<ProviderStatus>(`/admin/provider/${providerCode}`, null, {
      params: { enabled, ...(reason ? { reason } : {}) },
    }),
}
