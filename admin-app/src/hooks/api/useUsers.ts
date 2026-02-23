import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi, type UsersParams } from '@/api/users'

export function useUsers(params?: UsersParams) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => usersApi.list(params).then((r) => r.data),
  })
}

export function useFreezeUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      usersApi.freeze(userId, reason).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}

export function useEnableUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      enable,
      reason,
    }: {
      userId: string
      enable?: boolean
      reason?: string
    }) => usersApi.enable(userId, enable, reason).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}
