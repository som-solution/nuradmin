# How the NurPay Project Works – App Users & Web Admins

This document gives a **full picture** of how the system works for **customers (app users)** and **staff (web app admins)**. It does not replace the API docs but ties everything together.

---

## 1. Two Separate Applications – Never Mixed

The backend serves **two different clients** with **separate login and tokens**. They must stay separate.

| | **Customer (User) App** | **Admin Web App** |
|--|-------------------------|--------------------|
| **Platform** | Flutter mobile app | Web (browser) |
| **Who uses it** | Customers sending money UK → East Africa | Staff: SUPER_ADMIN, ADMIN, OPS, SUPPORT |
| **How they get in** | **Register** then **Login** | **Login only** (no registration; admins are pre-created) |
| **Login endpoint** | **POST /api/auth/login** (after **POST /api/auth/register**) | **POST /api/admin/auth/login** |
| **Token** | **User JWT** | **Admin JWT** |
| **What the token is used for** | All `/api/auth/*`, `/api/recipients`, `/api/send/*`, `/api/transactions`, `/api/compliance`, `/api/notifications` | All **/api/admin/** endpoints only |

**Rules:**

- The **Flutter app** must **only** use `/api/auth/register` and `/api/auth/login`. Never call admin login or send admin credentials.
- The **admin web app** must **only** use `/api/admin/auth/login`. Never use user register or user login.
- **Never** send a user token to admin endpoints or an admin token to user endpoints; the backend returns 403.

---

## 2. How the Customer (User) App Works

### 2.1 Getting started

1. **Register** – **POST /api/auth/register**  
   - Body: `firstName`, `lastName`, `email`, `password`, `country` (United Kingdom), `phone` (UK number).  
   - Response: `accessToken`, `refreshToken`, `userId`, `userNumber` (8-digit ID), etc.  
   - User is created in the `users` table; no admin table is involved.

2. **Login** – **POST /api/auth/login**  
   - Body: `email`, `password`.  
   - Response: same shape as register (tokens, user info).  
   - If MFA is enabled: 202 with `requiresMfa`, `tempToken`; user then calls **POST /api/auth/mfa/verify** with `tempToken` and `code` to complete login.

3. **All later requests** use header: `Authorization: Bearer <accessToken>` (the **user** token).  
   - On 401, the app should call **POST /api/auth/refresh** with `refreshToken`, then retry with the new `accessToken`.

### 2.2 What the user can do (high level)

- **Profile:** **GET /api/auth/me** (see own details). **POST /api/auth/change-password**, **POST /api/auth/logout**, **POST /api/auth/delete-account**.
- **Recipients:** Add (**POST /api/recipients**), list (**GET /api/recipients**), delete (**DELETE /api/recipients/{id}**). Used for sending money to East Africa.
- **Send money (UK → East Africa only):**  
  - **POST /api/send/quote** – get exchange rate, fee, amount recipient gets (no auth required).  
  - **POST /api/send/lookup-recipient** – enter recipient mobile (e.g. Kenya); backend returns whether valid and recipient name.  
  - **POST /api/send/create-payment** – create Stripe Payment Intent (enforces KYC and send limits). App uses returned `clientSecret` with Stripe SDK to collect card/Google Pay.  
  - After the user pays, Stripe sends a webhook to the backend; backend creates the transaction and records it in the ledger.  
  - User checks status: **GET /api/transactions/{id}/status** or **GET /api/transactions/{id}/receipt**.
- **Transactions:** List (**GET /api/transactions**), status, receipt. There is **no wallet or balance**; every send is a card payment via Stripe.
- **Compliance / KYC:**  
  - **PUT /api/compliance/profile** – e.g. postcode.  
  - **POST /api/compliance/documents** – upload ID (passport/driving licence) or source-of-funds (payslip/bank statement).  
  - **GET /api/compliance/documents** – see `kycTier` (NONE, ID_VERIFIED, SOF_VERIFIED) and document status (PENDING, APPROVED, REJECTED).  
  - Send limits depend on tier: NONE = £0; ID_VERIFIED = higher limits; SOF_VERIFIED = highest. Admins approve/reject documents in the **admin web app**.
- **Notifications:** Register device (**POST /api/notifications/device**), list (**GET /api/notifications**), mark read (**PUT /api/notifications/{id}/read**).

### 2.3 Send limits (enforced in create-payment)

- **Count:** 5 sends per day, 24 per month (hard cap).  
- **Amount by KYC tier:**  
  - NONE: £0 (must complete KYC first).  
  - ID_VERIFIED: single and monthly limits (e.g. £300 per send, £2,000/month).  
  - SOF_VERIFIED: higher limits (e.g. £500 per send, £10,000/month).  
- Possible error codes: `KYC_REQUIRED`, `ACCOUNT_FROZEN`, `DAILY_LIMIT_REACHED`, `MONTHLY_LIMIT_REACHED`, `AMOUNT_LIMIT_EXCEEDED`, `MONTHLY_AMOUNT_LIMIT`.

### 2.4 Flow summary (user app)

1. Register/Login → get user JWT.  
2. Optionally get quote (send/quote).  
3. Add/lookup recipient (send/lookup-recipient).  
4. Create payment (send/create-payment) → get Stripe `clientSecret` → user pays in app.  
5. Backend receives Stripe webhook → creates transaction, updates ledger.  
6. User sees history and receipt via transactions endpoints.

---

## 3. How the Admin Web App Works

### 3.1 Getting in (no registration)

- Admins **do not register**. They are created by the backend (seed) or by a SUPER_ADMIN.
- **Login:** **POST /api/admin/auth/login** with `email` and `password`.  
  - Credentials are in the `admins` table (not `users`).  
  - Response: `accessToken`, `refreshToken`, `adminId`, `adminType` (SUPER_ADMIN, ADMIN, OPS, SUPPORT).
- **Default (non-production):** If the `admins` table is empty and profile is not `production`, two SUPER_ADMINs are seeded:  
  - `admin@nurpay.local` / `admin123`  
  - `superadmin2@nurpay.local` / `admin123`  
  Use these only for **POST /api/admin/auth/login** in the admin web app.
- **Refresh:** **POST /api/admin/auth/refresh** with `refreshToken` to get a new admin token.
- **All admin endpoints** require header: `Authorization: Bearer <adminAccessToken>`.

### 3.2 Roles (RBAC)

| Role | Capabilities |
|------|--------------|
| **SUPER_ADMIN** | Everything; **admin management** (create/list/update admins). |
| **ADMIN** | Users, transactions (list, refund, cancel, retry), audit, reconciliation, provider, outbox, disputes, **KYC documents** (list, view, approve, reject). No admin management. |
| **OPS** | Users (list, freeze, enable), transactions (list, retry), audit, provider, outbox, disputes. No refund/cancel, no reconciliation, no KYC documents, no admin management. |
| **SUPPORT** | **Read-only:** users list, transactions list, audit. No freeze/enable, no refund/cancel/retry, no reconciliation, no provider/outbox/disputes, no KYC, no admin management. |

Sensitive actions (refund, cancel, freeze, document view/approve/reject, admin create/update) are written to the audit log with adminId, adminType, reason, IP.

### 3.3 What admins can do (by area)

- **User management:**  
  - List users: **GET /api/admin/users**.  
  - Freeze: **PUT /api/admin/users/{userId}/freeze**.  
  - Enable: **PUT /api/admin/users/{userId}/enable**.
- **Admin management (SUPER_ADMIN only):**  
  - Create admin: **POST /api/admin/admins** (email, password, adminType).  
  - List: **GET /api/admin/admins**.  
  - Update email/password: **PUT /api/admin/admins/{adminId}** (e.g. change default seeded accounts).
- **Transactions:**  
  - List: **GET /api/admin/transactions** (optional `status` filter).  
  - Refund: **POST /api/admin/transactions/{id}/refund** (SUPER_ADMIN, ADMIN).  
  - Retry payout: **POST /api/admin/transactions/{id}/retry** (SUPER_ADMIN, ADMIN, OPS).  
  - Cancel: **POST /api/admin/transactions/{id}/cancel** (SUPER_ADMIN, ADMIN).
- **Audit:** **GET /api/admin/audit**, **GET /api/admin/audit/entity?entityType=...&entityId=...**.
- **Reconciliation:** **POST /api/admin/reconciliation/run** (SUPER_ADMIN, ADMIN) – checks ledger balances per account.
- **Provider:** **PUT /api/admin/provider/{code}?enabled=true|false** (SUPER_ADMIN, ADMIN, OPS).
- **Outbox:** **GET /api/admin/outbox**, **POST /api/admin/outbox/{id}/process** (for pending events).
- **Disputes:** **GET /api/admin/disputes**, **POST /api/admin/disputes/{id}/resolve?resolution=...** (SUPER_ADMIN, ADMIN, OPS).
- **KYC documents (SUPER_ADMIN, ADMIN only):**  
  - List: **GET /api/admin/documents?status=PENDING** (e.g. review queue).  
  - Per user: **GET /api/admin/users/{userId}/documents**.  
  - View: **GET /api/admin/documents/{id}/view** – returns short-lived presigned URL (audit logged).  
  - Approve: **POST /api/admin/documents/{id}/approve** – sets user to ID_VERIFIED or SOF_VERIFIED depending on document type.  
  - Reject: **POST /api/admin/documents/{id}/reject?reason=...** – user sees reason in app.

### 3.4 Flow summary (admin web app)

1. Login with admin email/password → **POST /api/admin/auth/login** → get admin JWT.  
2. Use `adminType` to show/hide actions in the UI (see RBAC table above).  
3. All requests use `Authorization: Bearer <adminAccessToken>`.  
4. Perform operations (users, transactions, audit, KYC review, reconciliation, etc.) via the endpoints in [README-ADMIN-API.md](README-ADMIN-API.md).

---

## 4. Backend Behaviour Relevant to Both

- **Ledger:** Transactions are ledger-first; when Stripe reports payment (webhook), the backend records entries (e.g. escrow, fee pool) and updates transaction status.  
- **Stripe:** User pays via Stripe (card/Google Pay); **POST /api/webhooks/stripe** receives `payment_intent.succeeded` and creates/updates the transaction and ledger.  
- **KYC documents:** Stored in AWS S3 (if configured); metadata in `user_documents`. Approving ID doc raises user to ID_VERIFIED; approving SOF doc raises to SOF_VERIFIED.  
- **Rate limiting:** Redis-backed; login attempts limited per email.  
- **Audit:** Sensitive admin actions and important events are written to `audit_log` with checksum for tamper detection.  
- **Document retention:** Optional 5-year retention job for old documents (configurable, off by default).

---

## 5. Quick Reference

- **User app API details:** [README-FRONTEND-API.md](README-FRONTEND-API.md) – base URL, auth, all user endpoints and request/response shapes.  
- **Admin app API details:** [README-ADMIN-API.md](README-ADMIN-API.md) – all admin endpoints, RBAC, request/response shapes.  
- **UK → East Africa send flow:** [UK-TO-EAST-AFRICA-FLOW.md](UK-TO-EAST-AFRICA-FLOW.md) – step-by-step and API for quote, lookup, create-payment, webhook.  
- **RBAC and UI mapping:** [RBAC-ENDPOINT-MAPPING.md](RBAC-ENDPOINT-MAPPING.md) – which role can call which admin endpoint.  
- **Deployment:** [GO-LIVE.md](GO-LIVE.md) – production checklist.

---

## 6. One-Page Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NURPAY BACKEND (Spring Boot)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  POST /api/auth/register    POST /api/auth/login     → USER JWT              │
│  POST /api/auth/refresh     GET /api/auth/me         → used for:             │
│  .../recipients, .../send/*, .../transactions, .../compliance, .../notif.    │
├─────────────────────────────────────────────────────────────────────────────┤
│  POST /api/admin/auth/login  POST /api/admin/auth/refresh  → ADMIN JWT       │
│  → used ONLY for /api/admin/*  (users, transactions, audit, KYC, etc.)       │
├─────────────────────────────────────────────────────────────────────────────┤
│  POST /api/webhooks/stripe  (Stripe → payment_intent.succeeded →            │
│    create transaction, ledger entries, update status)                        │
└─────────────────────────────────────────────────────────────────────────────┘
         ▲                                    ▲
         │ User JWT                           │ Admin JWT
         │                                    │
┌────────┴────────┐                 ┌────────┴────────┐
│  Flutter app    │                 │  Admin web app  │
│  (customers)    │                 │  (staff)        │
│  Register →     │                 │  Login only →   │
│  Login → Send   │                 │  Users, Tx,     │
│  money, KYC,    │                 │  Audit, KYC    │
│  recipients     │                 │  review, etc.   │
└─────────────────┘                 └─────────────────┘
```

This document gives the full picture of how the project works for **app users** and **web app admins**. For exact request/response formats and error codes, use the Frontend and Admin API docs above.
