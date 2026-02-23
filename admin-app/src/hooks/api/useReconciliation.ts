import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reconciliationApi } from '@/api/reconciliation'

export function useRunReconciliation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => reconciliationApi.run().then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'transactions'] })
    },
  })
}
