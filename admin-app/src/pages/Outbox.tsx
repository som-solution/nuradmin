import { useState } from 'react'
import { useOutbox, useProcessOutboxEvent } from '@/hooks/api/useOutbox'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { OutboxEvent } from '@/types'
import { Play } from 'lucide-react'

export function Outbox() {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const { data, isLoading } = useOutbox({ page, size })
  const processEvent = useProcessOutboxEvent()
  const content = data?.content ?? []
  const totalElements = data?.totalElements ?? 0

  const columns: Column<OutboxEvent>[] = [
    { id: 'id', header: 'ID', cell: (r) => <span className="font-mono text-xs">{r.id.slice(0, 8)}...</span> },
    { id: 'eventType', header: 'Event type', cell: (r) => r.eventType ?? '—' },
    { id: 'createdAt', header: 'Created', cell: (r) => formatDate(r.createdAt) },
    {
      id: 'actions',
      header: 'Action',
      cell: (r) => (
        <Button variant="outline" size="sm" onClick={() => processEvent.mutate(r.id)} disabled={processEvent.isPending}>
          <Play className="h-3 w-3 mr-1" /> Process
        </Button>
      ),
    },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Outbox</h1>
      <DataTable columns={columns} data={content} totalElements={totalElements} page={page} size={size} onPageChange={setPage} onSizeChange={setSize} isLoading={isLoading} emptyMessage="No pending events" />
    </div>
  )
}
