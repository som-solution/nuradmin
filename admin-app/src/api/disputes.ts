import { apiClient } from './client'
import type { Page, Dispute, DisputeStatus } from '@/types'

export interface DisputesParams {
  page?: number
  size?: number
  status?: DisputeStatus
}

export const disputesApi = {
  list: (params?: DisputesParams) =>
    apiClient.get<Page<Dispute>>('/admin/disputes', {
      params: { page: 0, size: 20, ...params },
    }),

  resolve: (disputeId: string, resolution: DisputeStatus, notes?: string) =>
    apiClient.post<{ disputeId: string; status: string }>(
      `/admin/disputes/${disputeId}/resolve`,
      null,
      { params: { resolution, ...(notes ? { notes } : {}) } }
    ),
}
