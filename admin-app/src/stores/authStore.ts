import { create } from 'zustand'
import type { AdminType } from '@/types'
import { clearRefreshToken, setRefreshToken } from '@/api/storage'

interface AuthState {
  accessToken: string | null
  adminId: string | null
  adminType: AdminType | null
  email: string | null
  isAuthenticated: boolean
  setAuth: (data: {
    accessToken: string
    refreshToken: string
    adminId: string
    adminType: AdminType
    email: string
  }) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  adminId: null,
  adminType: null,
  email: null,
  isAuthenticated: false,

  setAuth: (data) => {
    setRefreshToken(data.refreshToken)
    set({
      accessToken: data.accessToken,
      adminId: data.adminId,
      adminType: data.adminType as AdminType,
      email: data.email,
      isAuthenticated: true,
    })
  },

  setTokens: (accessToken, refreshToken) => {
    setRefreshToken(refreshToken)
    set({ accessToken, isAuthenticated: true })
  },

  logout: () => {
    clearRefreshToken()
    set({
      accessToken: null,
      adminId: null,
      adminType: null,
      email: null,
      isAuthenticated: false,
    })
  },

  hydrate: () => {
    // Optional: restore from sessionStorage if you ever persist accessToken briefly
    // For strict memory-only we do nothing here
  },
}))
