import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import {
  canAdminManagement,
  canAudit,
  canDisputes,
  canKycDocuments,
  canOutbox,
  canProviderToggle,
  canReconciliation,
} from '../lib/adminApi';

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = admin?.adminType ?? 'SUPPORT';

  const nav: { to: string; label: string; show: boolean }[] = [
    { to: '/', label: 'Dashboard', show: true },
    { to: '/admins', label: 'Admins', show: canAdminManagement(role) },
    { to: '/users', label: 'Users', show: true },
    { to: '/transactions', label: 'Transactions', show: true },
    { to: '/audit', label: 'Audit', show: canAudit(role) },
    { to: '/reconciliation', label: 'Reconciliation', show: canReconciliation(role) },
    { to: '/provider', label: 'Provider', show: canProviderToggle(role) },
    { to: '/outbox', label: 'Outbox', show: canOutbox(role) },
    { to: '/disputes', label: 'Disputes', show: canDisputes(role) },
    { to: '/documents', label: 'KYC documents', show: canKycDocuments(role) },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const visibleNav = nav.filter((n) => n.show);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/95 px-4 backdrop-blur-sm lg:hidden">
        <Link to="/" className="text-lg font-semibold tracking-tight text-emerald-400">
          NurPay Admin
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-zinc-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={`fixed top-14 left-0 z-50 h-[calc(100vh-3.5rem)] w-72 border-r border-zinc-800 bg-zinc-900/98 shadow-xl transition-transform duration-200 ease-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-0.5 p-3">
          {visibleNav.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                location.pathname === to
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-900 p-3">
          <p className="truncate px-3 py-1 text-xs text-zinc-500">{admin?.email}</p>
          <p className="px-3 text-xs font-medium text-emerald-400/90">{admin?.adminType}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full rounded-lg bg-zinc-800 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="fixed top-0 left-0 z-20 hidden h-full w-64 border-r border-zinc-800 bg-zinc-900/98 lg:block">
        <div className="flex h-14 items-center border-b border-zinc-800 px-4">
          <Link to="/" className="text-lg font-semibold tracking-tight text-emerald-400">
            NurPay Admin
          </Link>
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          {visibleNav.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                location.pathname === to
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 bg-zinc-900 p-3">
          <p className="truncate px-3 py-1 text-xs text-zinc-500">{admin?.email}</p>
          <p className="px-3 text-xs font-medium text-emerald-400/90">{admin?.adminType}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full rounded-lg bg-zinc-800 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-h-screen lg:pl-64">
        <div className="pt-14 lg:pt-0">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
