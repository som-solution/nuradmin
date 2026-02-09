import { useCallback, useEffect, useState } from 'react';
import { api, type Transaction } from '../lib/api';
import type { ApiError } from '../lib/api';

export default function Transactions() {
  const [list, setList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Transaction[] | { content?: Transaction[] }>('/transactions');
      const items = Array.isArray(data) ? data : (data as { content?: Transaction[] }).content ?? [];
      setList(items);
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const statusColor = (status: string) => {
    const s = status?.toUpperCase() ?? '';
    if (s === 'COMPLETED' || s === 'SUCCESS') return 'text-emerald-600 bg-emerald-50';
    if (s === 'PENDING' || s === 'PROCESSING') return 'text-amber-600 bg-amber-50';
    if (s === 'FAILED' || s === 'CANCELLED') return 'text-red-600 bg-red-50';
    return 'text-slate-600 bg-slate-100';
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Transactions</h1>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {loading ? (
        <p className="text-slate-600">Loading…</p>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          No transactions yet. Send money to see history.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-sm text-slate-700">{t.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(t.status)}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-900">
                    {t.amount != null ? `${t.amount} ${t.currency ?? ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {t.createdAt
                      ? new Date(t.createdAt).toLocaleDateString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
