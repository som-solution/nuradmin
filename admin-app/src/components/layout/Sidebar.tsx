import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Receipt,
  FileCheck,
  Shield,
  DollarSign,
  Percent,
  Globe,
  Server,
  Inbox,
  AlertCircle,
  ScrollText,
  Calculator,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCan } from '@/hooks/useCan'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/kyc', label: 'KYC Documents', icon: FileCheck, can: 'canReviewKyc' },
  { to: '/admins', label: 'Admins', icon: Shield, can: 'canManageAdmins' },
  { to: '/rates', label: 'Exchange Rates', icon: DollarSign, can: 'canManageRates' },
  { to: '/fee-config', label: 'Fee Config', icon: Percent, can: 'canManageFeeConfig' },
  { to: '/countries', label: 'Countries', icon: Globe, can: 'canManageCountries' },
  { to: '/provider', label: 'Provider', icon: Server, can: 'canToggleProvider' },
  { to: '/outbox', label: 'Outbox', icon: Inbox, can: 'canListOutbox' },
  { to: '/disputes', label: 'Disputes', icon: AlertCircle, can: 'canListDisputes' },
  { to: '/audit', label: 'Audit', icon: ScrollText },
  { to: '/reconciliation', label: 'Reconciliation', icon: Calculator, can: 'canRunReconciliation' },
]

export function Sidebar() {
  const can = useCan()

  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-semibold text-foreground">NurPay Admin</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {nav.map((item) => {
          const allowed = !item.can || !!(can as Record<string, unknown>)[item.can]
          if (!allowed) return null
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
