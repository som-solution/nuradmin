import { apiClient } from './client'
import type { Page, AuditLog } from '@/types'

export interface AuditParams {
  page?: number
  size?: number
  sort?: string
}

export interface AuditEntityParams {
  entityType: string
  entityId: string
  page?: number
  size?: number
  sort?: string
}

export const auditApi = {
  list: (params?: AuditParams) =>
    apiClient.get<Page<AuditLog>>('/admin/audit', {
      params: { page: 0, size: 20, sort: 'createdAt,desc', ...params },
    }),

  byEntity: (params: AuditEntityParams) =>
    apiClient.get<Page<AuditLog>>('/admin/audit/entity', {
      params: { page: 0, size: 20, ...params },
    }),
}
