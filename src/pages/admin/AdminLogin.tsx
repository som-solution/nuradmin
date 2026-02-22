import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { getAdminErrorMessage } from '../../lib/adminApi';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]" />
      <div className="relative w-full max-w-[420px]">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">NurPay Admin</h1>
            <p className="mt-1.5 text-sm text-zinc-500">Sign in with your staff account</p>
          </div>
          <p className="mb-4 text-xs text-zinc-400">Sign in using the form below. Do not open the login API URL in the browser — that sends GET and returns 405.</p>
          <div className="mb-6 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
            <p className="text-sm font-medium text-emerald-200">Default credentials (backend seed)</p>
            <p className="mt-2 font-mono text-sm text-emerald-100">admin@nurpay.local</p>
            <p className="font-mono text-sm text-emerald-100">admin123</p>
            <p className="mt-2 text-xs text-emerald-200/80">Or: superadmin2@nurpay.local / admin123</p>
          </div>
        <form onSubmit={handleSubmit} className="space-y-5" method="post" action="#">
          {error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <p className="font-medium">{error}</p>
              {!error.includes('Cannot reach the backend') ? (
                <div className="mt-2 space-y-1.5 text-red-200/90 text-xs">
                  <p className="font-medium">To fix:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    {error.includes('POST') && error.includes('GET') ? (
                      <li><strong>Use this page only</strong> — Enter email and password above and click <strong>Sign in</strong>. Do not open or bookmark <code className="rounded bg-red-900/50 px-1">{API_BASE}/api/admin/auth/login</code> in the browser (that sends GET and returns 405).</li>
                    ) : null}
                    <li><strong>Backend running</strong> — Open <code className="rounded bg-red-900/50 px-1">{API_BASE}/actuator/health</code>. If you get JSON (e.g. <code className="rounded bg-red-900/50 px-1">{'{"status":"UP"}'}</code>), the backend is up. If using localhost, start the backend (e.g. <code className="rounded bg-red-900/50 px-1">./mvnw spring-boot:run</code>). If using production, check Railway.</li>
                  <li><strong>Admin accounts exist (seed ran)</strong> — Seed runs only when the profile is not production and the <code className="rounded bg-red-900/50 px-1">admins</code> table is empty at startup. Option A: stop backend, run <code className="rounded bg-red-900/50 px-1">DELETE FROM admins;</code> in Postgres, then start the backend again (no production profile). Option B: run <code className="rounded bg-red-900/50 px-1">SELECT id, email, enabled FROM admins;</code> and use one of those exact emails with the password you know (e.g. admin123).</li>
                  <li><strong>Exact credentials</strong> — Email: <code className="rounded bg-red-900/50 px-1">admin@nurpay.local</code> or <code className="rounded bg-red-900/50 px-1">superadmin2@nurpay.local</code> (lowercase, no spaces). Password: <code className="rounded bg-red-900/50 px-1">admin123</code> unless you changed it. Request must be POST with JSON body (this form does that).</li>
                </ol>
                </div>
              ) : null}
            </div>
          ) : null}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-300">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
              placeholder="admin@nurpay.local"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-300">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-center text-xs text-zinc-500">Uses POST with JSON. Use this form, not the API URL.</p>
        </form>
          <p className="mt-8 text-center text-sm text-zinc-500">
            <a href="/" className="text-emerald-400 hover:text-emerald-300 hover:underline">Back to app</a>
          </p>
        </div>
      </div>
    </div>
  );
}
