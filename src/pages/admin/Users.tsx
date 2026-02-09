import { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  adminApi,
  canFreezeEnable,
  getAdminErrorMessage,
  normalizeSpringPage,
  type AdminUser,
  type SpringPage,
} from '../../lib/adminApi';

export default function AdminUsers() {
  const { admin } = useAdminAuth();
  const [page, setPage] = useState<SpringPage<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(0);
  const pageSize = 20;
  const canModify = admin?.adminType ? canFreezeEnable(admin.adminType) : false;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Cache-bust so we get latest users (new app registrations); backend must not cache this list
      const raw = await adminApi.get<unknown>(
        `/users?page=${pageNum}&size=${pageSize}&sort=createdAt,desc&_=${Date.now()}`
      );
      setPage(normalizeSpringPage<AdminUser>(raw));
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [pageNum]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFreeze = async (userId: string, reason?: string) => {
    if (!confirm('Freeze this user?')) return;
    try {
      const url = reason ? `/users/${userId}/freeze?reason=${encodeURIComponent(reason)}` : `/users/${userId}/freeze`;
      await adminApi.put(url);
      load();
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to freeze'));
    }
  };

  const handleEnable = async (userId: string, enable: boolean, reason?: string) => {
    try {
      let url = `/users/${userId}/enable?enable=${enable}`;
      if (reason) url += `&reason=${encodeURIComponent(reason)}`;
      await adminApi.put(url);
      load();
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to update'));
    }
  };

  const list = page?.content ?? [];
  const totalPages = page?.totalPages ?? 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Users</h1>
          <p className="text-zinc-500">List and manage customer accounts. Freeze or enable users if your role allows.</p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
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
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Email</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Name</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Enabled</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Frozen</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Created</th>
                    {canModify && <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {list.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3.5 text-white">{u.email}</td>
                      <td className="px-4 py-3.5 text-zinc-300">
                        {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={u.enabled !== false ? 'text-emerald-400' : 'text-red-400'}>
                          {u.enabled !== false ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={u.frozen ? 'text-amber-400' : 'text-zinc-500'}>
                          {u.frozen ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-zinc-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}
                      </td>
                      {canModify && (
                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-flex gap-2">
                            {u.frozen ? (
                              <button type="button" onClick={() => handleEnable(u.id, true)} className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
                                Unfreeze
                              </button>
                            ) : (
                              <button type="button" onClick={() => handleFreeze(u.id)} className="text-sm font-medium text-red-400 hover:text-red-300">
                                Freeze
                              </button>
                            )}
                            {u.enabled === false && (
                              <button type="button" onClick={() => handleEnable(u.id, true)} className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
                                Enable
                              </button>
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
