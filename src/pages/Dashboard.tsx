import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mb-8 text-slate-600">Hello, {user?.email}. Manage your transfers from here.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/send"
          className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
        >
          <span className="text-3xl">💸</span>
          <h2 className="mt-3 font-semibold text-slate-900">Send money</h2>
          <p className="mt-1 text-sm text-slate-600">UK → East Africa via Stripe (card / Google Pay)</p>
        </Link>
        <Link
          to="/recipients"
          className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
        >
          <span className="text-3xl">👤</span>
          <h2 className="mt-3 font-semibold text-slate-900">Recipients</h2>
          <p className="mt-1 text-sm text-slate-600">Add and manage your recipients</p>
        </Link>
        <Link
          to="/transactions"
          className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
        >
          <span className="text-3xl">📋</span>
          <h2 className="mt-3 font-semibold text-slate-900">Transactions</h2>
          <p className="mt-1 text-sm text-slate-600">View history and status</p>
        </Link>
        <Link
          to="/compliance"
          className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-200 hover:shadow-md"
        >
          <span className="text-3xl">✓</span>
          <h2 className="mt-3 font-semibold text-slate-900">Verification</h2>
          <p className="mt-1 text-sm text-slate-600">Profile, KYC documents, send limits</p>
        </Link>
      </div>
    </div>
  );
}
