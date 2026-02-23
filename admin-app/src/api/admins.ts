import { apiClient } from './client'
import type { Page, Admin, CreateAdminRequest, UpdateAdminRequest } from '@/types'

export interface AdminsParams {
  page?: number
  size?: number
  sort?: string
}

export const adminsApi = {
  list: (params?: AdminsParams) =>
    apiClient.get<Page<Admin>>('/admin/admins', { params: { page: 0, size: 20, ...params } }),

  create: (body: CreateAdminRequest) =>
    apiClient.post<{ adminId: string; email: string; adminType: string; enabled: boolean }>(
      '/admin/admins',
      body
    ),

  update: (adminId: string, body: UpdateAdminRequest) =>
    apiClient.put<{ adminId: string; email: string; adminType: string; enabled: boolean }>(
      `/admin/admins/${adminId}`,
      body
    ),
}
