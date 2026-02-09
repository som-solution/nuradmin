/**
 * User (customer) API client. All requests go to /api/* (auth, recipients, transactions, send, compliance).
 * Used by the customer app only. Admin app uses adminApi.ts and /api/admin/*.
 */
// In dev, default to backend on 8080. Override with VITE_API_BASE_URL if needed.
const backendBase = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8080' : '');
const BASE_URL = backendBase.replace(/\/$/, '') + '/api';

export interface ApiError {
  message?: string;
  error?: string;
  status?: number;
  details?: Record<string, unknown>;
}

/** Build a user-facing error string from API error (message + optional field errors). */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const apiErr = err as ApiError;
  const details = apiErr?.details as { errors?: Record<string, string> } | undefined;
  if (details?.errors && typeof details.errors === 'object') {
    const parts = Object.entries(details.errors).map(([k, v]) => (v ? `${k}: ${v}` : k)).filter(Boolean);
    if (parts.length) return parts.join('. ');
  }
  const msg = apiErr?.message ?? apiErr?.error;
  if (msg) return msg;
  if (apiErr?.status === 401) return "Invalid email or password. Register first if you don't have an account.";
  if (apiErr?.status === 403) return 'Your account has been disabled or suspended. Please contact support.';
  if (apiErr?.status === 429) return "Too many login attempts. Please wait about a minute before trying again, or use a different email.";
  return fallback;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err: ApiError = {
      message: data.message ?? data.error ?? 'Request failed',
      error: data.error,
      status: res.status,
      details: data,
    };
    throw err;
  }
  return data as T;
}

async function requestMultipart<T>(path: string, formData: FormData): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', body: formData, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ApiError = {
      message: data.message ?? data.error ?? 'Request failed',
      error: data.error,
      status: res.status,
      details: data,
    };
    throw err;
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postMultipart: <T>(path: string, formData: FormData) => requestMultipart<T>(path, formData),
};

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  user?: { id: string; email: string };
}

export interface MeResponse {
  id: string;
  email: string;
  createdAt?: string;
}

export interface RecipientBody {
  name: string;
  accountNumber: string;
  bankCode: string;
  currency: string;
  country: string;
}

export interface Recipient {
  id: string;
  name: string;
  accountNumber: string;
  bankCode: string;
  currency: string;
  country: string;
  createdAt?: string;
}

export interface Transaction {
  id: string;
  status: string;
  amount?: string;
  currency?: string;
  recipientId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuoteRequest {
  amount: string;
  currency: string;
  destinationCurrency: string;
  destinationCountry: string;
}

export interface QuoteResponse {
  quoteId: string;
  sourceAmount: string;
  sourceCurrency: string;
  destinationAmount: string;
  destinationCurrency: string;
  fee: string;
  rate?: string;
  expiresAt?: string;
}

export interface CreatePaymentRequest {
  quoteId: string;
  recipientId: string;
  idempotencyKey: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreatePaymentResponse {
  transactionId: string;
  clientSecret?: string;
  stripePaymentIntentId?: string;
  redirectUrl?: string;
  [key: string]: unknown;
}

export type KycTier = 'NONE' | 'ID_VERIFIED' | 'SOF_VERIFIED';
export type DocumentType = 'PASSPORT' | 'DRIVING_LICENCE' | 'PAYSLIP' | 'BANK_STATEMENT';

export interface ComplianceProfile {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  countryCode?: string;
  [key: string]: unknown;
}

export interface UserDocument {
  id: string;
  documentType?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface ComplianceDocumentsResponse {
  documents?: UserDocument[];
  kycTier?: KycTier;
}
