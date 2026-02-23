import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { documentsApi, type DocumentsParams } from '@/api/documents'

export function useDocuments(params?: DocumentsParams) {
  return useQuery({
    queryKey: ['admin', 'documents', params],
    queryFn: () => documentsApi.list(params).then((r) => r.data),
  })
}

export function useUserDocuments(userId: string | undefined, params?: { page?: number; size?: number }) {
  return useQuery({
    queryKey: ['admin', 'users', userId, 'documents', params],
    queryFn: () => documentsApi.listByUser(userId!, params).then((r) => r.data),
    enabled: !!userId,
  })
}

export function useDocumentView() {
  return useMutation({
    mutationFn: (id: string) => documentsApi.view(id).then((r) => r.data),
  })
}

export function useApproveDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => documentsApi.approve(id).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'documents'] })
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useRejectDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      documentsApi.reject(id, reason).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'documents'] })
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
