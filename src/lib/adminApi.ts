/**
 * Admin API client. Must match docs/README-ADMIN-API.md and docs/RBAC-ENDPOINT-MAPPING.md.
 * Base path: /api/admin. All requests use admin JWT (never user token).
 */
const backendBase = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8080' : '');
const BASE_URL = backendBase.replace(/\/$/, '') + '/api/admin';

export type AdminType = 'SUPER_ADMIN' | 'ADMIN' | 'OPS' | 'SUPPORT';

export interface ApiError {
  message?: string;
  error?: string;
  code?: string;
  errors?: Record<string, string>;
  status?: number;
}

/** Admin JWT only. Must be the accessToken from POST /api/admin/auth/login — never use the user token (accessToken from /api/auth/login). */
function getAdminToken(): string | null {
  return localStorage.getItem('adminAccessToken');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store', // always get fresh data (e.g. new app users in admin list)
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err: ApiError = {
      message: data.message ?? data.error ?? 'Request failed',
      error: data.error,
      code: data.code,
      errors: data.errors,
      status: res.status,
    };
    throw err;
  }
  return data as T;
}

/** User-facing message for admin API errors (credentials, rate limit, 403, etc.). Use this when displaying API errors so 403 shows a helpful message instead of "Forbidden". */
export function getAdminErrorMessage(err: unknown, fallback: string): string {
  const apiErr = err as ApiError;
  const networkMsg = typeof (err as Error)?.message === 'string' ? (err as Error).message : '';
  if (networkMsg === 'Failed to fetch' || networkMsg.includes('NetworkError') || networkMsg.includes('Load failed')) {
    const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
    return `Cannot reach the backend (${base}). Check: (1) Backend is running — open ${base}/actuator/health in a new tab. (2) If using a remote API from localhost, the server must allow CORS for http://localhost:3000. Check the browser Network tab for blocked requests.`;
  }
  // Check status first so 403 always gets a helpful message (backend often returns body "Forbidden")
  if (apiErr?.status === 401) return 'Invalid credentials: the backend could not find that email in admins or the password did not match.';
  if (apiErr?.status === 403) return 'You don’t have permission for this page. Only certain roles can access it (e.g. Admins is SUPER_ADMIN only). Log in with admin@nurpay.local or superadmin2@nurpay.local (password admin123) for full access, or use the sidebar to open only the links you can access.';
  if (apiErr?.status === 405) return "Admin login requires POST, not GET. Use the Sign in button; do not open the API URL in the browser.";
  if (apiErr?.status === 429) return 'Too many login attempts. Wait about a minute, or reset the limit in Redis (nurpay:ratelimit:login:<email>).';
  const msg = apiErr?.message ?? apiErr?.error;
  if (msg) {
    if (typeof msg === 'string' && (msg.includes('GET') || msg.includes('method') || msg.includes('not supported'))) {
      return "Admin login requires POST with JSON body. Use the Sign in button on this page — do not open the API URL in the browser (that sends GET).";
    }
    return msg;
  }
  return fallback;
}

export const adminApi = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  /** POST with JSON body. Admin login is POST /api/admin/auth/login with { email, password } — do not use GET (e.g. opening the URL in browser). */
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
};

// Admin auth
export interface AdminLoginResponse {
  accessToken: string;
  refreshToken: string;
  adminId: string;
  adminType: AdminType;
  email: string;
}

// Spring Page<T> (backend may return camelCase or snake_case)
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first?: boolean;
  last?: boolean;
}

/** Normalize GET /api/admin/users (and other paged) response. Handles Spring Page camelCase, snake_case, raw array, or wrapper keys (data/users). */
export function normalizeSpringPage<T>(data: unknown): SpringPage<T> {
  if (!data || typeof data !== 'object') {
    return { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 };
  }
  const d = data as Record<string, unknown>;
  const rawList =
    d.content ?? d.data ?? d.users ?? (Array.isArray(d) ? d : null);
  const content = Array.isArray(rawList) ? (rawList as T[]) : [];
  const totalElements = Number(
    d.totalElements ?? d.total_elements ?? content.length
  );
  const size = Number(d.size ?? 20);
  const number = Number(d.number ?? 0);
  const totalPages = Number(
    d.totalPages ?? d.total_pages ?? Math.max(1, Math.ceil(totalElements / size))
  );
  return {
    content,
    totalElements,
    totalPages,
    size,
    number,
    first: d.first as boolean | undefined,
    last: d.last as boolean | undefined,
  };
}

// Entities
export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  frozen?: boolean;
  countryCode?: string;
  userNumber?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface AdminTransaction {
  id: string;
  userId?: string;
  recipientId?: string;
  amount?: string;
  fee?: string;
  currency?: string;
  status?: string;
  idempotencyKey?: string;
  payoutProviderRef?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface AuditLog {
  id: string;
  eventType?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  actorEmail?: string;
  adminType?: string;
  reason?: string;
  ipAddress?: string;
  payloadJson?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface OutboxEvent {
  id: string;
  aggregateType?: string;
  eventType?: string;
  payload?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface Dispute {
  id: string;
  transactionId?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
}

// RBAC: who can do what
export function canFreezeEnable(adminType: AdminType): boolean {
  return ['SUPER_ADMIN', 'ADMIN', 'OPS'].includes(adminType);
}

export function canRefundCancel(adminType: AdminType): boolean {
  return ['SUPER_ADMIN', 'ADMIN'].includes(adminType);
}

export function canRetryPayout(adminType: AdminType): boolean {
  return ['SUPER_ADMIN', 'ADMIN', 'OPS'].includes(adminType);
}

export function canReconciliation(adminType: AdminType): boolean {
  return ['SUPER_ADMIN', 'ADMIN'].includes(adminType);
}

export function canProviderToggle(adminType: AdminType): boolean {
  return ['SUPER_ADMIN', 'ADMIN', 'OPS'].includes(adminType);
}

export function canOutbox(adminType: AdminType): boolean {
  return ['SUPER_ADMIN', 'ADMIN', 'OPS'].includes(adminType);
}

export function canDisputes(adminType: AdminType): boolean {
  return ['SUPER_ADMIN', 'ADMIN', 'OPS'].includes(adminType);
}

export function canAudit(_adminType: AdminType): boolean {
  return true; // any admin
}

export function canListUsers(_adminType: AdminType): boolean {
  return true;
}

export function canListTransactions(_adminType: AdminType): boolean {
  return true;
}

export function canKycDocuments(adminType: AdminType): boolean {
  return ['SUPER_ADMIN', 'ADMIN'].includes(adminType);
}

/** SUPER_ADMIN only: list admins, update admin email/password */
export function canAdminManagement(adminType: AdminType): boolean {
  return adminType === 'SUPER_ADMIN';
}

/** Admin entity (from GET /api/admin/admins) */
export interface AdminEntity {
  id: string;
  email: string;
  adminType: AdminType;
  mfaEnabled?: boolean;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/** Body for POST /api/admin/admins (SUPER_ADMIN only). adminType: SUPER_ADMIN | ADMIN | OPS | SUPPORT. */
export interface CreateAdminBody {
  email: string;
  password: string;
  adminType: AdminType;
}

/** Response from POST /api/admin/admins (201) */
export interface CreateAdminResponse {
  adminId: string;
  email: string;
  adminType: AdminType;
  enabled?: boolean;
}

/** Body for PUT /api/admin/admins/{adminId} (both optional) */
export interface UpdateAdminBody {
  email?: string;
  password?: string;
}

/** Response from PUT /api/admin/admins/{adminId} */
export interface UpdateAdminResponse {
  adminId: string;
  email: string;
  adminType: AdminType;
  enabled?: boolean;
}

// Admin KYC document (UserDocument from backend)
export interface AdminDocument {
  id: string;
  userId?: string;
  documentType?: string;
  fileName?: string;
  status?: string;
  uploadedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  [key: string]: unknown;
}

/** Response from GET /api/admin/documents/{id}/view (presigned URL; audit logged) */
export interface DocumentViewResponse {
  viewUrl: string;
  expiresMinutes?: number;
}
