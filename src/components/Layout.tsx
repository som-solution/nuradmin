import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/send', label: 'Send money' },
  { to: '/recipients', label: 'Recipients' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/compliance', label: 'Verification' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-teal-700">
            NurPay
          </Link>
          <nav className="flex items-center gap-6">
            {nav.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-sm font-medium ${
                  location.pathname === to ? 'text-teal-600' : 'text-slate-600 hover:text-teal-600'
                }`}
              >
                {label}
              </Link>
            ))}
            <span className="text-sm text-slate-500">{user?.email}</span>
            <Link to="/admin/login" className="text-sm text-slate-500 hover:text-teal-600">
              Admin
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
