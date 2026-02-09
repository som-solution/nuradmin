/**
 * Customer (user) login page.
 * Uses POST /api/auth/login only — do not use admin credentials here.
 * Staff must use /admin/login (POST /api/admin/auth/login).
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Customer sign in</h1>
        <p className="mb-6 text-slate-600">
          This is for <strong>customer</strong> accounts only. Use the email and password you used when you registered. Do not use admin credentials (e.g. admin@nurpay.local) here — use the Admin login for that.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-medium">{error}</p>
              {error.toLowerCase().includes('disabled') || error.toLowerCase().includes('suspended') ? (
                <p className="mt-2 text-red-600">
                  Your account was restricted by an administrator. If you believe this is an error, please contact support.
                </p>
              ) : (
                <>
                  <p className="mt-2 text-red-600">
                    First time? Create a <strong>user</strong> account via{' '}
                    <Link to="/register" className="font-semibold underline underline-offset-2">Register</Link>, then sign in here with the same email and password.
                  </p>
                  <p className="mt-2 text-red-600">
                    Using admin credentials (e.g. admin@nurpay.local)? This form is for customers only →{' '}
                    <Link to="/admin/login" className="font-semibold underline underline-offset-2">Admin login</Link>.
                  </p>
                </>
              )}
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-600 px-4 py-3 font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          No account?{' '}
          <Link to="/register" className="font-medium text-teal-600 hover:underline">
            Register
          </Link>
          {' '}(customer only). Staff?{' '}
          <Link to="/admin/login" className="font-medium text-teal-600 hover:underline">
            Admin login
          </Link>.
        </p>
      </div>
    </div>
  );
}
