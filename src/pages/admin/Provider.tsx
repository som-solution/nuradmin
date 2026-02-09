import { useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminApi, canProviderToggle, getAdminErrorMessage, type ApiError } from '../../lib/adminApi';

export default function AdminProvider() {
  const { admin } = useAdminAuth();
  const [providerCode, setProviderCode] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ providerCode?: string; enabled?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canToggle = admin?.adminType ? canProviderToggle(admin.adminType) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerCode.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await adminApi.put<{ providerCode?: string; enabled?: boolean }>(
        `/provider/${encodeURIComponent(providerCode.trim())}?enabled=${enabled}`
      );
      setResult(data);
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to update provider'));
    } finally {
      setLoading(false);
    }
  };

  if (!canToggle) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Provider</h1>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">You do not have permission to toggle providers (SUPER_ADMIN, ADMIN, or OPS only).</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Provider</h1>
      <p className="mb-6 text-zinc-500">Set provider enabled/disabled. Use the provider code from your backend (e.g. STRIPE, ALMA).</p>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}
      {result && (
        <div className="mb-4 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-emerald-400">
          Updated: {result.providerCode} → enabled: {String(result.enabled)}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
        <label className="text-sm font-medium text-zinc-400">
          Provider code
          <input
            type="text"
            value={providerCode}
            onChange={(e) => setProviderCode(e.target.value)}
            required
            placeholder="e.g. STRIPE"
            className="ml-2 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded border-zinc-600"
          />
          Enabled
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? 'Updating…' : 'Update'}
        </button>
      </form>
    </div>
  );
}
