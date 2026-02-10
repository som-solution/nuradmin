# Frontend flow checklist – User app & Admin app

Use this README to **check your frontend code** against the backend. It describes the main flows and what to verify for both the **user (customer) app** and the **admin web app**.

| Doc | Use for |
|-----|--------|
| **This doc** | Flow checklist: order of screens, API calls, and what to verify in your code |
| [README-FRONTEND-API.md](README-FRONTEND-API.md) | User app: full API reference (auth, send, transactions, compliance, notifications) |
| [README-FRONTEND-GUIDE-USER-APP.md](README-FRONTEND-GUIDE-USER-APP.md) | User app: full frontend guide (same + screens/flows) |
| [README-ADMIN-API.md](README-ADMIN-API.md) | Admin app: full API reference (auth, users, transactions, KYC, audit, RBAC) |
| [README-FRONTEND-GUIDE-ADMIN-APP.md](README-FRONTEND-GUIDE-ADMIN-APP.md) | Admin app: full frontend guide (same + screens/flows) |
| [UK-TO-EAST-AFRICA-FLOW.md](UK-TO-EAST-AFRICA-FLOW.md) | Backend send flow (quote → lookup → create-payment → webhook) |

---

## Quick reference: which app uses which API

| | User app (e.g. Flutter) | Admin web app |
|--|--------------------------|----------------|
| **Login** | `POST /api/auth/login` (after register) | `POST /api/admin/auth/login` (no register) |
| **Token** | User JWT → `/api/auth/*`, `/api/recipients`, `/api/send/*`, `/api/transactions`, `/api/compliance`, `/api/notifications` | Admin JWT → `/api/admin/*` only |
| **Base URL** | Same backend (e.g. `http://localhost:8080` or your API host) | Same backend |
| **Header** | `Authorization: Bearer <userAccessToken>` | `Authorization: Bearer <adminAccessToken>` |

**Do not mix:** User app must never call `/api/admin/*`. Admin app must never call user login or user endpoints.

---

# Part 1: User app (customer) – flow checklist

## 1.1 Auth flow

| Step | What to do in code | API | Check |
|------|--------------------|-----|--------|
| 1 | Register (UK only: country, UK phone) | `POST /api/auth/register` | Body: firstName, lastName, email, password, country, phone. Store `accessToken`, `refreshToken`, `userId`. |
| 2 | Login | `POST /api/auth/login` | Body: email, password. If 202: MFA required → `POST /api/auth/mfa/verify` with tempToken + code. |
| 3 | Use token on every protected request | All `/api/*` except auth, quote, calculate-fee, webhooks | Header: `Authorization: Bearer <accessToken>`. |
| 4 | Refresh when token expires | `POST /api/auth/refresh` | Body: `{ "refreshToken": "..." }`. Replace stored accessToken/refreshToken with new ones. |
| 5 | Get current user | `GET /api/auth/me` | Optional: show profile (userId, userNumber, email, frozen, etc.). |

**Code checks:**  
- Register/login use **user** endpoints only (not admin).  
- Token is sent as `Authorization: Bearer <token>` for all protected calls.  
- Handle 401 → redirect to login or refresh token.  
- Handle MFA 202 and verify step.

---

## 1.2 Send money flow (UK → East Africa)

This is the main flow. **Order matters.**

| Step | Screen / action | API | What to verify in code |
|------|----------------|-----|------------------------|
| 1 | User enters amount (GBP) and receive country (e.g. Kenya) | `POST /api/send/quote` | No auth. Body: sendAmount, sendCurrency, receiveCountry, receiveCurrency. Show: rate, fee, receiveAmount, totalPayAmount. |
| 2 | User enters recipient mobile number | `POST /api/send/lookup-recipient` | **Auth required.** Body: countryCode, mobileNumber. Use returned `recipientName` and `normalizedNumber` in create-payment. |
| 3 | User confirms and taps Pay | `POST /api/send/create-payment` | **Auth required.** Body: sendAmount, sendCurrency, receiveCountry, receiveCurrency, receiveAmount, feeAmount, totalPayAmount, recipientName, recipientPhone (**normalizedNumber**), **idempotencyKey** (e.g. new UUID per attempt). Store `paymentIntentId` if you need it for receipt polling. |
| 4 | Client confirms payment | Stripe SDK (clientSecret from create-payment) | Use `clientSecret` with Stripe.js / Flutter Stripe to confirm (card or Google Pay). Backend does **not** create the transaction here – Stripe webhook does. |
| 5 | After Stripe confirms success | Poll or navigate | Poll `GET /api/transactions?page=0&size=5` or `GET /api/transactions/{id}/status` (if you have transaction id). Or show "Processing" and let user open transaction list. |
| 6 | Show receipt | `GET /api/transactions/{transactionId}/receipt` | **Auth required.** Use transactionId from list or from your flow (e.g. after polling list by newest). Show: amount, fee, currency, status, recipientId, createdAt. |

**Code checks:**  
- **Idempotency:** One unique `idempotencyKey` per send attempt (e.g. UUID). Never reuse the same key for a second payment.  
- **Recipient:** Use `normalizedNumber` from lookup as `recipientPhone` in create-payment.  
- **No wallet:** Do not show a balance. Backend has no "wallet" endpoint for the user app.  
- **Errors from create-payment:** Handle `KYC_REQUIRED`, `DAILY_LIMIT_REACHED`, `MONTHLY_LIMIT_REACHED`, `AMOUNT_LIMIT_EXCEEDED`, `ACCOUNT_FROZEN` – show message and guide to KYC/compliance if needed.

---

## 1.3 Transaction list and receipt

| What | API | Check |
|------|-----|--------|
| List my transactions | `GET /api/transactions?page=0&size=10` | Auth. Response: Spring Page with content[].id, status, amount, fee, currency, recipientId, createdAt. |
| Status of one transaction | `GET /api/transactions/{id}/status` | Auth. User can only access own transactions (backend returns 403 otherwise). |
| Receipt | `GET /api/transactions/{id}/receipt` | Auth. Same as status plus recipientId. |

**Code checks:**  
- All three require **user** JWT.  
- Map status to labels: e.g. PAYMENT_RECEIVED → "Processing", PAYOUT_SUCCESS → "Sent", PAYOUT_FAILED → "Failed".  
- Optional: resolve recipient name via `GET /api/recipients` and match by recipientId.

---

## 1.4 Recipients (optional)

| What | API | Check |
|------|-----|--------|
| List saved recipients | `GET /api/recipients` | Auth. Use to pre-fill "Send to" (name, country); accountNumber is not returned. |
| Add recipient | `POST /api/recipients` | Auth. Body: name, accountNumber, bankCode, currency, country. |
| Delete | `DELETE /api/recipients/{recipientId}` | Auth. |

After a successful send, the backend **saves the recipient** automatically; list will include them.

---

## 1.5 Compliance / KYC

| What | API | Check |
|------|-----|--------|
| My documents and tier | `GET /api/compliance/documents` | Auth. Shows kycTier (NONE, ID_VERIFIED, SOF_VERIFIED) and list of documents with status. |
| Upload document | `POST /api/compliance/documents` | Auth. **multipart/form-data**: documentType (PASSPORT, DRIVING_LICENCE, PAYSLIP, BANK_STATEMENT), file. |
| Update profile (e.g. postcode) | `PUT /api/compliance/profile` | Auth. Body: postcode (optional). |

**Code checks:**  
- If create-payment returns `KYC_REQUIRED`, show message and link to document upload.  
- Use document status (PENDING, APPROVED, REJECTED) and kycTier for UI (e.g. "Verified", "Under review").

---

# Part 2: Admin web app – flow checklist

## 2.1 Admin auth

| Step | What to do in code | API | Check |
|------|--------------------|-----|--------|
| 1 | Login (no registration) | `POST /api/admin/auth/login` | Body: email, password. Store `accessToken`, `refreshToken`, `adminId`, **adminType**. |
| 2 | Use admin token for all admin requests | All `GET/POST/PUT ... /api/admin/*` | Header: `Authorization: Bearer <adminAccessToken>`. |
| 3 | Refresh | `POST /api/admin/auth/refresh` | Body: refreshToken. Replace stored tokens. |

**Code checks:**  
- Never call `POST /api/auth/login` or register in the admin app.  
- Seed logins (non-production): e.g. `admin@nurpay.local` / `superadmin2@nurpay.local` with password `admin123`.  
- Use **adminType** (SUPER_ADMIN, ADMIN, OPS, SUPPORT) to show/hide actions (see RBAC below).

---

## 2.2 RBAC – who can do what

| Role | Can do |
|------|--------|
| **SUPER_ADMIN** | Everything; **admin management** (list/update admins). |
| **ADMIN** | All below; **refund**, **cancel**, **reconciliation**; **KYC documents** (list, view, approve, reject). No admin management. |
| **OPS** | Users list; **freeze/enable** user; transactions list; **retry payout**; audit; provider; outbox; disputes. No refund, cancel, reconciliation, KYC, admin management. |
| **SUPPORT** | **Read-only:** users list, transactions list, audit. No other actions. |

**Code checks:**  
- Hide "Refund" / "Cancel" unless adminType is SUPER_ADMIN or ADMIN.  
- Hide "Retry payout" unless SUPER_ADMIN, ADMIN, or OPS.  
- Hide "Freeze/Enable user" unless SUPER_ADMIN, ADMIN, or OPS.  
- Hide "Documents", "Approve/Reject", "View document" unless SUPER_ADMIN or ADMIN.  
- Hide "Admins" (list/create/update) unless SUPER_ADMIN.

---

## 2.3 Admin – Transactions

| What | API | Roles | Check |
|------|-----|--------|--------|
| List transactions | `GET /api/admin/transactions?page=0&size=20` | Any admin | Optional filter: `?status=PAYOUT_FAILED` for retry queue. |
| Refund | `POST /api/admin/transactions/{id}/refund?reason=...` | SUPER_ADMIN, ADMIN | Only for transactions in refundable state. |
| Retry payout | `POST /api/admin/transactions/{id}/retry` | SUPER_ADMIN, ADMIN, OPS | For PAYOUT_FAILED (and optionally PAYMENT_RECEIVED). |
| Cancel | `POST /api/admin/transactions/{id}/cancel?reason=...` | SUPER_ADMIN, ADMIN | Before payout completed. |

**Code checks:**  
- List returns full transaction (id, userId, recipientId, amount, fee, currency, status, receiveAmount, receiveCurrency, failureReason, b2cConversationId, etc.).  
- Show "Retry" only for PAYOUT_FAILED and only if role is OPS or above.  
- Show "Refund" / "Cancel" only if role is ADMIN or SUPER_ADMIN.

---

## 2.4 Admin – Users

| What | API | Roles | Check |
|------|-----|--------|--------|
| List users | `GET /api/admin/users?page=0&size=20` | Any admin | Show enabled, frozen, email, userNumber, etc. |
| Freeze user | `PUT /api/admin/users/{userId}/freeze?reason=...` | SUPER_ADMIN, ADMIN, OPS | |
| Enable user | `PUT /api/admin/users/{userId}/enable?enable=true` | SUPER_ADMIN, ADMIN, OPS | |

---

## 2.5 Admin – KYC documents (SUPER_ADMIN, ADMIN only)

| What | API | Check |
|------|-----|--------|
| Review queue | `GET /api/admin/documents?status=PENDING` | List PENDING documents. |
| View document | `GET /api/admin/documents/{id}/view` | Returns `viewUrl` (presigned); open in new tab. Audit logged. |
| Approve | `POST /api/admin/documents/{id}/approve` | |
| Reject | `POST /api/admin/documents/{id}/reject?reason=...` | |

**Code checks:**  
- Do not show documents section to OPS or SUPPORT.  
- View document returns a URL; your app does not need to upload or store the file.

---

## 2.6 Admin – Audit, provider, outbox, disputes

| What | API | Roles |
|------|-----|--------|
| Audit logs | `GET /api/admin/audit?page=0&size=20` | Any admin |
| Audit by entity | `GET /api/admin/audit/entity?entityType=User&entityId=uuid` | Any admin |
| Set provider on/off | `PUT /api/admin/provider/{code}?enabled=true` | SUPER_ADMIN, ADMIN, OPS |
| Pending outbox | `GET /api/admin/outbox` | SUPER_ADMIN, ADMIN, OPS |
| Process outbox | `POST /api/admin/outbox/{eventId}/process` | SUPER_ADMIN, ADMIN, OPS |
| List disputes | `GET /api/admin/disputes?status=OPEN` | SUPER_ADMIN, ADMIN, OPS |
| Resolve dispute | `POST /api/admin/disputes/{id}/resolve?resolution=...` | SUPER_ADMIN, ADMIN, OPS |

---

# Part 3: End-to-end verification

Use this to confirm backend and frontends are aligned.

1. **User app – send flow**  
   - Quote (no auth) → Lookup recipient (auth) → Create payment (auth) → Pay with Stripe (client) → Backend webhook creates transaction and triggers payout.  
   - In app: list transactions or poll status → show receipt.  
   - In admin: list transactions → see same transaction; optionally retry if PAYOUT_FAILED.

2. **Auth separation**  
   - User app: only `POST /api/auth/login`, never `/api/admin/*`.  
   - Admin app: only `POST /api/admin/auth/login`, never user register/login for staff.

3. **Tokens**  
   - User requests: `Authorization: Bearer <userAccessToken>`.  
   - Admin requests: `Authorization: Bearer <adminAccessToken>`.

4. **Errors**  
   - Backend returns JSON: `{ "code": "...", "message": "..." }` (and optional `errors` for validation).  
   - Handle 400, 401, 403, 404, 429 in both frontends.

For full request/response shapes and all endpoints, use [README-FRONTEND-API.md](README-FRONTEND-API.md) and [README-FRONTEND-GUIDE-USER-APP.md](README-FRONTEND-GUIDE-USER-APP.md) (user app) and [README-ADMIN-API.md](README-ADMIN-API.md) and [README-FRONTEND-GUIDE-ADMIN-APP.md](README-FRONTEND-GUIDE-ADMIN-APP.md) (admin app).
