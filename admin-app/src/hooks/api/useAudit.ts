import { useQuery } from '@tanstack/react-query'
import { auditApi, type AuditParams, type AuditEntityParams } from '@/api/audit'

export function useAudit(params?: AuditParams) {
  return useQuery({
    queryKey: ['admin', 'audit', params],
    queryFn: () => auditApi.list(params).then((r) => r.data),
  })
}

export function useAuditByEntity(params: AuditEntityParams) {
  return useQuery({
    queryKey: ['admin', 'audit', 'entity', params],
    queryFn: () => auditApi.byEntity(params).then((r) => r.data),
    enabled: !!(params.entityType && params.entityId),
  })
}
