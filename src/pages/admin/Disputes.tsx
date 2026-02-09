import { useCallback, useEffect, useState } from 'react';
import { adminApi, getAdminErrorMessage, type ApiError, type Dispute, type SpringPage } from '../../lib/adminApi';

const RESOLUTION_OPTIONS = [
  'RESOLVED_REFUND',
  'RESOLVED_NO_REFUND',
  'CLOSED',
  'IN_REVIEW',
] as const;

export default function AdminDisputes() {
  const [page, setPage] = useState<SpringPage<Dispute> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let path = `/disputes?page=${pageNum}&size=${pageSize}`;
      if (statusFilter) path += `&status=${encodeURIComponent(statusFilter)}`;
      const data = await adminApi.get<SpringPage<Dispute>>(path);
      setPage(data);
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to load disputes'));
    } finally {
      setLoading(false);
    }
  }, [pageNum, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolution, setResolution] = useState<string>(RESOLUTION_OPTIONS[0]);
  const [notes, setNotes] = useState('');

  const handleResolve = async (disputeId: string) => {
    setResolvingId(disputeId);
    setError(null);
    try {
      let path = `/disputes/${disputeId}/resolve?resolution=${encodeURIComponent(resolution)}`;
      if (notes) path += `&notes=${encodeURIComponent(notes)}`;
      await adminApi.post(path);
      setNotes('');
      load();
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to resolve'));
    } finally {
      setResolvingId(null);
    }
  };

  const list = page?.content ?? [];
  const totalPages = page?.totalPages ?? 0;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Disputes</h1>
      <p className="mb-6 text-zinc-500">List and resolve disputes. Filter by status.</p>
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm text-zinc-500">
          Status
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPageNum(0); }}
            className="ml-2 rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1 text-white"
          >
            <option value="">All</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="RESOLVED_REFUND">RESOLVED_REFUND</option>
            <option value="RESOLVED_NO_REFUND">RESOLVED_NO_REFUND</option>
            <option value="CLOSED">CLOSED</option>
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
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Transaction</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Created</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {list.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-800/50/80">
                    <td className="px-4 py-3 font-mono text-sm text-zinc-400">{d.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-zinc-500 text-sm">{d.transactionId?.slice(0, 8) ?? '—'}…</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
                        {d.status ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-sm">
                      {d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {resolvingId === d.id ? (
                        <span className="text-zinc-500 text-sm">Resolving…</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            className="rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1 text-sm text-white"
                          >
                            {RESOLUTION_OPTIONS.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notes (optional)"
                            className="w-32 rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1 text-sm text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleResolve(d.id)}
                            className="text-emerald-400 hover:underline text-sm"
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                disabled={pageNum === 0}
                onClick={() => setPageNum((p) => p - 1)}
                className="rounded border border-zinc-700 px-3 py-1 text-sm text-zinc-400 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-zinc-500 text-sm">Page {pageNum + 1} of {totalPages}</span>
              <button
                type="button"
                disabled={pageNum >= totalPages - 1}
                onClick={() => setPageNum((p) => p + 1)}
                className="rounded border border-zinc-700 px-3 py-1 text-sm text-zinc-400 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
