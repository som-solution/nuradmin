import { apiClient } from './client'
import type { Page, User } from '@/types'

export interface UsersParams {
  page?: number
  size?: number
  sort?: string
}

export const usersApi = {
  list: (params?: UsersParams) =>
    apiClient.get<Page<User>>('/admin/users', { params: { page: 0, size: 20, ...params } }),

  freeze: (userId: string, reason?: string) =>
    apiClient.put(`/admin/users/${userId}/freeze`, null, { params: reason ? { reason } : {} }),

  enable: (userId: string, enable = true, reason?: string) =>
    apiClient.put(`/admin/users/${userId}/enable`, null, {
      params: { enable, ...(reason ? { reason } : {}) },
    }),
}
