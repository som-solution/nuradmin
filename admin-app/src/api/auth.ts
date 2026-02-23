import { apiClient } from './client'
import type { LoginRequest, LoginResponse, RefreshRequest, LoginResponse as RefreshResponse } from '@/types'

export const authApi = {
  login: (body: LoginRequest) =>
    apiClient.post<LoginResponse>('/admin/auth/login', body),

  refresh: (body: RefreshRequest) =>
    apiClient.post<RefreshResponse>('/admin/auth/refresh', body),
}
