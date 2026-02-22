import { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  adminApi,
  BACKEND_SETTINGS_404_MESSAGE,
  canRatesFeeCountries,
  getAdminErrorMessage,
  type ApiError,
  type ExchangeRate,
} from '../../lib/adminApi';

export default function Rates() {
  const { admin } = useAdminAuth();
  const [list, setList] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendCurrency, setSendCurrency] = useState('GBP');
  const [receiveCurrency, setReceiveCurrency] = useState('KES');
  const [rate, setRate] = useState('163');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const canAccess = admin?.adminType ? canRatesFeeCountries(admin.adminType) : false;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await adminApi.get<ExchangeRate[] | { content?: ExchangeRate[] }>('/rates');
      const arr = Array.isArray(raw) ? raw : (raw as { content?: ExchangeRate[] }).content ?? [];
      setList(arr);
    } catch (err) {
      setError((err as ApiError)?.status === 404 ? BACKEND_SETTINGS_404_MESSAGE : getAdminErrorMessage(err, 'Failed to load rates'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) load();
  }, [canAccess, load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const send = sendCurrency.trim().toUpperCase();
    const receive = receiveCurrency.trim().toUpperCase();
    const rateVal = rate.trim();
    if (!send || !receive || !rateVal) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.put<ExchangeRate>('/rates', {
        sendCurrency: send,
        receiveCurrency: receive,
        rate: rateVal,
      });
      setSuccess('Rate saved: 1 ' + send + ' = ' + rateVal + ' ' + receive);
      load();
    } catch (err) {
      setError((err as ApiError)?.status === 404 ? BACKEND_SETTINGS_404_MESSAGE : getAdminErrorMessage(err, 'Failed to save rate'));
    } finally {
      setSaving(false);
    }
  };

  if (!canAccess) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Exchange rates</h1>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">
          You do not have permission (SUPER_ADMIN or ADMIN only).
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Exchange rates</h1>
      <p className="mb-6 text-zinc-500">
        Manage quote rates used by the user app (e.g. 1 GBP = X KES). Same pair updates existing; new pair creates a row.
      </p>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
        <label className="text-sm font-medium text-zinc-400">
          Send currency
          <input
            type="text"
            value={sendCurrency}
            onChange={(e) => setSendCurrency(e.target.value)}
            required
            placeholder="GBP"
            className="ml-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          />
        </label>
        <label className="text-sm font-medium text-zinc-400">
          Receive currency
          <input
            type="text"
            value={receiveCurrency}
            onChange={(e) => setReceiveCurrency(e.target.value)}
            required
            placeholder="KES"
            className="ml-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          />
        </label>
        <label className="text-sm font-medium text-zinc-400">
          Rate (1 send = X receive)
          <input
            type="text"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            required
            placeholder="163"
            className="ml-2 w-24 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save rate'}
        </button>
      </form>

      <h2 className="mb-2 text-lg font-semibold text-zinc-300">Current rates</h2>
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-zinc-500">No rates yet. Add one above.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-700 bg-zinc-800/80">
                <th className="px-4 py-3 font-medium text-zinc-300">Send</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Receive</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Rate</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id ?? (r.sendCurrency + '-' + r.receiveCurrency)} className="border-b border-zinc-800">
                  <td className="px-4 py-3 text-white">{r.sendCurrency}</td>
                  <td className="px-4 py-3 text-white">{r.receiveCurrency}</td>
                  <td className="px-4 py-3 text-emerald-400">{Number(r.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
