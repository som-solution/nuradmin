# NurPay – Full Frontend Guide (Admin Web App)

This document is the **single reference** for building the **admin web application** (browser) used by staff. It includes: **what the backend provides**, **what changed** to follow the backend, **RBAC**, and **every admin endpoint** with request/response shapes.

**Base path:** `/api/admin/**`  
**Authentication:** Admin JWT only. User tokens are not accepted for admin endpoints.

---

## Backend status and what changed (follow this)

The backend is **finished** for the admin app. Below is what you must follow.

| Area | Backend behaviour | What the frontend must do |
|------|-------------------|---------------------------|
| **Login** | **POST /api/admin/auth/login** only. No registration. Seed admins (non-production): `admin@nurpay.local`, `superadmin2@nurpay.local` / `admin123`. | Use **admin** JWT for all `/api/admin/**` requests. Never call user login. Show/hide actions by **adminType** (see RBAC). |
| **Transactions** | List supports optional **status** filter. Each transaction may include **receiveAmount**, **receiveCurrency** (e.g. KES), **failureReason**, **b2cConversationId** (for M-Pesa B2C callbacks). Payout is **triggered automatically** after Stripe webhook (stub or Safaricom). | List transactions; filter by status (e.g. `PAYOUT_FAILED` for retry queue). **Retry payout** (SUPER_ADMIN, ADMIN, OPS): **POST /api/admin/transactions/{id}/retry**. Refund/Cancel: SUPER_ADMIN, ADMIN only. |
| **Transaction statuses** | `PAYMENT_RECEIVED`, `PAYOUT_INITIATED`, `PAYOUT_SUCCESS`, `PAYOUT_FAILED`, `REFUNDED`, `CANCELLED`, etc. | Use for filters and labels. For `PAYOUT_FAILED`, show retry button (if role allows). |
| **Users** | List, freeze, enable. Freeze/enable require SUPER_ADMIN, ADMIN, or OPS. | List users; show freeze/enable actions per RBAC. |
| **KYC documents** | SUPER_ADMIN and ADMIN only: list, view (presigned URL), approve, reject. View is audit-logged. | Review queue: **GET /api/admin/documents?status=PENDING**. View document → open presigned URL. Approve/Reject with optional reason. |
| **Audit** | All sensitive actions (refund, cancel, document view/approve/reject, admin update) are logged. | **GET /api/admin/audit** and **GET /api/admin/audit/entity?entityType=...&entityId=...** for traceability. |
| **Provider** | **PUT /api/admin/provider/{providerCode}?enabled=true|false** – toggle payout provider (e.g. Safaricom). SUPER_ADMIN, ADMIN, OPS. | Optional: settings page to enable/disable provider. |

**Other docs:** [RBAC-ENDPOINT-MAPPING.md](RBAC-ENDPOINT-MAPPING.md) (which role can call which endpoint), [HOW-NURPAY-WORKS.md](HOW-NURPAY-WORKS.md) (overview).

---

## Who uses this API – admin web app only

This API is for the **admin web application** (browser), used by **staff only** (SUPER_ADMIN, ADMIN, OPS, SUPPORT). It is **not** for the customer (user) app.

| | Admin web app | User (customer) app |
|--|----------------|---------------------|
| **Platform** | Web (browser) | Flutter (mobile) |
| **Users** | Staff (admins) | Customers (send money) |
| **Login** | **POST /api/admin/auth/login** | POST /api/auth/login (see [README-FRONTEND-GUIDE-USER-APP.md](README-FRONTEND-GUIDE-USER-APP.md)) |
| **Registration** | **None** – admins are created by the backend (seed) or by SUPER_ADMIN | Users register via POST /api/auth/register |
| **Token** | Admin JWT → use only for `/api/admin/**` | User JWT → use only for `/api/auth/*`, `/api/recipients`, `/api/send/*`, etc. |

**Do not mix:** The admin web app must never call user login (`/api/auth/login`) or user register. The Flutter app must never call admin login (`/api/admin/auth/login`) or any `/api/admin/*` endpoint. Admin credentials (e.g. `admin@nurpay.local` / `admin123`) exist only in the `admins` table and work only with **POST /api/admin/auth/login**.

### Who can log in to the admin web app?

- **Pre-created admins:** When the app starts (non-production, empty `admins` table), two SUPER_ADMINs are seeded: `admin@nurpay.local` and `superadmin2@nurpay.local` (password: `admin123`). Use these to log in at **POST /api/admin/auth/login**.
- **No self-registration:** There is no "register as admin" in the API. New admins are created by SUPER_ADMIN via **POST /api/admin/admins** (see [Admin management](#admin-management-super_admin-only)).
- **Change password/email:** After first login, SUPER_ADMIN can update any admin's email and password via **PUT /api/admin/admins/{adminId}**.

---

## Base URL & headers

- **Local:** `http://localhost:8080`
- **Staging/Production:** Your deployment URL (e.g. `https://api.nurpay.com`).
- **Content-Type:** `application/json` for all request bodies.
- **Authorization:** Send the **admin** JWT:
  ```http
  Authorization: Bearer <adminAccessToken>
  ```
  Use the `accessToken` from **POST /api/admin/auth/login**. Do **not** use user tokens here.

---

## Admin auth (no token for login/refresh)

### Login

- **POST** `/api/admin/auth/login`
- **Auth:** None.
- **Body:**
  ```json
  {
    "email": "admin@example.com",
    "password": "string"
  }
  ```
- **Success (200):**
  ```json
  {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "adminId": "uuid",
    "adminType": "SUPER_ADMIN",
    "email": "admin@example.com"
  }
  ```
- **Errors:**
  - 401 `{ "error": "Invalid credentials" }`
  - 403 `{ "error": "Admin disabled" }`

**adminType** values: `SUPER_ADMIN`, `ADMIN`, `OPS`, `SUPPORT`. Use this in the UI to show/hide actions (see RBAC below).

### Refresh token

- **POST** `/api/admin/auth/refresh`
- **Auth:** None (use refresh token in body).
- **Body:** `{ "refreshToken": "string" }`
- **Success (200):** Same shape as login (new `accessToken`, `refreshToken`, `adminId`, `adminType`).
- **Errors:** 400 `{ "error": "refreshToken required" }`, 401 `{ "error": "Invalid token" }` or `{ "error": "Admin not found or disabled" }`.

---

## RBAC (who can call what)

| Role         | Can do |
|-------------|--------|
| **SUPER_ADMIN** | All admin endpoints; **admin management** (list admins, update any admin's email/password). |
| **ADMIN**       | All below; plus refund, cancel, reconciliation; **KYC documents** (list, view, approve, reject). **No** admin management. |
| **OPS**         | Users list; freeze/enable user; transactions list; retry payout; audit; provider toggle; outbox (list + process); disputes (list + resolve). **No** refund, cancel, reconciliation, KYC documents, admin management. |
| **SUPPORT**     | **Read-only:** users list, transactions list, audit. **No** freeze/enable, refund, cancel, retry, reconciliation, provider, outbox, disputes, KYC documents, admin management. |

Sensitive actions (refund, cancel, reconciliation, **document view/approve/reject**, **admin update**) are audited with adminId, adminType, reason, IP.

---

## User management

### List users

- **GET** `/api/admin/users?page=0&size=20&sort=createdAt,desc`
- **Auth:** Admin JWT (any admin type).
- **Success (200):** Spring `Page<User>` (user entities; id, email, firstName, lastName, enabled, frozen, countryCode, userNumber, createdAt, etc.).

### Freeze user

- **PUT** `/api/admin/users/{userId}/freeze`
- **Query (optional):** `reason=string`
- **Auth:** SUPER_ADMIN, ADMIN, OPS.
- **Success (200):** `{ "userId": "uuid", "frozen": true }`
- **Errors:** 404 user not found.

### Enable user

- **PUT** `/api/admin/users/{userId}/enable?enable=true`
- **Query:** `enable` (boolean, default true), `reason` (optional).
- **Auth:** SUPER_ADMIN, ADMIN, OPS.
- **Success (200):** `{ "userId": "uuid", "enabled": true }`

---

## Admin management (SUPER_ADMIN only)

Only **SUPER_ADMIN** can list admins and update an admin's email or password. Use this to change the default seeded accounts (e.g. `admin@nurpay.local`, `superadmin2@nurpay.local`) after first login.

### Create admin

- **POST** `/api/admin/admins`
- **Auth:** SUPER_ADMIN only.
- **Body:**
  ```json
  {
    "email": "ops@nurpay.local",
    "password": "securePassword123",
    "adminType": "ADMIN"
  }
  ```
  **adminType** must be one of: `SUPER_ADMIN`, `ADMIN`, `OPS`, `SUPPORT`. Use `ADMIN`, `OPS`, or `SUPPORT` to create other roles.
- **Success (201):** `{ "adminId": "uuid", "email": "ops@nurpay.local", "adminType": "ADMIN", "enabled": true }`
- **Errors:** 409 `EMAIL_TAKEN` if email already in use; 400 if validation fails (e.g. password < 8 chars).
- **Audit:** Action `ADMIN_CREATED` is logged.

### List admins

- **GET** `/api/admin/admins?page=0&size=20&sort=createdAt,desc`
- **Auth:** SUPER_ADMIN only.
- **Success (200):** Spring `Page<Admin>` (id, email, adminType, mfaEnabled, enabled, createdAt, updatedAt). Password hash is never returned.

### Update admin (email and/or password)

- **PUT** `/api/admin/admins/{adminId}`
- **Auth:** SUPER_ADMIN only.
- **Body:** Both fields optional; send only what you want to change.
  ```json
  {
    "email": "newemail@nurpay.local",
    "password": "newSecurePassword123"
  }
  ```
  - **email:** Must be valid and unique (not used by another admin). Max 255 chars.
  - **password:** Min 8, max 128 chars. Stored as BCrypt hash.
- **Success (200):**
  ```json
  {
    "adminId": "uuid",
    "email": "newemail@nurpay.local",
    "adminType": "SUPER_ADMIN",
    "enabled": true
  }
  ```
- **Errors:** 404 admin not found; 409 `EMAIL_TAKEN` if email is already in use by another admin; 400 if validation fails (e.g. password too short).
- **Audit:** Action `ADMIN_UPDATED` is logged with actor adminId and target adminId.

---

## Transactions

### List transactions

- **GET** `/api/admin/transactions?page=0&size=20&status=PAYMENT_RECEIVED`
- **Query:** `status` (optional) – one of: `CREATED`, `PAYMENT_PENDING`, `PAYMENT_RECEIVED`, `PAYOUT_INITIATED`, `PAYOUT_SUCCESS`, `FINALIZED`, `PAYMENT_FAILED`, `PAYOUT_FAILED`, `REFUNDED`, `CANCELLED`, `COMPENSATION`.
- **Auth:** Any admin.
- **Success (200):** Spring `Page<Transaction>`. Each transaction includes: id, userId, recipientId, amount, fee, currency, status, idempotencyKey, payoutProviderRef, **receiveAmount**, **receiveCurrency**, **failureReason**, **b2cConversationId** (for M-Pesa B2C), createdAt, updatedAt.

### Refund transaction

- **POST** `/api/admin/transactions/{transactionId}/refund`
- **Query (optional):** `reason=string`
- **Auth:** SUPER_ADMIN, ADMIN only.
- **Success (200):** `{ "transactionId": "uuid", "status": "REFUNDED" }`
- **Errors:** 404, or 400 if transaction not in a refundable state.

### Retry payout

- **POST** `/api/admin/transactions/{transactionId}/retry`
- **Auth:** SUPER_ADMIN, ADMIN, OPS.
- **Success (200):** `{ "transactionId": "uuid", "status": "string" }`

### Cancel transaction

- **POST** `/api/admin/transactions/{transactionId}/cancel`
- **Query (optional):** `reason=string`
- **Auth:** SUPER_ADMIN, ADMIN only.
- **Success (200):** `{ "transactionId": "uuid", "status": "CANCELLED" }`

---

## Audit logs

### List audit logs

- **GET** `/api/admin/audit?page=0&size=20&sort=createdAt,desc`
- **Auth:** Any admin.
- **Success (200):** Spring `Page<AuditLog>` (id, eventType, entityType, entityId, actorId, actorEmail, adminType, reason, ipAddress, payloadJson, createdAt).

### Audit by entity

- **GET** `/api/admin/audit/entity?entityType=User&entityId=uuid&page=0&size=20`
- **Query:** `entityType` (required), `entityId` (required), plus page/sort.
- **Auth:** Any admin.
- **Success (200):** List of `AuditLog` for that entity.

---

## Reconciliation & provider

### Run reconciliation

- **POST** `/api/admin/reconciliation/run`
- **Auth:** SUPER_ADMIN, ADMIN only.
- **Success (200):** `{ "message": "string", ... }` (implementation-specific).

### Set provider enabled

- **PUT** `/api/admin/provider/{providerCode}?enabled=true`
- **Query:** `enabled` (boolean, required), `reason` (optional).
- **Auth:** SUPER_ADMIN, ADMIN, OPS.
- **Success (200):** `{ "providerCode": "string", "enabled": true }`

---

## Outbox (event processing)

### List pending outbox

- **GET** `/api/admin/outbox?page=0&size=20`
- **Auth:** SUPER_ADMIN, ADMIN, OPS.
- **Success (200):** List of `OutboxEvent` (pending events to be processed).

### Process outbox event

- **POST** `/api/admin/outbox/{eventId}/process`
- **Auth:** SUPER_ADMIN, ADMIN, OPS.
- **Success (200):** `{ "message": "Processed" }`
- **Errors:** 404 if event not found.

---

## Disputes

### List disputes

- **GET** `/api/admin/disputes?page=0&size=20&status=OPEN`
- **Query:** `status` (optional) – one of: `OPEN`, `IN_REVIEW`, `RESOLVED_REFUND`, `RESOLVED_NO_REFUND`, `CLOSED`.
- **Auth:** SUPER_ADMIN, ADMIN, OPS (SUPPORT cannot list disputes).
- **Success (200):** Spring `Page<Dispute>`.

### Resolve dispute

- **POST** `/api/admin/disputes/{disputeId}/resolve?resolution=RESOLVED_REFUND`
- **Query:** `resolution` (required) – one of the `DisputeStatus` values; `notes` (optional).
- **Auth:** SUPER_ADMIN, ADMIN, OPS.
- **Success (200):** `{ "disputeId": "uuid", "status": "RESOLVED_REFUND" }`

---

## KYC documents (SUPER_ADMIN, ADMIN only)

User-uploaded KYC documents (passport, driving licence, payslip, bank statement) are stored in S3 and reviewed manually. Only **SUPER_ADMIN** and **ADMIN** can list, view, approve, or reject. Viewing a document generates a short-lived presigned URL and is audit-logged.

### List documents

- **GET** `/api/admin/documents?status=PENDING&page=0&size=20`
- **Query:** `status` (optional) – `PENDING`, `APPROVED`, or `REJECTED`. Default listing is by status (e.g. use `status=PENDING` for review queue). Pagination: `page`, `size`, `sort`.
- **Auth:** SUPER_ADMIN, ADMIN.
- **Success (200):** Spring `Page<UserDocument>` (id, userId, documentType, fileName, status, uploadedAt, reviewedAt, rejectionReason; s3Bucket/s3Key are not returned).

### List documents for a user

- **GET** `/api/admin/users/{userId}/documents?page=0&size=20`
- **Auth:** SUPER_ADMIN, ADMIN.
- **Success (200):** Spring `Page<UserDocument>` for that user (same fields as above).

### View document (presigned URL)

- **GET** `/api/admin/documents/{id}/view`
- **Auth:** SUPER_ADMIN, ADMIN.
- **Success (200):**
  ```json
  {
    "viewUrl": "https://...",
    "expiresMinutes": 15
  }
  ```
  Open `viewUrl` in a browser or iframe to display the file. The URL expires after 15 minutes. **Audit:** action `DOCUMENT_VIEWED` is logged with adminId, document id, and IP.

### Approve document

- **POST** `/api/admin/documents/{id}/approve`
- **Auth:** SUPER_ADMIN, ADMIN.
- **Success (200):** `{ "id": "uuid", "status": "APPROVED" }`
- **Side effects:** If the document is an ID type (PASSPORT or DRIVING_LICENCE) and the user's tier is NONE, user is set to **ID_VERIFIED**. If the document is a source-of-funds type (PAYSLIP or BANK_STATEMENT), user is set to **SOF_VERIFIED** (higher send limits).
- **Errors:** 400 if document is not PENDING (already reviewed).

### Reject document

- **POST** `/api/admin/documents/{id}/reject?reason=Optional+reason`
- **Query:** `reason` (optional, max 512 chars) – shown to the user as rejection feedback.
- **Auth:** SUPER_ADMIN, ADMIN.
- **Success (200):** `{ "id": "uuid", "status": "REJECTED" }`
- **Errors:** 400 if document is not PENDING.

---

## Screens and flows to build (admin web app)

Use the APIs above to build these. Exact layout is up to you. **Show or hide actions based on adminType** (see RBAC).

| Screen / flow | Purpose | APIs and roles |
|---------------|---------|----------------|
| **Login** | Admin signs in | **POST /api/admin/auth/login** – body: `email`, `password`. Store `accessToken`, `refreshToken`, `adminType`. |
| **Dashboard** | Overview | **GET /api/admin/users?page=0&size=20**, **GET /api/admin/transactions?page=0&size=20** (optional filters). |
| **Users list** | List and manage users | **GET /api/admin/users**. **PUT .../freeze**, **PUT .../enable** (SUPER_ADMIN, ADMIN, OPS). |
| **Transactions list** | List and filter transactions | **GET /api/admin/transactions?status=...**. Show status, amount, receiveAmount/receiveCurrency, failureReason. **Retry:** **POST /api/admin/transactions/{id}/retry** (SUPER_ADMIN, ADMIN, OPS). **Refund:** **POST .../refund** (SUPER_ADMIN, ADMIN). **Cancel:** **POST .../cancel** (SUPER_ADMIN, ADMIN). |
| **Audit logs** | View audit trail | **GET /api/admin/audit**. **GET /api/admin/audit/entity?entityType=User&entityId=uuid** for one entity. |
| **KYC documents** | Review queue (SUPER_ADMIN, ADMIN) | **GET /api/admin/documents?status=PENDING**. **GET /api/admin/users/{userId}/documents**. **GET /api/admin/documents/{id}/view** (presigned URL). **POST .../approve**, **POST .../reject?reason=...**. |
| **Admins** (SUPER_ADMIN only) | Create/list/update admins | **POST /api/admin/admins**, **GET /api/admin/admins**, **PUT /api/admin/admins/{id}**. |
| **Reconciliation** | Run reconciliation (SUPER_ADMIN, ADMIN) | **POST /api/admin/reconciliation/run**. |
| **Provider** | Toggle payout provider (SUPER_ADMIN, ADMIN, OPS) | **PUT /api/admin/provider/{providerCode}?enabled=true\|false**. |
| **Outbox** | Pending events (SUPER_ADMIN, ADMIN, OPS) | **GET /api/admin/outbox**, **POST /api/admin/outbox/{eventId}/process**. |
| **Disputes** | List and resolve (SUPER_ADMIN, ADMIN, OPS) | **GET /api/admin/disputes**, **POST /api/admin/disputes/{id}/resolve?resolution=...**. |

---

## Error responses

Admin endpoints use the same error shape as the rest of the API where applicable:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable message",
  "errors": { "fieldName": "validation message" }
}
```

Auth endpoints may return simple `{ "error": "..." }`.  
HTTP status: 400, 401, 403, 404, 409, 429, 500.

---

## Quick reference: all admin endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|--------|-------------|
| POST | `/api/admin/auth/login` | — | Admin login |
| POST | `/api/admin/auth/refresh` | — | Refresh admin token |
| GET | `/api/admin/users` | Any admin | List users |
| PUT | `/api/admin/users/{userId}/freeze` | SUPER_ADMIN, ADMIN, OPS | Freeze user |
| PUT | `/api/admin/users/{userId}/enable` | SUPER_ADMIN, ADMIN, OPS | Enable user |
| POST | `/api/admin/admins` | SUPER_ADMIN only | Create admin (email, password, adminType) |
| GET | `/api/admin/admins` | SUPER_ADMIN only | List admins |
| PUT | `/api/admin/admins/{adminId}` | SUPER_ADMIN only | Update admin email/password |
| GET | `/api/admin/transactions` | Any admin | List transactions |
| POST | `/api/admin/transactions/{id}/refund` | SUPER_ADMIN, ADMIN | Refund |
| POST | `/api/admin/transactions/{id}/retry` | SUPER_ADMIN, ADMIN, OPS | Retry payout |
| POST | `/api/admin/transactions/{id}/cancel` | SUPER_ADMIN, ADMIN | Cancel |
| GET | `/api/admin/audit` | Any admin | List audit logs |
| GET | `/api/admin/audit/entity` | Any admin | Audit by entity |
| POST | `/api/admin/reconciliation/run` | SUPER_ADMIN, ADMIN | Run reconciliation |
| PUT | `/api/admin/provider/{code}` | SUPER_ADMIN, ADMIN, OPS | Toggle provider |
| GET | `/api/admin/outbox` | SUPER_ADMIN, ADMIN, OPS | List pending outbox |
| POST | `/api/admin/outbox/{eventId}/process` | SUPER_ADMIN, ADMIN, OPS | Process event |
| GET | `/api/admin/disputes` | SUPER_ADMIN, ADMIN, OPS | List disputes |
| POST | `/api/admin/disputes/{id}/resolve` | SUPER_ADMIN, ADMIN, OPS | Resolve dispute |
| GET | `/api/admin/documents` | SUPER_ADMIN, ADMIN | List documents (optional status filter) |
| GET | `/api/admin/users/{userId}/documents` | SUPER_ADMIN, ADMIN | List user's documents |
| GET | `/api/admin/documents/{id}/view` | SUPER_ADMIN, ADMIN | Get presigned view URL (audited) |
| POST | `/api/admin/documents/{id}/approve` | SUPER_ADMIN, ADMIN | Approve document |
| POST | `/api/admin/documents/{id}/reject` | SUPER_ADMIN, ADMIN | Reject document (optional reason) |

---

## Security notes

1. **Admin JWT** is separate from user JWT. Do not use user tokens for `/api/admin/**`.
2. **Sensitive actions** (refund, cancel, reconciliation, freeze, **document view/approve/reject**, **admin update**) are logged in the audit log with adminId, adminType, reason, and IP.
3. **SUPPORT** is read-only: users and transactions list, audit. No state or fund changes.
4. **CORS:** If the admin UI runs on a different origin, configure CORS for the admin base URL (e.g. in `application.yml` or a `WebMvcConfigurer`).

For full RBAC and frontend UI rules, see [RBAC-ENDPOINT-MAPPING.md](RBAC-ENDPOINT-MAPPING.md).
