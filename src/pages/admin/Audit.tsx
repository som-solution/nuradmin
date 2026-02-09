import { useCallback, useEffect, useState } from 'react';
import { adminApi, getAdminErrorMessage, type AuditLog, type SpringPage } from '../../lib/adminApi';

export default function AdminAudit() {
  const [page, setPage] = useState<SpringPage<AuditLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(0);
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const pageSize = 20;
  const useEntityFilter = entityType && entityId;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (useEntityFilter) {
        const data = await adminApi.get<SpringPage<AuditLog>>(
          `/audit/entity?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}&page=${pageNum}&size=${pageSize}&sort=createdAt,desc`
        );
        setPage(data);
      } else {
        const data = await adminApi.get<SpringPage<AuditLog>>(
          `/audit?page=${pageNum}&size=${pageSize}&sort=createdAt,desc`
        );
        setPage(data);
      }
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to load audit'));
    } finally {
      setLoading(false);
    }
  }, [pageNum, useEntityFilter, entityType, entityId]);

  useEffect(() => {
    load();
  }, [load]);

  const list = page?.content ?? [];
  const totalPages = page?.totalPages ?? 0;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Audit logs</h1>
      <p className="mb-6 text-zinc-500">Activity and audit trail. Filter by entity type and ID.</p>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="text-sm text-zinc-500">
          Entity type
          <input
            type="text"
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPageNum(0); }}
            placeholder="User, Transaction, ..."
            className="ml-2 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-white w-32"
          />
        </label>
        <label className="text-sm text-zinc-500">
          Entity ID
          <input
            type="text"
            value={entityId}
            onChange={(e) => { setEntityId(e.target.value); setPageNum(0); }}
            placeholder="UUID"
            className="ml-2 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-white w-48"
          />
        </label>
        <button
          type="button"
          onClick={() => { setEntityType(''); setEntityId(''); setPageNum(0); }}
          className="rounded border border-zinc-700 px-3 py-1 text-sm text-zinc-500 hover:bg-zinc-800"
        >
          Clear filter
        </button>
      </div>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Event</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Entity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Actor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {list.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/40">
                    <td className="px-4 py-3 text-zinc-500 text-sm whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-amber-400">{log.eventType ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {log.entityType ?? '—'} {log.entityId ? `(${String(log.entityId).slice(0, 8)}…)` : ''}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-sm">
                      {log.actorEmail ?? '—'} {log.adminType ? `(${log.adminType})` : ''}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-sm max-w-xs truncate">
                      {log.reason ?? '—'}
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
              <span className="text-zinc-500 text-sm">
                Page {pageNum + 1} of {totalPages}
              </span>
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
