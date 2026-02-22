import { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  adminApi,
  canRatesFeeCountries,
  getAdminErrorMessage,
  type FeeConfig as FeeConfigType,
} from '../../lib/adminApi';

export default function FeeConfig() {
  const { admin } = useAdminAuth();
  const [list, setList] = useState<FeeConfigType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendCurrency, setSendCurrency] = useState('GBP');
  const [feePercent, setFeePercent] = useState('2.5');
  const [feeMinAmount, setFeeMinAmount] = useState('1');
  const [feeMaxAmount, setFeeMaxAmount] = useState('10');
  const [feeCurrency, setFeeCurrency] = useState('GBP');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const canAccess = admin?.adminType ? canRatesFeeCountries(admin.adminType) : false;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await adminApi.get<FeeConfigType[] | { content?: FeeConfigType[] }>('/fee-config');
      const arr = Array.isArray(raw) ? raw : (raw as { content?: FeeConfigType[] }).content ?? [];
      setList(arr);
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to load fee config'));
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
    const curr = feeCurrency.trim().toUpperCase();
    const pct = parseFloat(feePercent);
    const min = parseFloat(feeMinAmount);
    const max = parseFloat(feeMaxAmount);
    if (!send || isNaN(pct) || isNaN(min) || isNaN(max) || !curr) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.put<FeeConfigType>('/fee-config', {
        sendCurrency: send,
        feePercent: pct,
        feeMinAmount: min,
        feeMaxAmount: max,
        feeCurrency: curr,
      });
      setSuccess('Fee config saved for ' + send);
      load();
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Failed to save fee config'));
    } finally {
      setSaving(false);
    }
  };

  if (!canAccess) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Fee config</h1>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">
          You do not have permission (SUPER_ADMIN or ADMIN only).
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Fee config</h1>
      <p className="mb-6 text-zinc-500">
        Manage send fee: percent, min and max per send currency. Used by the user app quote.
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
          Fee %
          <input
            type="text"
            value={feePercent}
            onChange={(e) => setFeePercent(e.target.value)}
            required
            placeholder="2.5"
            className="ml-2 w-20 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          />
        </label>
        <label className="text-sm font-medium text-zinc-400">
          Min
          <input
            type="text"
            value={feeMinAmount}
            onChange={(e) => setFeeMinAmount(e.target.value)}
            required
            className="ml-2 w-20 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          />
        </label>
        <label className="text-sm font-medium text-zinc-400">
          Max
          <input
            type="text"
            value={feeMaxAmount}
            onChange={(e) => setFeeMaxAmount(e.target.value)}
            required
            className="ml-2 w-20 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          />
        </label>
        <label className="text-sm font-medium text-zinc-400">
          Fee currency
          <input
            type="text"
            value={feeCurrency}
            onChange={(e) => setFeeCurrency(e.target.value)}
            required
            placeholder="GBP"
            className="ml-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>

      <h2 className="mb-2 text-lg font-semibold text-zinc-300">Current fee configs</h2>
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-zinc-500">No fee configs yet. Add one above.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-700 bg-zinc-800/80">
                <th className="px-4 py-3 font-medium text-zinc-300">Send</th>
                <th className="px-4 py-3 font-medium text-zinc-300">%</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Min</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Max</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Fee currency</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id ?? f.sendCurrency} className="border-b border-zinc-800">
                  <td className="px-4 py-3 text-white">{f.sendCurrency}</td>
                  <td className="px-4 py-3 text-white">{f.feePercent}%</td>
                  <td className="px-4 py-3 text-white">{f.feeMinAmount}</td>
                  <td className="px-4 py-3 text-white">{f.feeMaxAmount}</td>
                  <td className="px-4 py-3 text-zinc-400">{f.feeCurrency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
