import { useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminApi, canReconciliation, getAdminErrorMessage, type ApiError } from '../../lib/adminApi';

export default function AdminReconciliation() {
  const { admin } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message?: string; [key: string]: unknown } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canRun = admin?.adminType ? canReconciliation(admin.adminType) : false;

  const handleRun = async () => {
    if (!confirm('Run reconciliation? This may trigger backend jobs.')) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await adminApi.post<{ message?: string; [key: string]: unknown }>('/reconciliation/run');
      setResult(data);
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to run reconciliation'));
    } finally {
      setLoading(false);
    }
  };

  if (!canRun) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Reconciliation</h1>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">You do not have permission to run reconciliation (SUPER_ADMIN or ADMIN only).</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Reconciliation</h1>
      <p className="mb-6 text-zinc-500">Run reconciliation job. Success response is implementation-specific.</p>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}
      {result && (
        <div className="mb-4 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-300">
          <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      <button
        type="button"
        onClick={handleRun}
        disabled={loading}
        className="rounded-xl bg-emerald-500 px-4 py-2.5 font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
      >
        {loading ? 'Running…' : 'Run reconciliation'}
      </button>
    </div>
  );
}
