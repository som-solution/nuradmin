import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { feeConfigApi } from '@/api/feeConfig'
import type { UpsertFeeConfigRequest } from '@/types'

export function useFeeConfig() {
  return useQuery({
    queryKey: ['admin', 'fee-config'],
    queryFn: () => feeConfigApi.list().then((r) => r.data),
  })
}

export function useUpsertFeeConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpsertFeeConfigRequest) => feeConfigApi.upsert(body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'fee-config'] }),
  })
}
