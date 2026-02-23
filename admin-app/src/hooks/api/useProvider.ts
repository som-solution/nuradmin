import { useMutation, useQueryClient } from '@tanstack/react-query'
import { providerApi } from '@/api/provider'

export function useSetProviderEnabled() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      providerCode,
      enabled,
      reason,
    }: {
      providerCode: string
      enabled: boolean
      reason?: string
    }) => providerApi.setEnabled(providerCode, enabled, reason).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'provider'] })
    },
  })
}
