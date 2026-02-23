import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAudit } from '@/hooks/api/useAudit'
import { DataTable, type Column } from '@/components/DataTable'
import { formatDate } from '@/lib/utils'
import type { AuditLog } from '@/types'

export function Audit() {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const { data, isLoading } = useAudit({ page, size, sort: 'createdAt,desc' })

  const content = data?.content ?? []
  const totalElements = data?.totalElements ?? 0

  const columns: Column<AuditLog>[] = [
    { id: 'createdAt', header: 'Time', cell: (r) => formatDate(r.createdAt) },
    { id: 'eventType', header: 'Event', cell: (r) => r.eventType },
    { id: 'entityType', header: 'Entity type', cell: (r) => r.entityType },
    {
      id: 'entityId',
      header: 'Entity',
      cell: (r) => (
        <Link
          to={`/audit/entity/${encodeURIComponent(r.entityType)}/${encodeURIComponent(r.entityId)}`}
          className="text-primary hover:underline font-mono text-xs"
        >
          {r.entityId.slice(0, 8)}...
        </Link>
      ),
    },
    { id: 'actorEmail', header: 'Actor', cell: (r) => r.actorEmail ?? r.actorId ?? '—' },
    { id: 'adminType', header: 'Role', cell: (r) => r.adminType ?? '—' },
    { id: 'reason', header: 'Reason', cell: (r) => r.reason ?? '—' },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Audit logs</h1>
      <DataTable
        columns={columns}
        data={content}
        totalElements={totalElements}
        page={page}
        size={size}
        onPageChange={setPage}
        onSizeChange={setSize}
        isLoading={isLoading}
      />
    </div>
  )
}
