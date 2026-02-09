# RBAC & Endpoint Mapping

> **Canonical reference:** See **[RBAC-FINAL.md](./RBAC-FINAL.md)** for the final, complete spec (JWT claims, all endpoints, permissions, implementation notes). This file is a shorter summary.

Single reference so **frontend and backend match**: which role can call which endpoint.  
Base path: **`/api`**.

---

## Role legend

| Role | Can do |
|------|--------|
| **SUPER_ADMIN** | Full access to all admin and sensitive actions |
| **ADMIN** | User freeze/enable, refund/cancel/retry, reconciliation, provider toggle, dispute resolve, audit, users, transactions, outbox, disputes |
| **OPS** | Freeze/enable users, retry payouts, process outbox, provider toggle, list/resolve disputes; **no** refund/cancel/reconciliation |
| **SUPPORT** | **Read-only**: users list, transactions list, audit; **no** disputes, outbox, freeze/enable, or any fund/state changes |
| **USER** | Own auth, transactions, recipients, compliance, notifications only (user JWT only) |

---

## Full endpoint table (source of truth)

### Auth (user)

| Endpoint | Method | Auth | SUPER_ADMIN | ADMIN | OPS | SUPPORT | USER | Notes |
|----------|--------|------|:-----------:|:-----:|:---:|:-------:|:----:|------|
| `/api/auth/register` | POST | No | ❌ | ❌ | ❌ | ❌ | ✅ | User registration |
| `/api/auth/login` | POST | No | ❌ | ❌ | ❌ | ❌ | ✅ | Returns JWT |
| `/api/auth/refresh` | POST | JWT | ✅ | ✅ | ✅ | ✅ | ✅ | Refresh access token |
| `/api/auth/change-password` | POST | JWT | ✅ | ✅ | ✅ | ✅ | ✅ | All authenticated |
| `/api/auth/me` | GET | JWT | ✅ | ✅ | ✅ | ✅ | ✅ | Returns own profile |
| `/api/auth/logout` | POST | JWT | ✅ | ✅ | ✅ | ✅ | ✅ | Revoke JWT session |
| `/api/auth/mfa/*` | POST | JWT | ✅ | ✅ | ✅ | ✅ | ✅ | TOTP/OTP endpoints |

*Implementation note: User auth endpoints are used with **user JWT** only (app users). Admins use `/api/admin/auth/*` for admin sessions.*

### Transactions (users)

| Endpoint | Method | Auth | SUPER_ADMIN | ADMIN | OPS | SUPPORT | USER | Notes |
|----------|--------|------|:-----------:|:-----:|:---:|:-------:|:----:|------|
| `/api/transactions/send` | POST | JWT | ❌ | ❌ | ❌ | ❌ | ✅ | Send money, idempotencyKey |
| `/api/transactions` | GET | JWT | ✅ | ✅ | ✅ | ✅ | ✅ | Users see own transactions |
| `/api/transactions/{id}/status` | GET | JWT | ✅ | ✅ | ✅ | ✅ | ✅ | Transaction status |
| `/api/transactions/{id}/receipt` | GET | JWT | ✅ | ✅ | ✅ | ✅ | ✅ | PDF receipt |
| `/api/transactions/calculate-fee` | POST | **No** | ❌ | ❌ | ❌ | ❌ | ✅ | Fee calculation (public) |
| `/api/transactions/balance` | GET | JWT | ✅ | ✅ | ✅ | ✅ | ✅ | View balance |

*Implementation note: User transaction endpoints require **user JWT**; admins do not use these for their own wallet.*

### Recipients / address book

| Endpoint | Method | Auth | SUPER_ADMIN | ADMIN | OPS | SUPPORT | USER | Notes |
|----------|--------|------|:-----------:|:-----:|:---:|:-------:|:----:|------|
| `/api/recipients` | POST | JWT | ❌ | ❌ | ❌ | ❌ | ✅ | Add recipient |
| `/api/recipients` | GET | JWT | ✅ | ✅ | ✅ | ✅ | ✅ | Users: own recipients |
| `/api/recipients/{id}` | DELETE | JWT | ✅ | ✅ | ✅ | ❌ | ✅ | Delete recipient |

### Compliance & KYC

| Endpoint | Method | Auth | SUPER_ADMIN | ADMIN | OPS | SUPPORT | USER | Notes |
|----------|--------|------|:-----------:|:-----:|:---:|:-------:|:----:|------|
| `/api/compliance/postcode-lookup` | GET | JWT | ✅ | ✅ | ✅ | ✅ | ✅ | UK address lookup |
| `/api/compliance/profile` | PUT | JWT | ✅ | ✅ | ✅ | ✅ | ✅ | Update KYC info |

### Notifications

| Endpoint | Method | Auth | SUPER_ADMIN | ADMIN | OPS | SUPPORT | USER | Notes |
|----------|--------|------|:-----------:|:-----:|:---:|:-------:|:----:|------|
| `/api/notifications/device` | POST | JWT | ✅ | ✅ | ✅ | ✅ | ✅ | Register device token |
| `/api/notifications` | GET | JWT | ✅ | ✅ | ✅ | ✅ | ✅ | List notifications |
| `/api/notifications/{id}/read` | PUT | JWT | ✅ | ✅ | ✅ | ✅ | ✅ | Mark as read |

### Admin auth

| Endpoint | Method | Auth | SUPER_ADMIN | ADMIN | OPS | SUPPORT | USER | Notes |
|----------|--------|------|:-----------:|:-----:|:---:|:-------:|:----:|------|
| `/api/admin/auth/login` | POST | No | ✅ | ✅ | ✅ | ✅ | ❌ | Returns admin JWT |
| `/api/admin/auth/refresh` | POST | JWT | ✅ | ✅ | ✅ | ✅ | ❌ | Refresh admin JWT |

### Admin user management

| Endpoint | Method | Auth | SUPER_ADMIN | ADMIN | OPS | SUPPORT | USER | Notes |
|----------|--------|------|:-----------:|:-----:|:---:|:-------:|:----:|------|
| `/api/admin/users` | GET | JWT | ✅ | ✅ | ✅ | ✅ | ❌ | List users |
| `/api/admin/users/{id}/freeze` | PUT | JWT | ✅ | ✅ | ✅ | ❌ | ❌ | Freeze user |
| `/api/admin/users/{id}/enable` | PUT | JWT | ✅ | ✅ | ✅ | ❌ | ❌ | Enable user |

### Admin transactions

| Endpoint | Method | Auth | SUPER_ADMIN | ADMIN | OPS | SUPPORT | USER | Notes |
|----------|--------|------|:-----------:|:-----:|:---:|:-------:|:----:|------|
| `/api/admin/transactions` | GET | JWT | ✅ | ✅ | ✅ | ✅ | ❌ | All transactions |
| `/api/admin/transactions/{id}/refund` | POST | JWT | ✅ | ✅ | ❌ | ❌ | ❌ | Refund TX |
| `/api/admin/transactions/{id}/retry` | POST | JWT | ✅ | ✅ | ✅ | ❌ | ❌ | Retry payout |
| `/api/admin/transactions/{id}/cancel` | POST | JWT | ✅ | ✅ | ❌ | ❌ | ❌ | Cancel TX |

### Admin management (SUPER_ADMIN only)

| Endpoint | Method | Auth | SUPER_ADMIN | ADMIN | OPS | SUPPORT | USER | Notes |
|----------|--------|------|:-----------:|:-----:|:---:|:-------:|:----:|------|
| `/api/admin/admins` | POST | JWT | ✅ | ❌ | ❌ | ❌ | ❌ | Create admin |
| `/api/admin/admins` | GET | JWT | ✅ | ❌ | ❌ | ❌ | ❌ | List admins |
| `/api/admin/admins/{id}` | PUT | JWT | ✅ | ❌ | ❌ | ❌ | ❌ | Update admin email/password |

### Audit logs

| Endpoint | Method | Auth | SUPER_ADMIN | ADMIN | OPS | SUPPORT | USER | Notes |
|----------|--------|------|:-----------:|:-----:|:---:|:-------:|:----:|------|
| `/api/admin/audit` | GET | JWT | ✅ | ✅ | ✅ | ✅ | ❌ | All logs |
| `/api/admin/audit/entity` | GET | JWT | ✅ | ✅ | ✅ | ✅ | ❌ | Logs for specific entity |

### Reconciliation & providers

| Endpoint | Method | Auth | SUPER_ADMIN | ADMIN | OPS | SUPPORT | USER | Notes |
|----------|--------|------|:-----------:|:-----:|:---:|:-------:|:----:|------|
| `/api/admin/reconciliation/run` | POST | JWT | ✅ | ✅ | ❌ | ❌ | ❌ | Run reconciliation |
| `/api/admin/provider/{code}` | PUT | JWT | ✅ | ✅ | ✅ | ❌ | ❌ | Toggle provider (`?enabled=true\|false`) |

### Outbox & event processing

| Endpoint | Method | Auth | SUPER_ADMIN | ADMIN | OPS | SUPPORT | USER | Notes |
|----------|--------|------|:-----------:|:-----:|:---:|:-------:|:----:|------|
| `/api/admin/outbox` | GET | JWT | ✅ | ✅ | ✅ | ❌ | ❌ | List pending events |
| `/api/admin/outbox/{id}/process` | POST | JWT | ✅ | ✅ | ✅ | ❌ | ❌ | Process single event |

### Disputes

| Endpoint | Method | Auth | SUPER_ADMIN | ADMIN | OPS | SUPPORT | USER | Notes |
|----------|--------|------|:-----------:|:-----:|:---:|:-------:|:----:|------|
| `/api/admin/disputes` | GET | JWT | ✅ | ✅ | ✅ | ❌ | ❌ | List disputes |
| `/api/admin/disputes/{id}/resolve` | POST | JWT | ✅ | ✅ | ✅ | ❌ | ❌ | Resolve dispute with outcome |

### KYC documents (admin)

| Endpoint | Method | Auth | SUPER_ADMIN | ADMIN | OPS | SUPPORT | USER | Notes |
|----------|--------|------|:-----------:|:-----:|:---:|:-------:|:----:|------|
| `/api/admin/documents` | GET | JWT | ✅ | ✅ | ❌ | ❌ | ❌ | List documents |
| `/api/admin/users/{userId}/documents` | GET | JWT | ✅ | ✅ | ❌ | ❌ | ❌ | List user's documents |
| `/api/admin/documents/{id}/view` | GET | JWT | ✅ | ✅ | ❌ | ❌ | ❌ | Presigned view URL (audited) |
| `/api/admin/documents/{id}/approve` | POST | JWT | ✅ | ✅ | ❌ | ❌ | ❌ | Approve document |
| `/api/admin/documents/{id}/reject` | POST | JWT | ✅ | ✅ | ❌ | ❌ | ❌ | Reject document |

---

## Key notes for implementation

1. **Admin JWT** must include: `adminId`, `adminType`, `session.ip`, `session.device`.
2. **RBAC middleware** should check both **role** and **resource ownership** where applicable (e.g. OPS retry only for transactions assigned to their ops queue/team).
3. **Financial actions** (refund, retry, cancel) must write to **ledger + audit log**.
4. **MFA** required for SUPER_ADMIN / ADMIN / OPS for any action modifying money or users.
5. **SUPPORT** can never modify funds or user state; read-only only.

---

## Frontend RBAC UI rules

- **USER**: Show only user menu (send, recipients, profile, notifications, logout). Hide all `/api/admin/*` links.
- **SUPPORT**: Admin dashboard **read-only**: users list, transactions list, audit. Hide: disputes, outbox, freeze, enable, refund, cancel, retry, reconciliation, provider toggle, dispute resolve, KYC documents, admins.
- **OPS**: Same as SUPPORT plus: freeze/enable user, retry payout, outbox (list + process), provider toggle, disputes (list + resolve). Hide: refund, cancel, reconciliation, KYC documents, admins.
- **ADMIN**: Full admin: all of the above plus refund, cancel, reconciliation, KYC documents. Hide: admins (admin management).
- **SUPER_ADMIN**: Show everything (including Admins).

Use `adminType` from the admin JWT (or from `/api/admin/auth/login` response) to decide which buttons and routes to show.
