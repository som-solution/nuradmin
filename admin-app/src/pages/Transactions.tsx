import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTransactions, useRefundTransaction, useRetryPayout, useCancelTransaction } from '@/hooks/api/useTransactions'
import { useCan } from '@/hooks/useCan'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import type { Transaction, TransactionStatus } from '@/types'
import { RefreshCw, RotateCcw, XCircle } from 'lucide-react'

const STATUS_OPTIONS: { value: TransactionStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PAYMENT_RECEIVED', label: 'Payment Received' },
  { value: 'PAYOUT_INITIATED', label: 'Payout Initiated' },
  { value: 'PAYOUT_SUCCESS', label: 'Payout Success' },
  { value: 'PAYOUT_FAILED', label: 'Payout Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export function Transactions() {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)
  const [status, setStatus] = useState<TransactionStatus | ''>('')
  const can = useCan()
  const { data, isLoading } = useTransactions({
    page,
    size,
    status: status || undefined,
    sort: 'createdAt,desc',
  })
  const refundTx = useRefundTransaction()
  const retryPayout = useRetryPayout()
  const cancelTx = useCancelTransaction()

  const content = data?.content ?? []
  const totalElements = data?.totalElements ?? 0

  const columns: Column<Transaction>[] = [
    {
      id: 'id',
      header: 'ID',
      cell: (r) => (
        <Link to={`/transactions/${r.id}`} className="text-primary hover:underline font-mono text-xs">
          {r.id.slice(0, 8)}...
        </Link>
      ),
    },
    { id: 'amount', header: 'Amount', cell: (r) => `${r.amount} ${r.currency}` },
    {
      id: 'receive',
      header: 'Receive',
      cell: (r) =>
        r.receiveAmount != null ? `${r.receiveAmount} ${r.receiveCurrency ?? ''}` : '—',
    },
    { id: 'status', header: 'Status', cell: (r) => <Badge variant="outline">{r.status}</Badge> },
    { id: 'failureReason', header: 'Failure', cell: (r) => r.failureReason ?? '—' },
    { id: 'createdAt', header: 'Created', cell: (r) => formatDate(r.createdAt) },
    {
      id: 'actions',
      header: 'Actions',
      cell: (r) => (
        <span className="flex flex-wrap gap-1">
          {can.canRetryPayout && r.status === 'PAYOUT_FAILED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => retryPayout.mutate(r.id)}
              disabled={retryPayout.isPending}
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          )}
          {can.canRefund && !['REFUNDED', 'CANCELLED'].includes(r.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refundTx.mutate({ transactionId: r.id })}
              disabled={refundTx.isPending}
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Refund
            </Button>
          )}
          {can.canCancel && !['REFUNDED', 'CANCELLED'].includes(r.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => cancelTx.mutate({ transactionId: r.id })}
              disabled={cancelTx.isPending}
            >
              <XCircle className="h-3 w-3 mr-1" /> Cancel
            </Button>
          )}
        </span>
      ),
    },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Transactions</h1>
      <div className="mb-4 flex gap-2">
        <Select
          value={status}
          onChange={(e) => {
            setStatus((e.target.value || '') as TransactionStatus | '')
            setPage(0)
          }}
          className="w-48"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || 'all'} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
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
