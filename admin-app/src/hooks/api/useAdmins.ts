import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminsApi, type AdminsParams } from '@/api/admins'
import type { CreateAdminRequest, UpdateAdminRequest } from '@/types'

export function useAdmins(params?: AdminsParams) {
  return useQuery({
    queryKey: ['admin', 'admins', params],
    queryFn: () => adminsApi.list(params).then((r) => r.data),
  })
}

export function useCreateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateAdminRequest) => adminsApi.create(body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'admins'] }),
  })
}

export function useUpdateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ adminId, body }: { adminId: string; body: UpdateAdminRequest }) =>
      adminsApi.update(adminId, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'admins'] }),
  })
}
