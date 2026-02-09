import { useCallback, useEffect, useState } from 'react';
import {
  api,
  type ComplianceDocumentsResponse,
  type ComplianceProfile,
  type DocumentType,
  type ApiError,
} from '../lib/api';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVING_LICENCE', label: 'Driving licence' },
  { value: 'PAYSLIP', label: 'Payslip' },
  { value: 'BANK_STATEMENT', label: 'Bank statement' },
];

const KYC_TIER_LABELS: Record<string, string> = {
  NONE: 'Not verified',
  ID_VERIFIED: 'ID verified',
  SOF_VERIFIED: 'Source of funds verified',
};

export default function Compliance() {
  const [profile, setProfile] = useState<ComplianceProfile>({});
  const [postcode, setPostcode] = useState('');
  const [postcodeResult, setPostcodeResult] = useState<unknown>(null);
  const [documents, setDocuments] = useState<ComplianceDocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<DocumentType>('PASSPORT');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const loadProfileAndDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, docsRes] = await Promise.all([
        api.get<ComplianceProfile>('/compliance/profile').catch(() => ({})),
        api.get<ComplianceDocumentsResponse>('/compliance/documents').catch(() => ({ documents: [], kycTier: 'NONE' as const })),
      ]);
      setProfile(profileRes || {});
      setDocuments(docsRes || { documents: [], kycTier: 'NONE' as const });
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfileAndDocs();
  }, [loadProfileAndDocs]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.put('/compliance/profile', profile);
      loadProfileAndDocs();
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePostcodeLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postcode.trim()) return;
    setError(null);
    try {
      const result = await api.get<unknown>(`/compliance/postcode-lookup?postcode=${encodeURIComponent(postcode.trim())}`);
      setPostcodeResult(result);
      if (result && typeof result === 'object' && 'addressLine1' in result) {
        setProfile((p) => ({ ...p, ...(result as ComplianceProfile) }));
      }
    } catch (err) {
      setError((err as ApiError).message ?? 'Postcode lookup failed');
      setPostcodeResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('documentType', uploadType);
      await api.postMultipart('/compliance/documents', formData);
      setUploadFile(null);
      loadProfileAndDocs();
    } catch (err) {
      setError((err as ApiError).message ?? 'Upload failed (max 10 MB; PDF, JPEG, PNG). Backend may return 503 if S3 is not configured.');
    } finally {
      setUploading(false);
    }
  };

  const kycTier = documents?.kycTier ?? 'NONE';
  const docList = documents?.documents ?? [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Verification (KYC)</h1>
      <p className="mb-6 text-slate-600">
        Complete your profile and upload ID/source-of-funds documents to increase send limits. Tier: <strong>{KYC_TIER_LABELS[kycTier] ?? kycTier}</strong>.
      </p>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-slate-600">Loading…</p>
      ) : (
        <div className="space-y-8">
          {/* Profile */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Profile</h2>
            <form onSubmit={handleSaveProfile} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">First name</label>
                <input
                  value={profile.firstName ?? ''}
                  onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Last name</label>
                <input
                  value={profile.lastName ?? ''}
                  onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Date of birth</label>
                <input
                  type="date"
                  value={profile.dateOfBirth ?? ''}
                  onChange={(e) => setProfile((p) => ({ ...p, dateOfBirth: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Address line 1</label>
                <input
                  value={profile.addressLine1 ?? ''}
                  onChange={(e) => setProfile((p) => ({ ...p, addressLine1: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Address line 2</label>
                <input
                  value={profile.addressLine2 ?? ''}
                  onChange={(e) => setProfile((p) => ({ ...p, addressLine2: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
                <input
                  value={profile.city ?? ''}
                  onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Postcode</label>
                <input
                  value={profile.postcode ?? ''}
                  onChange={(e) => setProfile((p) => ({ ...p, postcode: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Country code</label>
                <input
                  value={profile.countryCode ?? 'GB'}
                  onChange={(e) => setProfile((p) => ({ ...p, countryCode: e.target.value }))}
                  placeholder="GB"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </form>
          </section>

          {/* Postcode lookup */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Postcode lookup</h2>
            <form onSubmit={handlePostcodeLookup} className="flex flex-wrap items-end gap-2">
              <label className="flex-1 min-w-[120px]">
                <span className="mb-1 block text-sm font-medium text-slate-700">Postcode</span>
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="e.g. SW1A 1AA"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </label>
              <button
                type="submit"
                className="rounded-lg bg-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-300"
              >
                Look up
              </button>
            </form>
            {postcodeResult != null && (
              <pre className="mt-3 rounded bg-slate-100 p-3 text-sm overflow-auto">
                {JSON.stringify(postcodeResult, null, 2)}
              </pre>
            )}
          </section>

          {/* Document upload */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Upload document</h2>
            <p className="mb-3 text-sm text-slate-600">PDF, JPEG or PNG; max 10 MB. ID docs (passport, driving licence) and SOF (payslip, bank statement) increase your tier and limits.</p>
            <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-4">
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">Type</span>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as DocumentType)}
                  className="rounded-lg border border-slate-300 px-4 py-2 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {DOCUMENT_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium text-slate-700">File</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-teal-50 file:px-3 file:py-1.5 file:text-teal-700"
                />
              </label>
              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
            </form>
          </section>

          {/* My documents */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">My documents</h2>
            {docList.length === 0 ? (
              <p className="text-slate-600">No documents uploaded yet.</p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {docList.map((d) => (
                  <li key={d.id} className="py-2 flex items-center justify-between">
                    <span className="text-slate-900">{d.documentType ?? d.id}</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{d.status ?? '—'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
