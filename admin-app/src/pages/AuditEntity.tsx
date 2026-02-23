import { useParams, Link } from 'react-router-dom'
import { useAuditByEntity } from '@/hooks/api/useAudit'
import { DataTable, type Column } from '@/components/DataTable'
import { formatDate } from '@/lib/utils'
import type { AuditLog } from '@/types'
import { ArrowLeft } from 'lucide-react'

export function AuditEntity() {
  const { entityType, entityId } = useParams<{ entityType: string; entityId: string }>()
  const { data, isLoading } = useAuditByEntity({
    entityType: entityType ?? '',
    entityId: entityId ?? '',
    page: 0,
    size: 50,
  })

  const content = data?.content ?? []
  const totalElements = data?.totalElements ?? 0

  const columns: Column<AuditLog>[] = [
    { id: 'createdAt', header: 'Time', cell: (r) => formatDate(r.createdAt) },
    { id: 'eventType', header: 'Event', cell: (r) => r.eventType },
    { id: 'actorEmail', header: 'Actor', cell: (r) => r.actorEmail ?? r.actorId ?? '—' },
    { id: 'adminType', header: 'Role', cell: (r) => r.adminType ?? '—' },
    { id: 'reason', header: 'Reason', cell: (r) => r.reason ?? '—' },
    { id: 'ipAddress', header: 'IP', cell: (r) => r.ipAddress ?? '—' },
  ]

  return (
    <div>
      <Link to="/audit" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Audit
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">
        Audit: {entityType} / {entityId}
      </h1>
      <DataTable
        columns={columns}
        data={content}
        totalElements={totalElements}
        isLoading={isLoading}
      />
    </div>
  )
}
