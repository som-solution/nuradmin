# Code vs checklist verification

This doc confirms the **nuradmin** (admin web app) and **user (customer)** code match [FRONTEND-FLOW-CHECKLIST.md](FRONTEND-FLOW-CHECKLIST.md) and the API docs. Last checked against the codebase.

---

## Auth separation (same as checklist)

| Check | Code |
|-------|------|
| Admin app uses **only** `/api/admin/*` | `src/lib/adminApi.ts`: `BASE_URL = backend + '/api/admin'`. All admin pages use `adminApi.get/post/put`. |
| Admin login | `AdminAuthContext.login()` → `adminApi.post('/auth/login', { email, password })` → full path `POST /api/admin/auth/login`. |
| Admin token stored | `adminAccessToken`, `adminRefreshToken` in localStorage; `adminId`, `adminType` in context. |
| Admin refresh | `adminApi.post('/auth/refresh', { refreshToken })`. Also: 401 in any request triggers one refresh + retry in `adminApi.request()`. |
| User app uses **only** `/api/*` (no admin) | `src/lib/api.ts`: `BASE_URL = backend + '/api'`. Customer routes use `api.*`; Login/Register use AuthContext (user). |
| No mix | Admin never calls `POST /api/auth/login` or register. User app never calls `adminApi` or `/api/admin/*`. |

---

## RBAC (same as checklist)

| Role | Checklist | Code |
|------|-----------|------|
| Refund / Cancel | SUPER_ADMIN, ADMIN only | `canRefundCancel(adminType)` → true for SUPER_ADMIN, ADMIN. Used in AdminTransactions for button visibility. |
| Retry payout | SUPER_ADMIN, ADMIN, OPS | `canRetryPayout(adminType)`. AdminTransactions shows Retry only when true. |
| Freeze / Enable user | SUPER_ADMIN, ADMIN, OPS | `canFreezeEnable(adminType)`. Users page shows Freeze/Enable only when true. |
| KYC documents | SUPER_ADMIN, ADMIN only | `canKycDocuments(adminType)`. Documents page and nav link visible only when true. |
| Admins (list/create/update) | SUPER_ADMIN only | `canAdminManagement(adminType)`. AdminAdmins + nav link only when true. |
| Disputes | SUPER_ADMIN, ADMIN, OPS (not SUPPORT) | `canDisputes(adminType)`. Disputes page has guard; nav link hidden for SUPPORT. |
| Audit, Provider, Outbox, Reconciliation | Per checklist | `canAudit`, `canProviderToggle`, `canOutbox`, `canReconciliation` used in AdminLayout and AdminDashboard. |

---

## Admin API paths (same as docs)

| Feature | Checklist / API doc | Code path |
|---------|---------------------|-----------|
| Login | `POST /api/admin/auth/login` | `adminApi.post('/auth/login', body)` |
| Refresh | `POST /api/admin/auth/refresh` | `adminApi.post('/auth/refresh', body)` + 401 retry in request() |
| List users | `GET /api/admin/users?page=&size=&sort=` | `adminApi.get('/users?page=...')` |
| Freeze | `PUT /api/admin/users/{id}/freeze?reason=` | `adminApi.put('/users/${userId}/freeze?...')` |
| Enable | `PUT /api/admin/users/{id}/enable?enable=` | `adminApi.put('/users/${userId}/enable?...')` |
| List transactions | `GET /api/admin/transactions?page=&size=&status=` | `adminApi.get('/transactions?page=...&status=...')` |
| Refund | `POST /api/admin/transactions/{id}/refund` | `adminApi.post('/transactions/${t.id}/refund')` |
| Retry | `POST /api/admin/transactions/{id}/retry` | `adminApi.post('/transactions/${t.id}/retry')` |
| Cancel | `POST /api/admin/transactions/{id}/cancel` | `adminApi.post('/transactions/${t.id}/cancel')` |
| List audit | `GET /api/admin/audit?page=&size=` | `adminApi.get('/audit?page=...')` |
| Audit by entity | `GET /api/admin/audit/entity?entityType=&entityId=` | `adminApi.get('/audit/entity?entityType=...&entityId=...')` |
| Provider | `PUT /api/admin/provider/{code}?enabled=` | `adminApi.put('/provider/${code}?enabled=...')` |
| Outbox list | `GET /api/admin/outbox?page=&size=` | `adminApi.get('/outbox?page=...')` |
| Process outbox | `POST /api/admin/outbox/{eventId}/process` | `adminApi.post('/outbox/${eventId}/process')` |
| List disputes | `GET /api/admin/disputes?page=&size=&status=` | `adminApi.get('/disputes?page=...&status=...')` |
| Resolve dispute | `POST /api/admin/disputes/{id}/resolve?resolution=&notes=` | `adminApi.post('/disputes/${id}/resolve?resolution=...&notes=...')` |
| List documents | `GET /api/admin/documents?status=&page=&size=` | `adminApi.get('/documents?status=...')` |
| User documents | `GET /api/admin/users/{userId}/documents` | `adminApi.get('/users/${userId}/documents')` |
| View document | `GET /api/admin/documents/{id}/view` | `adminApi.get('/documents/${id}/view')` → open viewUrl |
| Approve document | `POST /api/admin/documents/{id}/approve` | `adminApi.post('/documents/${id}/approve')` |
| Reject document | `POST /api/admin/documents/{id}/reject?reason=` | `adminApi.post('/documents/${id}/reject?reason=...')` |
| List admins | `GET /api/admin/admins?page=&size=` | `adminApi.get('/admins?page=...')` |
| Create admin | `POST /api/admin/admins` | `adminApi.post('/admins', body)` |
| Update admin | `PUT /api/admin/admins/{id}` | `adminApi.put('/admins/${editingId}', body)` |
| Reconciliation | `POST /api/admin/reconciliation/run` | `adminApi.post('/reconciliation/run')` |

All paths are relative to `BASE_URL` = `{backend}/api/admin`, so full URLs match the checklist.

---

## Admin UI details (same as checklist)

- **Transactions table:** Status filter, receiveAmount/receiveCurrency, failureReason columns; Refund / Cancel / Retry buttons by role.
- **Documents:** Status filter (PENDING/APPROVED/REJECTED), list by user (userId input), View (new tab), Approve, Reject with optional reason.
- **Disputes:** Status filter, resolve with resolution + optional notes; SUPPORT sees message only (no API call).
- **Seed credentials:** AdminLogin shows `admin@nurpay.local` / `admin123` and `superadmin2@nurpay.local` / `admin123`.

---

## User app (this repo)

The same repo contains the **customer** UI (Login, Register, Dashboard, Send, Recipients, Transactions, Compliance). It uses `src/lib/api.ts` (base `/api`) and `AuthContext` (user JWT). It does **not** call any admin endpoint; staff are directed to `/admin/login` from Login page copy.

---

## Summary

- **Admin app:** Auth, RBAC, and all admin API paths and actions match the frontend flow checklist and README-ADMIN-API.
- **User app:** Uses user API only; no mixing with admin.
- **Tokens:** User JWT for `/api/*`, admin JWT for `/api/admin/*`; header `Authorization: Bearer <token>` in both clients.
