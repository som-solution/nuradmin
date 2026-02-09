import { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  adminApi,
  canRefundCancel,
  canRetryPayout,
  getAdminErrorMessage,
  type AdminTransaction,
  type SpringPage,
} from '../../lib/adminApi';

const STATUS_OPTIONS = [
  '',
  'CREATED',
  'PAYMENT_PENDING',
  'PAYMENT_RECEIVED',
  'PAYOUT_INITIATED',
  'PAYOUT_SUCCESS',
  'FINALIZED',
  'PAYMENT_FAILED',
  'PAYOUT_FAILED',
  'REFUNDED',
  'CANCELLED',
  'COMPENSATION',
];

export default function AdminTransactions() {
  const { admin } = useAdminAuth();
  const [page, setPage] = useState<SpringPage<AdminTransaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const pageSize = 20;
  const canRefundCancelRole = admin?.adminType ? canRefundCancel(admin.adminType) : false;
  const canRetryRole = admin?.adminType ? canRetryPayout(admin.adminType) : false;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let path = `/transactions?page=${pageNum}&size=${pageSize}&sort=createdAt,desc`;
      if (statusFilter) path += `&status=${encodeURIComponent(statusFilter)}`;
      const data = await adminApi.get<SpringPage<AdminTransaction>>(path);
      setPage(data);
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [pageNum, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const action = async (
    actionName: string,
    path: string,
    confirmMsg: string
  ) => {
    if (!confirm(confirmMsg)) return;
    try {
      await adminApi.post(path);
      load();
    } catch (err) {
      setError(getAdminErrorMessage(err, `Failed to ${actionName}`));
    }
  };

  const list = page?.content ?? [];
  const totalPages = page?.totalPages ?? 0;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Transactions</h1>
      <p className="mb-6 text-zinc-500">View and act on transfers. Filter by status, refund, cancel, or retry payout by role.</p>
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium text-zinc-400">
          Status
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPageNum(0); }}
            className="ml-2 mt-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s || 'all'} value={s}>{s || 'All'}</option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-800">
                <thead>
                  <tr className="bg-zinc-800/50">
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">ID</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Status</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Amount</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Created</th>
                    {(canRefundCancelRole || canRetryRole) && (
                      <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {list.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-sm text-zinc-300">{t.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-lg bg-zinc-700/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
                          {t.status ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-white">
                        {t.amount != null ? `${t.amount} ${t.currency ?? ''}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-zinc-500">
                        {t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'}
                      </td>
                      {(canRefundCancelRole || canRetryRole) && (
                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-flex gap-2">
                            {canRetryRole && (
                              <button type="button" onClick={() => action('retry', `/transactions/${t.id}/retry`, 'Retry payout?')} className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
                                Retry
                              </button>
                            )}
                            {canRefundCancelRole && (
                              <>
                                <button type="button" onClick={() => action('refund', `/transactions/${t.id}/refund`, 'Refund this transaction?')} className="text-sm font-medium text-red-400 hover:text-red-300">
                                  Refund
                                </button>
                                <button type="button" onClick={() => action('cancel', `/transactions/${t.id}/cancel`, 'Cancel this transaction?')} className="text-sm font-medium text-zinc-400 hover:text-zinc-300">
                                  Cancel
                                </button>
                              </>
                            )}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-3">
              <button type="button" disabled={pageNum === 0} onClick={() => setPageNum((p) => p - 1)} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50">
                Previous
              </button>
              <span className="text-sm text-zinc-500">Page {pageNum + 1} of {totalPages}</span>
              <button type="button" disabled={pageNum >= totalPages - 1} onClick={() => setPageNum((p) => p + 1)} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
