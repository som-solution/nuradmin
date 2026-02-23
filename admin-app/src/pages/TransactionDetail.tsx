import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { transactionsApi } from '@/api/transactions'
import { useRefundTransaction, useRetryPayout, useCancelTransaction } from '@/hooks/api/useTransactions'
import { useCan } from '@/hooks/useCan'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, RefreshCw, RotateCcw, XCircle } from 'lucide-react'

export function TransactionDetail() {
  const { id } = useParams<{ id: string }>()
  const can = useCan()
  const { data: page, isLoading } = useQuery({
    queryKey: ['admin', 'transactions', id],
    queryFn: async () => {
      const res = await transactionsApi.list({ page: 0, size: 100 })
      const found = res.data.content?.find((t) => t.id === id)
      if (found) return found
      // Try without filter - some backends support search by id
      const r2 = await transactionsApi.list({ page: 0, size: 500 })
      return r2.data.content?.find((t) => t.id === id) ?? null
    },
    enabled: !!id,
  })
  const refundTx = useRefundTransaction()
  const retryPayout = useRetryPayout()
  const cancelTx = useCancelTransaction()
  const tx = page ?? null

  if (!id) return <div>Missing transaction ID</div>
  if (isLoading && !tx) return <div>Loading...</div>
  if (!tx) return <div>Transaction not found</div>

  const canAct =
    !['REFUNDED', 'CANCELLED'].includes(tx.status) &&
    (can.canRefund || can.canCancel || can.canRetryPayout)

  return (
    <div>
      <Link to="/transactions" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Transactions
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Transaction {tx.id.slice(0, 8)}...</h1>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Details</CardTitle>
          <Badge variant="outline">{tx.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Amount:</span> {tx.amount} {tx.currency}</p>
          <p><span className="text-muted-foreground">Receive:</span> {tx.receiveAmount ?? '—'} {tx.receiveCurrency ?? ''}</p>
          <p><span className="text-muted-foreground">Fee:</span> {tx.fee ?? '—'}</p>
          <p><span className="text-muted-foreground">Failure reason:</span> {tx.failureReason ?? '—'}</p>
          <p><span className="text-muted-foreground">Created:</span> {formatDate(tx.createdAt)}</p>
        </CardContent>
      </Card>

      {canAct && (
        <div className="flex gap-2">
          {can.canRetryPayout && tx.status === 'PAYOUT_FAILED' && (
            <Button
              variant="outline"
              onClick={() => retryPayout.mutate(tx.id)}
              disabled={retryPayout.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Retry payout
            </Button>
          )}
          {can.canRefund && (
            <Button
              variant="outline"
              onClick={() => refundTx.mutate({ transactionId: tx.id })}
              disabled={refundTx.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Refund
            </Button>
          )}
          {can.canCancel && (
            <Button
              variant="outline"
              onClick={() => cancelTx.mutate({ transactionId: tx.id })}
              disabled={cancelTx.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" /> Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
