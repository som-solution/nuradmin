import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { transactionsApi, type TransactionsParams } from '@/api/transactions'

export function useTransactions(params?: TransactionsParams) {
  return useQuery({
    queryKey: ['admin', 'transactions', params],
    queryFn: () => transactionsApi.list(params).then((r) => r.data),
  })
}

export function useRefundTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ transactionId, reason }: { transactionId: string; reason?: string }) =>
      transactionsApi.refund(transactionId, reason).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'transactions'] }),
  })
}

export function useRetryPayout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (transactionId: string) =>
      transactionsApi.retry(transactionId).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'transactions'] }),
  })
}

export function useCancelTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ transactionId, reason }: { transactionId: string; reason?: string }) =>
      transactionsApi.cancel(transactionId, reason).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'transactions'] }),
  })
}
