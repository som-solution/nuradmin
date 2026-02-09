import { useCallback, useEffect, useState } from 'react';
import { adminApi, getAdminErrorMessage, type ApiError, type OutboxEvent, type SpringPage } from '../../lib/adminApi';

export default function AdminOutbox() {
  const [page, setPage] = useState<SpringPage<OutboxEvent> | { content: OutboxEvent[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(0);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.get<SpringPage<OutboxEvent> | OutboxEvent[]>(
        `/outbox?page=${pageNum}&size=${pageSize}`
      );
      if (Array.isArray(data)) {
        setPage({ content: data, totalPages: 1, totalElements: data.length, size: pageSize, number: 0 });
      } else {
        setPage(data as SpringPage<OutboxEvent>);
      }
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to load outbox'));
    } finally {
      setLoading(false);
    }
  }, [pageNum]);

  useEffect(() => {
    load();
  }, [load]);

  const handleProcess = async (eventId: string) => {
    if (!confirm('Process this event?')) return;
    try {
      await adminApi.post(`/outbox/${eventId}/process`);
      load();
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to process'));
    }
  };

  const list = page && 'content' in page ? page.content : [];
  const totalPages = page && 'totalPages' in page ? page.totalPages : 1;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Outbox</h1>
      <p className="mb-6 text-zinc-500">Pending outbox events. Process to trigger async handling.</p>
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Created</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                      No pending events
                    </td>
                  </tr>
                ) : (
                  list.map((ev) => (
                    <tr key={ev.id} className="hover:bg-zinc-800/40">
                      <td className="px-4 py-3 font-mono text-sm text-zinc-400">{ev.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-zinc-400">
                        {ev.aggregateType ?? ev.eventType ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-sm">
                        {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleProcess(ev.id)}
                          className="text-emerald-400 hover:underline text-sm"
                        >
                          Process
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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
