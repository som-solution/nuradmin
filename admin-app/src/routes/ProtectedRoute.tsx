import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean // SUPER_ADMIN only
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const adminType = useAuthStore((s) => s.adminType)

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace /> 
  }

  if (requireAdmin && adminType !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
