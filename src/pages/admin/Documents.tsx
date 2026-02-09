import { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  adminApi,
  canKycDocuments,
  getAdminErrorMessage,
  type AdminDocument,
  type ApiError,
  type SpringPage,
  type DocumentViewResponse,
} from '../../lib/adminApi';

export default function AdminDocuments() {
  const { admin } = useAdminAuth();
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [userDocs, setUserDocs] = useState<AdminDocument[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);
  const canAccess = admin?.adminType ? canKycDocuments(admin.adminType) : false;

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.get<SpringPage<AdminDocument> | AdminDocument[]>(
        `/documents?status=${statusFilter}&page=0&size=20`
      );
      const list = Array.isArray(data) ? data : (data as SpringPage<AdminDocument>).content ?? [];
      setDocuments(list);
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to load documents'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const loadUserDocuments = async () => {
    if (!userIdFilter.trim()) return;
    setLoadingUser(true);
    setError(null);
    try {
      const data = await adminApi.get<SpringPage<AdminDocument> | AdminDocument[]>(
        `/users/${userIdFilter.trim()}/documents?page=0&size=20`
      );
      const list = Array.isArray(data) ? data : (data as SpringPage<AdminDocument>).content ?? [];
      setUserDocs(list);
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to load user documents'));
      setUserDocs([]);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleView = async (id: string) => {
    try {
      const res = await adminApi.get<DocumentViewResponse>(`/documents/${id}/view`);
      if (res.viewUrl) {
        window.open(res.viewUrl, '_blank');
        if (res.expiresMinutes) {
          setError(null); // clear so we can show a short hint if desired
        }
      } else setError('No view URL returned');
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to get view URL'));
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await adminApi.post(`/documents/${id}/approve`);
      loadDocuments();
      if (userDocs.some((d) => d.id === id)) loadUserDocuments();
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to approve'));
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason (optional, max 512 chars, shown to user):');
    if (reason === null) return;
    const trimmed = reason.slice(0, 512).trim();
    try {
      const path = trimmed ? `/documents/${id}/reject?reason=${encodeURIComponent(trimmed)}` : `/documents/${id}/reject`;
      await adminApi.post(path);
      loadDocuments();
      if (userDocs.some((d) => d.id === id)) loadUserDocuments();
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to reject'));
    }
  };

  if (!canAccess) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">KYC documents</h1>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">Only SUPER_ADMIN and ADMIN can review KYC documents.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">KYC documents</h1>
      <p className="mb-6 text-zinc-500">Review documents; view opens a short-lived presigned URL (audit logged). Approve/reject only when status is PENDING; ID docs set ID_VERIFIED, SOF docs set SOF_VERIFIED.</p>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {/* List by user */}
      <section className="mb-8">
        <h2 className="mb-3 font-semibold text-white">Documents by user</h2>
        <div className="flex flex-wrap items-end gap-2">
          <input
            type="text"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            placeholder="User UUID"
            className="rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white w-64"
          />
          <button
            type="button"
            onClick={loadUserDocuments}
            disabled={loadingUser}
            className="rounded-xl bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600 disabled:opacity-50"
          >
            {loadingUser ? 'Loading…' : 'Load'}
          </button>
        </div>
        {userDocs.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-400">Type</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-400">File</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-400">Status</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {userDocs.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-2 text-zinc-400">{d.documentType ?? '—'}</td>
                    <td className="px-4 py-2 text-zinc-500 text-sm">{d.fileName ?? '—'}</td>
                    <td className="px-4 py-2 text-zinc-500">{d.status ?? '—'}</td>
                    <td className="px-4 py-2 text-right">
                      <button type="button" onClick={() => handleView(d.id)} className="text-emerald-400 hover:underline text-sm mr-2">View</button>
                      {d.status === 'PENDING' && (
                        <>
                          <button type="button" onClick={() => handleApprove(d.id)} className="text-emerald-400 hover:underline text-sm mr-2">Approve</button>
                          <button type="button" onClick={() => handleReject(d.id)} className="text-red-400 hover:underline text-sm">Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Documents list with status filter */}
      <section>
        <div className="mb-3 flex items-center gap-4">
          <h2 className="font-semibold text-white">Documents</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'PENDING' | 'APPROVED' | 'REJECTED')}
            className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white"
          >
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
        {loading ? (
          <p className="text-zinc-500">Loading…</p>
        ) : documents.length === 0 ? (
          <p className="text-zinc-500">No documents with status {statusFilter}.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-800/50">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">File</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Uploaded</th>
                  {statusFilter === 'REJECTED' && <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Rejection reason</th>}
                  <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-800/50/80">
                    <td className="px-4 py-3 font-mono text-sm text-zinc-400">{d.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 font-mono text-sm text-zinc-500">{d.userId?.slice(0, 8) ?? '—'}…</td>
                    <td className="px-4 py-3 text-zinc-400">{d.documentType ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-500 text-sm max-w-[120px] truncate" title={d.fileName}>{d.fileName ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-500 text-sm">
                      {(d.uploadedAt ?? d.createdAt) ? new Date((d.uploadedAt ?? d.createdAt) as string).toLocaleString() : '—'}
                    </td>
                    {statusFilter === 'REJECTED' && (
                      <td className="px-4 py-3 text-zinc-500 text-sm max-w-[200px] truncate" title={d.rejectionReason}>{d.rejectionReason ?? '—'}</td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => handleView(d.id)} className="text-emerald-400 hover:underline text-sm mr-2">View</button>
                      {d.status === 'PENDING' && (
                        <>
                          <button type="button" onClick={() => handleApprove(d.id)} className="text-emerald-400 hover:underline text-sm mr-2">Approve</button>
                          <button type="button" onClick={() => handleReject(d.id)} className="text-red-400 hover:underline text-sm">Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
