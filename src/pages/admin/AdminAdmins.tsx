import { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  adminApi,
  canAdminManagement,
  getAdminErrorMessage,
  type AdminEntity,
  type ApiError,
  type CreateAdminBody,
  type SpringPage,
  type UpdateAdminBody,
} from '../../lib/adminApi';

export default function AdminAdmins() {
  const { admin: currentAdmin } = useAdminAuth();
  const [page, setPage] = useState<SpringPage<AdminEntity> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNum, setPageNum] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createAdminType, setCreateAdminType] = useState<'ADMIN' | 'OPS' | 'SUPPORT' | 'SUPER_ADMIN'>('OPS');
  const [creating, setCreating] = useState(false);
  const pageSize = 20;
  const canAccess = currentAdmin?.adminType ? canAdminManagement(currentAdmin.adminType) : false;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.get<SpringPage<AdminEntity>>(
        `/admins?page=${pageNum}&size=${pageSize}&sort=createdAt,desc`
      );
      setPage(data);
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to load admins'));
    } finally {
      setLoading(false);
    }
  }, [pageNum]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (a: AdminEntity) => {
    setEditingId(a.id);
    setEditEmail(a.email ?? '');
    setEditPassword('');
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditEmail('');
    setEditPassword('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = createEmail.trim();
    const password = createPassword;
    if (!email || !password) return;
    if (password.length < 8 || password.length > 128) {
      setError('Password must be 8–128 characters.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const body: CreateAdminBody = { email, password, adminType: createAdminType };
      await adminApi.post('/admins', body);
      setShowCreate(false);
      setCreateEmail('');
      setCreatePassword('');
      setCreateAdminType('OPS');
      load();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === 'EMAIL_TAKEN' || apiErr.message?.includes('email') || apiErr.message?.includes('EMAIL')) {
        setError('Email already in use. Choose a different email.');
      } else {
        setError(getAdminErrorMessage(err, 'Create failed (e.g. password 8–128 chars, valid email).'));
      }
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const body: UpdateAdminBody = {};
    if (editEmail.trim()) body.email = editEmail.trim();
    if (editPassword) body.password = editPassword;
    if (Object.keys(body).length === 0) {
      cancelEdit();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminApi.put(`/admins/${editingId}`, body);
      cancelEdit();
      load();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === 'EMAIL_TAKEN' || apiErr.message?.includes('email') || apiErr.message?.includes('EMAIL')) {
        setError('Email already in use by another admin. Choose a different email.');
      } else {
        setError(getAdminErrorMessage(err, 'Update failed (e.g. password min 8 chars)'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (!canAccess) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Admins</h1>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">Only SUPER_ADMIN can list and update admins.</p>
      </div>
    );
  }

  const list = page?.content ?? [];
  const totalPages = page?.totalPages ?? 0;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Admins</h1>
      <p className="mb-6 text-zinc-500">
        List and update admin accounts. Create new admins (ADMIN, OPS, SUPPORT, or SUPER_ADMIN). Password: 8–128 chars. Changes are audited.
      </p>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}
      {showCreate ? (
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
          <h2 className="mb-4 text-lg font-semibold text-white">Create admin</h2>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
            <label className="block text-sm font-medium text-zinc-400">
              Email
              <input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                required
                className="ml-2 mt-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 w-56"
                placeholder="ops@nurpay.local"
              />
            </label>
            <label className="block text-sm font-medium text-zinc-400">
              Password (8–128 chars)
              <input
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                required
                minLength={8}
                maxLength={128}
                className="ml-2 mt-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 w-48"
              />
            </label>
            <label className="block text-sm font-medium text-zinc-400">
              Role
              <select
                value={createAdminType}
                onChange={(e) => setCreateAdminType(e.target.value as typeof createAdminType)}
                className="ml-2 mt-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 w-52"
              >
                <option value="ADMIN">ADMIN (refund, cancel, KYC)</option>
                <option value="OPS">OPS (freeze, retry, outbox, disputes)</option>
                <option value="SUPPORT">SUPPORT (read-only)</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN (full)</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setError(null); }}
              className="rounded-xl border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
          </form>
        </div>
      ) : (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => { setShowCreate(true); setError(null); }}
            className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
          >
            Create admin
          </button>
        </div>
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
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Role</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">MFA</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Enabled</th>
                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Created</th>
                    <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {list.map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-800/40 transition-colors">
                      {editingId === a.id ? (
                        <td colSpan={6} className="px-4 py-3">
                          <form onSubmit={handleSave} className="flex flex-wrap items-end gap-4">
                            <label className="block text-sm font-medium text-zinc-400">
                              Email
                              <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="ml-2 mt-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-white w-56 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                              />
                            </label>
                            <label className="block text-sm font-medium text-zinc-400">
                              New password (blank = keep)
                              <input
                                type="password"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                placeholder="Min 8 chars"
                                minLength={8}
                                maxLength={128}
                                className="ml-2 mt-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-white w-48 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                              />
                            </label>
                            <button type="submit" disabled={saving} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50">
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button type="button" onClick={cancelEdit} className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                              Cancel
                            </button>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-3.5 text-white">{a.email}</td>
                          <td className="px-4 py-3.5"><span className="font-medium text-emerald-400/90">{a.adminType}</span></td>
                          <td className="px-4 py-3.5 text-zinc-500">{a.mfaEnabled ? 'Yes' : 'No'}</td>
                          <td className="px-4 py-3.5 text-zinc-500">{a.enabled !== false ? 'Yes' : 'No'}</td>
                          <td className="px-4 py-3.5 text-sm text-zinc-500">{a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}</td>
                          <td className="px-4 py-3.5 text-right">
                            <button type="button" onClick={() => startEdit(a)} className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
                              Update
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                disabled={pageNum === 0}
                onClick={() => setPageNum((p) => p - 1)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-500">Page {pageNum + 1} of {totalPages}</span>
              <button
                type="button"
                disabled={pageNum >= totalPages - 1}
                onClick={() => setPageNum((p) => p + 1)}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
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
