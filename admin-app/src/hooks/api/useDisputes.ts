import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { disputesApi, type DisputesParams } from '@/api/disputes'
import type { DisputeStatus } from '@/types'

export function useDisputes(params?: DisputesParams) {
  return useQuery({
    queryKey: ['admin', 'disputes', params],
    queryFn: () => disputesApi.list(params).then((r) => r.data),
  })
}

export function useResolveDispute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      disputeId,
      resolution,
      notes,
    }: {
      disputeId: string
      resolution: DisputeStatus
      notes?: string
    }) => disputesApi.resolve(disputeId, resolution, notes).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'disputes'] }),
  })
}
