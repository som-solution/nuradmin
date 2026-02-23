import { apiClient } from './client'
import type { Page, UserDocument, DocumentViewResponse, DocumentStatus } from '@/types'

export interface DocumentsParams {
  status?: DocumentStatus
  page?: number
  size?: number
  sort?: string
}

export const documentsApi = {
  list: (params?: DocumentsParams) =>
    apiClient.get<Page<UserDocument>>('/admin/documents', {
      params: { page: 0, size: 20, ...params },
    }),

  listByUser: (userId: string, params?: { page?: number; size?: number }) =>
    apiClient.get<Page<UserDocument>>(`/admin/users/${userId}/documents`, {
      params: { page: 0, size: 20, ...params },
    }),

  view: (id: string) =>
    apiClient.get<DocumentViewResponse>(`/admin/documents/${id}/view`),

  approve: (id: string) =>
    apiClient.post<{ id: string; status: string }>(`/admin/documents/${id}/approve`),

  reject: (id: string, reason?: string) =>
    apiClient.post<{ id: string; status: string }>(`/admin/documents/${id}/reject`, null, {
      params: reason ? { reason } : {},
    }),
}
