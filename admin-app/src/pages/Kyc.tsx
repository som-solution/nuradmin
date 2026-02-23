import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocuments } from '@/hooks/api/useDocuments'
import { DataTable, type Column } from '@/components/DataTable'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { UserDocument } from '@/types'

export function Kyc() {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('PENDING')
  const { data, isLoading } = useDocuments({
    page,
    size,
    status: status || undefined,
  })

  const content = data?.content ?? []
  const totalElements = data?.totalElements ?? 0

  const columns: Column<UserDocument>[] = [
    { id: 'id', header: 'ID', cell: (r) => <span className="font-mono text-xs">{r.id.slice(0, 8)}...</span> },
    { id: 'userId', header: 'User ID', cell: (r) => <Link to={`/users/${r.userId}`} className="text-primary hover:underline font-mono text-xs">{r.userId.slice(0, 8)}...</Link> },
    { id: 'documentType', header: 'Type', cell: (r) => r.documentType },
    { id: 'status', header: 'Status', cell: (r) => <Badge>{r.status}</Badge> },
    { id: 'uploadedAt', header: 'Uploaded', cell: (r) => formatDate(r.uploadedAt) },
    {
      id: 'actions',
      header: 'Action',
      cell: (r) =>
        r.status === 'PENDING' ? (
          <Link to={`/kyc/${r.id}`} className="text-primary hover:underline">Review</Link>
        ) : (
          <Link to={`/kyc/${r.id}`} className="text-muted-foreground hover:underline">View</Link>
        ),
    },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">KYC Documents</h1>
      <div className="mb-4 flex gap-2">
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={status}
          onChange={(e) => {
            setStatus((e.target.value || '') as 'PENDING' | 'APPROVED' | 'REJECTED' | '')
            setPage(0)
          }}
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </select>
      </div>
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
