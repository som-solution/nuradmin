import { useState } from 'react'
import { useDisputes, useResolveDispute } from '@/hooks/api/useDisputes'
import { DataTable, type Column } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import type { Dispute, DisputeStatus } from '@/types'

const RESOLUTIONS: DisputeStatus[] = ['RESOLVED_REFUND', 'RESOLVED_NO_REFUND', 'CLOSED']

export function Disputes() {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [status, setStatus] = useState<DisputeStatus | ''>('OPEN')
  const { data, isLoading } = useDisputes({ page, size, status: status || undefined })
  const resolveDispute = useResolveDispute()
  const content = data?.content ?? []
  const totalElements = data?.totalElements ?? 0

  const columns: Column<Dispute>[] = [
    { id: 'id', header: 'ID', cell: (r) => <span className="font-mono text-xs">{r.id.slice(0, 8)}...</span> },
    { id: 'transactionId', header: 'Transaction', cell: (r) => r.transactionId?.slice(0, 8) ?? '—' },
    { id: 'status', header: 'Status', cell: (r) => <Badge>{r.status}</Badge> },
    { id: 'createdAt', header: 'Created', cell: (r) => formatDate(r.createdAt) },
    {
      id: 'actions',
      header: 'Resolve',
      cell: (r) => {
        if (['RESOLVED_REFUND', 'RESOLVED_NO_REFUND', 'CLOSED'].includes(r.status)) return '—'
        return (
          <select
            className="rounded border px-2 py-1 text-sm"
            onChange={(e) => {
              const res = e.target.value as DisputeStatus
              if (res) resolveDispute.mutate({ disputeId: r.id, resolution: res })
              e.target.value = ''
            }}
          >
            <option value="">Resolve...</option>
            {RESOLUTIONS.map((res) => <option key={res} value={res}>{res}</option>)}
          </select>
        )
      },
    },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Disputes</h1>
      <div className="mb-4">
        <Select value={status} onChange={(e) => { setStatus((e.target.value || '') as DisputeStatus | ''); setPage(0); }} className="w-48">
          <option value="OPEN">Open</option>
          <option value="IN_REVIEW">In review</option>
          <option value="RESOLVED_REFUND">Resolved refund</option>
          <option value="RESOLVED_NO_REFUND">Resolved no refund</option>
          <option value="CLOSED">Closed</option>
          <option value="">All</option>
        </Select>
      </div>
      <DataTable columns={columns} data={content} totalElements={totalElements} page={page} size={size} onPageChange={setPage} onSizeChange={setSize} isLoading={isLoading} />
    </div>
  )
}
