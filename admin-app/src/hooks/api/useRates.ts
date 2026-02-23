import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ratesApi } from '@/api/rates'
import type { UpsertRateRequest } from '@/types'

export function useRates() {
  return useQuery({
    queryKey: ['admin', 'rates'],
    queryFn: () => ratesApi.list().then((r) => r.data),
  })
}

export function useUpsertRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpsertRateRequest) => ratesApi.upsert(body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'rates'] }),
  })
}
