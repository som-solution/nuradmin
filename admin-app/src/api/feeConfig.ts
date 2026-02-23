import { apiClient } from './client'
import type { FeeConfig, UpsertFeeConfigRequest } from '@/types'

export const feeConfigApi = {
  list: () => apiClient.get<FeeConfig[]>('/admin/fee-config'),

  upsert: (body: UpsertFeeConfigRequest) =>
    apiClient.put<FeeConfig>('/admin/fee-config', body),
}
