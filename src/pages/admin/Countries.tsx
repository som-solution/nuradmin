import { useCallback, useEffect, useState } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  adminApi,
  BACKEND_SETTINGS_404_MESSAGE,
  canRatesFeeCountries,
  getAdminErrorMessage,
  type ApiError,
  type SupportedCountry,
} from '../../lib/adminApi';

export default function Countries() {
  const { admin } = useAdminAuth();
  const [list, setList] = useState<SupportedCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [countryCode, setCountryCode] = useState('SO');
  const [name, setName] = useState('Somalia');
  const [currencyCode, setCurrencyCode] = useState('SOS');
  const [dialCode, setDialCode] = useState('252');
  const [phoneLength, setPhoneLength] = useState('9');
  const [displayOrder, setDisplayOrder] = useState('4');
  const [saving, setSaving] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editEnabled, setEditEnabled] = useState(true);
  const canAccess = admin?.adminType ? canRatesFeeCountries(admin.adminType) : false;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await adminApi.get<SupportedCountry[] | { content?: SupportedCountry[] }>('/countries');
      const arr = Array.isArray(raw) ? raw : (raw as { content?: SupportedCountry[] }).content ?? [];
      setList(arr);
    } catch (err) {
      setError((err as ApiError)?.status === 404 ? BACKEND_SETTINGS_404_MESSAGE : getAdminErrorMessage(err, 'Failed to load countries'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) load();
  }, [canAccess, load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = countryCode.trim().toUpperCase();
    const n = name.trim();
    const curr = currencyCode.trim().toUpperCase();
    const dial = dialCode.trim();
    const len = parseInt(phoneLength, 10);
    const order = parseInt(displayOrder, 10);
    if (!code || !n || !curr || !dial || isNaN(len) || isNaN(order)) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.post<SupportedCountry>('/countries', {
        countryCode: code,
        name: n,
        currencyCode: curr,
        dialCode: dial,
        phoneLength: len,
        displayOrder: order,
      });
      setSuccess(`Country ${n} (${code}) added. Add an exchange rate for ${curr} on the Exchange rates page so quotes work.`);
      setShowAdd(false);
      setCountryCode('SO');
      setName('Somalia');
      setCurrencyCode('SOS');
      setDialCode('252');
      setPhoneLength('9');
      setDisplayOrder('4');
      load();
    } catch (err) {
      setError((err as ApiError)?.status === 404 ? BACKEND_SETTINGS_404_MESSAGE : getAdminErrorMessage(err, 'Failed to add country'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (code: string, enabled: boolean) => {
    setError(null);
    setSuccess(null);
    try {
      await adminApi.put<SupportedCountry>(`/countries/${encodeURIComponent(code)}`, { enabled });
      setSuccess(`Country ${code} updated.`);
      setEditingCode(null);
      load();
    } catch (err) {
      setError((err as ApiError)?.status === 404 ? BACKEND_SETTINGS_404_MESSAGE : getAdminErrorMessage(err, 'Failed to update country'));
    }
  };

  if (!canAccess) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Supported countries</h1>
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200">
          You do not have permission (SUPER_ADMIN or ADMIN only).
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">Supported countries</h1>
      <p className="mb-6 text-zinc-500">
        Add or edit receive countries. Users can only send to countries in this list. After adding a country, add an exchange rate for its currency on the Exchange rates page.
      </p>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div>
      )}

      {!showAdd ? (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="mb-6 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-400"
        >
          Add country
        </button>
      ) : (
        <form onSubmit={handleAdd} className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
          <h2 className="mb-3 text-lg font-semibold text-zinc-300">New country</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-zinc-400">
              Country code (e.g. SO)
              <input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-zinc-400">
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-zinc-400">
              Currency code (e.g. SOS)
              <input
                type="text"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-zinc-400">
              Dial code (e.g. 252)
              <input
                type="text"
                value={dialCode}
                onChange={(e) => setDialCode(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-zinc-400">
              Phone length
              <input
                type="text"
                value={phoneLength}
                onChange={(e) => setPhoneLength(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-zinc-400">
              Display order
              <input
                type="text"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-400 disabled:opacity-50"
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <h2 className="mb-2 text-lg font-semibold text-zinc-300">Current countries</h2>
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-zinc-500">No countries yet. Add one above.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-700 bg-zinc-800/80">
                <th className="px-4 py-3 font-medium text-zinc-300">Code</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Name</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Currency</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Dial</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Enabled</th>
                <th className="px-4 py-3 font-medium text-zinc-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.countryCode} className="border-b border-zinc-800">
                  <td className="px-4 py-3 font-medium text-white">{c.countryCode}</td>
                  <td className="px-4 py-3 text-white">{c.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{c.currencyCode}</td>
                  <td className="px-4 py-3 text-zinc-400">+{c.dialCode}</td>
                  <td className="px-4 py-3">
                    {editingCode === c.countryCode ? (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editEnabled}
                          onChange={(e) => setEditEnabled(e.target.checked)}
                          className="rounded border-zinc-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdate(c.countryCode, editEnabled)}
                          className="text-emerald-400 hover:underline"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCode(null)}
                          className="text-zinc-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </label>
                    ) : (
                      <>
                        <span className={c.enabled !== false ? 'text-emerald-400' : 'text-zinc-500'}>
                          {c.enabled !== false ? 'Yes' : 'No'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCode(c.countryCode);
                            setEditEnabled(c.enabled !== false);
                          }}
                          className="ml-2 text-sm text-zinc-500 hover:text-white"
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
