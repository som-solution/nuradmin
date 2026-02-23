import { useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'

export function useCan() {
  const adminType = useAuthStore((s) => s.adminType)

  return useMemo(() => {
    const t = adminType
    const isSuperAdmin = t === 'SUPER_ADMIN'
    const isAdmin = t === 'ADMIN'
    const isOps = t === 'OPS'
    const isSupport = t === 'SUPPORT'

    return {
      // Admin management: SUPER_ADMIN only
      canManageAdmins: isSuperAdmin,

      // Users: all can list; freeze/enable: SUPER_ADMIN, ADMIN, OPS
      canListUsers: true,
      canFreezeEnableUser: isSuperAdmin || isAdmin || isOps,

      // Transactions: all can list; actions by role
      canListTransactions: true,
      canRetryPayout: isSuperAdmin || isAdmin || isOps,
      canRefund: isSuperAdmin || isAdmin,
      canCancel: isSuperAdmin || isAdmin,

      // Audit: all
      canListAudit: true,

      // KYC: SUPER_ADMIN, ADMIN only
      canReviewKyc: isSuperAdmin || isAdmin,

      // Reconciliation: SUPER_ADMIN, ADMIN
      canRunReconciliation: isSuperAdmin || isAdmin,

      // Provider: SUPER_ADMIN, ADMIN, OPS
      canToggleProvider: isSuperAdmin || isAdmin || isOps,

      // Outbox: SUPER_ADMIN, ADMIN, OPS
      canListOutbox: isSuperAdmin || isAdmin || isOps,
      canProcessOutbox: isSuperAdmin || isAdmin || isOps,

      // Disputes: SUPER_ADMIN, ADMIN, OPS (SUPPORT cannot list)
      canListDisputes: isSuperAdmin || isAdmin || isOps,
      canResolveDispute: isSuperAdmin || isAdmin || isOps,

      // Rates, fee config, countries: SUPER_ADMIN, ADMIN
      canManageRates: isSuperAdmin || isAdmin,
      canManageFeeConfig: isSuperAdmin || isAdmin,
      canManageCountries: isSuperAdmin || isAdmin,

      adminType: t,
      isSupport: isSupport, // read-only
    }
  }, [adminType])
}
