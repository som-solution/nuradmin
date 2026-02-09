import { useCallback, useEffect, useState } from 'react';
import { api, type Recipient, type RecipientBody } from '../lib/api';
import type { ApiError } from '../lib/api';

export default function Recipients() {
  const [list, setList] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RecipientBody>({
    name: '',
    accountNumber: '',
    bankCode: '',
    currency: 'GBP',
    country: 'GB',
  });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Recipient[]>('/recipients');
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to load recipients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/recipients', form);
      setForm({ name: '', accountNumber: '', bankCode: '', currency: 'GBP', country: 'GB' });
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to add recipient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this recipient?')) return;
    try {
      await api.delete(`/recipients/${id}`);
      load();
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Recipients</h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700"
        >
          Add recipient
        </button>
      </div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">New recipient</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Account number</label>
              <input
                value={form.accountNumber}
                onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Bank code</label>
              <input
                value={form.bankCode}
                onChange={(e) => setForm((f) => ({ ...f, bankCode: e.target.value }))}
                required
                placeholder="e.g. 40-00-00"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="GBP">GBP</option>
                <option value="USD">USD</option>
                <option value="KES">KES</option>
                <option value="UGX">UGX</option>
                <option value="TZS">TZS</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Country</label>
              <input
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                required
                placeholder="GB, KE, UG, TZ"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {submitting ? 'Adding…' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {loading ? (
        <p className="text-slate-600">Loading recipients…</p>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          No recipients yet. Add one to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Account</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Bank code</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Currency</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Country</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-slate-700">{r.accountNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{r.bankCode}</td>
                  <td className="px-4 py-3 text-slate-700">{r.currency}</td>
                  <td className="px-4 py-3 text-slate-700">{r.country}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
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
