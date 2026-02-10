# NurPay – Full Step-by-Step: How the App Works, Frontend, Setup & Testing

This document is the **single place** for: how the system works end-to-end, what the **frontend** must do step-by-step, how to **set up and run** the backend, how to **configure Safaricom** (M-Pesa) for testing, and how to **test** everything.

---

## Part 1 – How the app works (big picture)

### Two apps, two logins – never mixed

| App | Who uses it | How they get in | Token used for |
|-----|-------------|-----------------|----------------|
| **User (customer) app** (e.g. Flutter) | Customers sending money | **Register** then **Login** | `/api/auth/*`, `/api/recipients`, `/api/send/*`, `/api/transactions`, `/api/compliance`, `/api/notifications` |
| **Admin web app** | Staff (SUPER_ADMIN, ADMIN, OPS, SUPPORT) | **Login only** (no register; admins are pre-created) | **Only** `/api/admin/*` |

- **User app** must **only** call `POST /api/auth/register` and `POST /api/auth/login`. Never use admin login.
- **Admin app** must **only** call `POST /api/admin/auth/login`. Never use user register/login.
- Never send a user token to admin endpoints or an admin token to user endpoints (backend returns 403).

### End-to-end flow (sending money UK → East Africa)

1. **User** opens the app → Registers or logs in → Gets **user JWT**.
2. **User** taps "Send money" → Enters amount in **GBP** and country (e.g. Kenya).
3. **Backend** – **POST /api/send/quote** (no auth) → Returns exchange rate, fee, amount recipient gets (e.g. KES).
4. **User** enters recipient **mobile number** (e.g. Kenya).
5. **Backend** – **POST /api/send/lookup-recipient** (with user JWT) → Returns whether number is valid and **recipient name** (e.g. "John Kamau").
6. **User** confirms → Taps Pay.
7. **Backend** – **POST /api/send/create-payment** (with user JWT) → Creates Stripe Payment Intent, returns **clientSecret**.
8. **Frontend** uses Stripe SDK → User pays with **card or Google Pay**.
9. **Stripe** sends webhook to backend → Backend creates **transaction**, records in **ledger**, and **triggers payout** (stub or Safaricom M-Pesa B2C).
10. **User** sees receipt: "You paid £X", "Recipient gets Y KES". Status comes from **GET /api/transactions/{id}/status** or **GET /api/transactions/{id}/receipt**.

There is **no wallet or balance**. Every send is a card payment via Stripe; after payment the backend automatically sends money to the recipient's M-Pesa number (when Safaricom is configured).

---

## Part 2 – What the frontend must do (step-by-step)

### User (customer) app (e.g. Flutter)

| Step | Frontend action | API / notes |
|------|----------------|-------------|
| 1 | **Register** | **POST /api/auth/register** – body: `firstName`, `lastName`, `email`, `password`, `country` (United Kingdom), `phone` (UK number). Store `accessToken` and `refreshToken`. |
| 2 | **Login** | **POST /api/auth/login** – body: `email`, `password`. If 202 with `requiresMfa`, call **POST /api/auth/mfa/verify** with `tempToken` and `code`. |
| 3 | **All later requests** | Header: `Authorization: Bearer <accessToken>`. On 401, call **POST /api/auth/refresh** with `refreshToken`, then retry with new `accessToken`. |
| 4 | **Get quote** | **POST /api/send/quote** – body: `sendAmount`, `sendCurrency` (GBP), `receiveCountry` (KE), `receiveCurrency` (KES). Show rate, fee, recipient amount. |
| 5 | **Lookup recipient** | **POST /api/send/lookup-recipient** – body: `countryCode` (KE), `mobileNumber`. Show returned **recipientName**; use **normalizedNumber** in create-payment. |
| 6 | **Create payment** | **POST /api/send/create-payment** – body: amount, currency, recipient details, **idempotencyKey** (e.g. UUID per attempt). Use returned **clientSecret** with Stripe SDK to collect payment. |
| 7 | **After payment** | Poll **GET /api/transactions/{id}/status** or list **GET /api/transactions** and show receipt (**GET /api/transactions/{id}/receipt**). Do **not** call any "trigger payout" – backend does it after webhook. |
| 8 | **Recipients** | **GET /api/recipients** – show saved recipients; user can pick one to pre-fill. **POST /api/recipients** to add; **DELETE /api/recipients/{id}** to remove. |
| 9 | **KYC / limits** | If create-payment returns `KYC_REQUIRED` or limit errors, show message and **GET /api/compliance/documents**; **POST /api/compliance/documents** (multipart) to upload ID or source-of-funds. |

**Detailed API shapes:** [README-FRONTEND-GUIDE-USER-APP.md](README-FRONTEND-GUIDE-USER-APP.md) or [README-FRONTEND-API.md](README-FRONTEND-API.md).

### Admin web app

| Step | Frontend action | API / notes |
|------|----------------|-------------|
| 1 | **Login** | **POST /api/admin/auth/login** – body: `email`, `password`. Use seeded accounts in non-production: `admin@nurpay.local` / `admin123`. |
| 2 | **All admin requests** | Header: `Authorization: Bearer <adminAccessToken>`. Use **adminType** from login to show/hide actions (see RBAC). |
| 3 | **Users** | **GET /api/admin/users**. **PUT /api/admin/users/{id}/freeze**, **PUT /api/admin/users/{id}/enable**. |
| 4 | **Transactions** | **GET /api/admin/transactions** (optional `?status=...`). **POST .../refund**, **.../retry**, **.../cancel** (by role). |
| 5 | **KYC documents** | **GET /api/admin/documents?status=PENDING**. **GET /api/admin/documents/{id}/view** (presigned URL). **POST .../approve**, **POST .../reject?reason=...**. |
| 6 | **Audit, reconciliation, provider, outbox, disputes** | See [README-ADMIN-API.md](README-ADMIN-API.md) and [RBAC-ENDPOINT-MAPPING.md](RBAC-ENDPOINT-MAPPING.md). |

**Detailed API and RBAC:** [README-ADMIN-API.md](README-ADMIN-API.md), [README-FRONTEND-GUIDE-ADMIN-APP.md](README-FRONTEND-GUIDE-ADMIN-APP.md), [RBAC-ENDPOINT-MAPPING.md](RBAC-ENDPOINT-MAPPING.md).

---

## Part 3 – Backend setup (step-by-step)

### 1. Prerequisites

- **Java 17+**
- **Docker** (for PostgreSQL and Redis) or install Postgres and Redis locally
- **Maven** (or use `./mvnw`)

### 2. Start database and Redis

```bash
docker-compose up -d
```

This starts PostgreSQL on `localhost:5432` and Redis on `localhost:6379` with DB name `nurpay`, user `nurpay`, password `nurpay_secret`.

### 3. Configure environment

- Copy the template:  
  `cp .env.example .env`  
  (On Windows: copy `.env.example` to `.env` manually.)
- Edit **.env** and set at least:
  - **POSTGRES_*** – match docker-compose (already in .env.example).
  - **REDIS_*** – match docker-compose.
  - **JWT_SECRET** – at least 32 characters (use a strong random value in production).
  - **ENCRYPTION_KEY** – 32 bytes (e.g. base64 or 64 hex chars).
  - **STRIPE_SECRET_KEY** – use `sk_test_...` for testing.
  - **STRIPE_WEBHOOK_SECRET** – from Stripe Dashboard (webhook signing secret).
- Optional: **AWS_S3_*** for KYC document uploads (if not set, uploads return 503).

### 4. Run the backend

```bash
./mvnw spring-boot:run
```

On Windows CMD: `mvnw.cmd spring-boot:run`.

Backend runs at **http://localhost:8080**. Default admin accounts (when not in production) are seeded: `admin@nurpay.local` / `admin123` and `superadmin2@nurpay.local` / `admin123` for **POST /api/admin/auth/login** only.

### 5. Quick API check (user flow)

```bash
# Register
curl -s -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"password123","country":"United Kingdom","phone":"07123456789"}'

# Copy accessToken from response, then:
curl -s -X GET http://localhost:8080/api/auth/me -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Part 4 – Safaricom (M-Pesa) sandbox setup (step-by-step)

To send real M-Pesa payouts in sandbox (B2C), configure these in **.env** and ensure Safaricom can call your backend.

### 1. Get Daraja credentials

- Log in at **https://developer.safaricom.co.ke** (or daraja.safaricom.co.ke).
- Create or open an app with **M-Pesa Sandbox**.
- Copy **Consumer Key** and **Consumer Secret** → set in .env:
  - `SAFARICOM_CONSUMER_KEY=...`
  - `SAFARICOM_CONSUMER_SECRET=...`

### 2. Generate Security Credential (B2C)

- In the Daraja portal go to **Test Credentials** (or "Generate Security Credential").
- Environment: **Sandbox**. Enter the **sandbox initiator password** (from the same page or B2C docs).
- Click **Generate** → copy the long string.
- In **.env** set:
  - `SAFARICOM_B2C_SECURITY_CREDENTIAL=<paste that value>`
  - `SAFARICOM_B2C_INITIATOR_NAME=testapi`
  - `SAFARICOM_B2C_SHORTCODE=600979`

### 3. Callback URLs (Safaricom must reach your server)

Safaricom will POST B2C results to your backend. Your backend must be reachable at a **public URL**.

- **Local testing:** run **ngrok**: `ngrok http 8080` → copy the `https://xxxx.ngrok.io` URL.
- **Deployed (e.g. Railway):** use your app URL (e.g. `https://nurpay.up.railway.app`).

In **.env** set (replace `YOUR-PUBLIC-URL` with the real base URL, no path):

```env
NURPAY_PAYOUT_PROVIDER=safaricom
SAFARICOM_B2C_RESULT_URL=https://YOUR-PUBLIC-URL/api/webhooks/safaricom/b2c/result
SAFARICOM_B2C_QUEUE_TIMEOUT_URL=https://YOUR-PUBLIC-URL/api/webhooks/safaricom/b2c/queue-timeout
```

Example with ngrok: if ngrok gives `https://abc123.ngrok.io`:

```env
SAFARICOM_B2C_RESULT_URL=https://abc123.ngrok.io/api/webhooks/safaricom/b2c/result
SAFARICOM_B2C_QUEUE_TIMEOUT_URL=https://abc123.ngrok.io/api/webhooks/safaricom/b2c/queue-timeout
```

### 4. Restart backend

After changing .env, restart the backend so it picks up the new variables.

**Full B2C and error codes:** [SAFARICOM-DARAJA.md](SAFARICOM-DARAJA.md).

---

## Part 5 – Testing (step-by-step)

### Option A – Test full flow from the user app

1. Backend running with .env configured (Stripe test keys, and Safaricom if testing M-Pesa).
2. If using Safaricom: ngrok running and callback URLs in .env set to the ngrok URL.
3. In the **user app**: Register → Login → Send money:
   - Get quote (send/quote).
   - Enter recipient number (e.g. `254708374149` for sandbox) → lookup-recipient.
   - Create payment → pay with Stripe test card (e.g. `4242 4242 4242 4242`).
4. Check transaction status in the app or via **GET /api/transactions/{id}/status**.
5. If payout is Safaricom: check backend logs for B2C request/response; check transaction status (e.g. PAYOUT_INITIATED → PAYOUT_SUCCESS or PAYOUT_FAILED). If errors, see [SAFARICOM-DARAJA.md](SAFARICOM-DARAJA.md) error reference.

### Option B – Test B2C only (Postman)

1. **Get OAuth token:**  
   GET `https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials`  
   Basic auth: username = Consumer Key, password = Consumer Secret.  
   Copy `access_token` from the response.

2. **Call B2C:**  
   POST `https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest`  
   Header: `Authorization: Bearer <access_token>`, `Content-Type: application/json`  
   Body (example):
   ```json
   {
     "InitiatorName": "testapi",
     "SecurityCredential": "<your-generated-security-credential>",
     "CommandID": "BusinessPayment",
     "Amount": "10",
     "PartyA": "600979",
     "PartyB": "254708374149",
     "Remarks": "Test",
     "ResultURL": "https://YOUR-NGROK-URL/api/webhooks/safaricom/b2c/result",
     "QueueTimeOutURL": "https://YOUR-NGROK-URL/api/webhooks/safaricom/b2c/queue-timeout",
     "Occasion": "Test"
   }
   ```
   Replace `YOUR-NGROK-URL` with your ngrok host. Safaricom will POST the result to ResultURL.

### Option C – Test admin app

1. Backend running. Open admin web app.
2. Login with `admin@nurpay.local` / `admin123` (non-production).
3. Use **GET /api/admin/users**, **GET /api/admin/transactions**, KYC documents, etc., according to [README-ADMIN-API.md](README-ADMIN-API.md) and RBAC.

---

## Part 6 – Summary and other docs

| Topic | Document |
|-------|----------|
| **Frontend flow checklist (user & admin)** | [FRONTEND-FLOW-CHECKLIST.md](FRONTEND-FLOW-CHECKLIST.md) |
| **User app API (all endpoints, request/response)** | [README-FRONTEND-GUIDE-USER-APP.md](README-FRONTEND-GUIDE-USER-APP.md), [README-FRONTEND-API.md](README-FRONTEND-API.md) |
| **Admin API and RBAC** | [README-ADMIN-API.md](README-ADMIN-API.md), [README-FRONTEND-GUIDE-ADMIN-APP.md](README-FRONTEND-GUIDE-ADMIN-APP.md), [RBAC-ENDPOINT-MAPPING.md](RBAC-ENDPOINT-MAPPING.md) |
| **UK → East Africa send flow (API detail)** | [UK-TO-EAST-AFRICA-FLOW.md](UK-TO-EAST-AFRICA-FLOW.md) |
| **How user app and admin app fit together** | [HOW-NURPAY-WORKS.md](HOW-NURPAY-WORKS.md) |
| **How the transaction gets into the DB (webhook, verify)** | [HOW-TRANSACTIONS-GET-INTO-DB.md](HOW-TRANSACTIONS-GET-INTO-DB.md) |
| **Safaricom B2C setup and errors** | [SAFARICOM-DARAJA.md](SAFARICOM-DARAJA.md) |
| **Deploy to Railway** | [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md) |
| **Deploy admin app to Vercel** | [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md) |
| **Production go-live checklist** | [GO-LIVE.md](GO-LIVE.md) |

**Root README:** [../README.md](../README.md) – quick start, stack, API summary, default admins.

---

You now have: how the app works, what the frontend must do step-by-step, backend setup, Safaricom sandbox setup, and how to test. Use the linked docs for exact request/response shapes and error codes.
