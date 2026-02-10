import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  canAdminManagement,
  canAudit,
  canDisputes,
  canKycDocuments,
  canOutbox,
  canProviderToggle,
  canReconciliation,
} from '../../lib/adminApi';

const cardStyles =
  'group flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 transition-all hover:border-emerald-500/40 hover:bg-zinc-900 hover:shadow-lg hover:shadow-emerald-500/5';

export default function AdminDashboard() {
  const { admin } = useAdminAuth();
  const role = admin?.adminType ?? 'SUPPORT';

  const links = [
    { to: '/admins', label: 'Admins', show: canAdminManagement(role), desc: 'Manage admin accounts' },
    { to: '/users', label: 'Users', show: true, desc: 'List and manage users' },
    { to: '/transactions', label: 'Transactions', show: true, desc: 'View and act on transfers' },
    { to: '/audit', label: 'Audit logs', show: canAudit(role), desc: 'Activity and audit trail' },
    { to: '/reconciliation', label: 'Reconciliation', show: canReconciliation(role), desc: 'Run reconciliation' },
    { to: '/provider', label: 'Provider', show: canProviderToggle(role), desc: 'Toggle payout provider' },
    { to: '/outbox', label: 'Outbox', show: canOutbox(role), desc: 'Pending outbox events' },
    { to: '/disputes', label: 'Disputes', show: canDisputes(role), desc: 'List and resolve disputes' },
    { to: '/documents', label: 'KYC documents', show: canKycDocuments(role), desc: 'Review and approve docs' },
  ].filter((l) => l.show);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Dashboard</h1>
        <p className="mt-1.5 text-zinc-500">
          Logged in as <span className="text-zinc-400">{admin?.email}</span>{' '}
          <span className="text-emerald-400/90">({admin?.adminType})</span>
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ to, label, desc }) => (
          <Link key={to} to={to} className={cardStyles}>
            <h2 className="font-semibold text-white group-hover:text-emerald-400/90">{label}</h2>
            <p className="mt-1 text-sm text-zinc-500">{desc}</p>
            <span className="mt-3 inline-flex items-center text-sm font-medium text-emerald-400">
              Open
              <svg className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
