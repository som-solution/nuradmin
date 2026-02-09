# NurPay Web App

React + TypeScript + Vite + Tailwind CSS frontend for the NurPay money transfer backend (UK → East Africa, Stripe). This repo contains **two flows in one app**: the **customer (user) app** and the **admin (staff) web app**.

## Stack

- **React 19** + **TypeScript**
- **Vite 7**
- **Tailwind CSS 4**
- **React Router 7**

---

## Frontend flow

### Two apps, two login endpoints

| | Customer (user) app | Admin (staff) app |
|--|---------------------|--------------------|
| **Who** | Customers (send money) | Staff (SUPER_ADMIN, ADMIN, OPS, SUPPORT) |
| **Routes** | `/`, `/login`, `/register`, `/send`, `/recipients`, `/transactions`, `/compliance` | `/admin`, `/admin/login`, `/admin/users`, `/admin/transactions`, etc. |
| **Login** | **POST /api/auth/login** | **POST /api/admin/auth/login** |
| **Registration** | **Yes** — customers register at `/register` (**POST /api/auth/register**) | **No** — admins are created by the backend (seed) or by SUPER_ADMIN in the Admins section |
| **Token** | User JWT → used only for `/api/*` (recipients, send, transactions, compliance, auth/me) | Admin JWT → used only for `/api/admin/*` |
| **Credentials** | Any email/password used when registering as a customer | Seeded: `admin@nurpay.local` or `superadmin2@nurpay.local` / `admin123` (change after first login in Admins) |

**Do not mix:** The customer login form must never use admin credentials. The admin login form must never call user login or user register. Each app uses its own API and token.

---

### Customer (user) flow

1. **Register** at `/register` (POST /api/auth/register) with email and password (min 8 characters). This creates a **user** in the `users` table.
2. **Sign in** at `/login` (POST /api/auth/login) with the same email and password. User JWT is stored and used for all customer API calls.
3. **Dashboard** (`/`) — links to Send money, Recipients, Transactions, Verification.
4. **Send money** (`/send`) — get quote → choose recipient → create payment (Stripe). No wallet; UK → East Africa only.
5. **Recipients** (`/recipients`) — add, list, delete recipients (name, account number, bank code, currency, country).
6. **Transactions** (`/transactions`) — list and status of transactions.
7. **Verification** (`/compliance`) — profile, postcode lookup, KYC document upload (passport, driving licence, payslip, bank statement), view KYC tier.

If an admin has **disabled** or **frozen** a user, that user gets a clear message on login (e.g. "Your account has been disabled or suspended. Please contact support.").

---

### Admin (staff) flow

1. **Sign in** at `/admin/login` (POST /api/admin/auth/login). There is **no registration** for admins. Use one of the seeded accounts:
   - **admin@nurpay.local** / admin123  
   - **superadmin2@nurpay.local** / admin123  

   (Created by the backend when it first runs and the `admins` table is empty.)

2. **Dashboard** (`/admin`) — links to Admins, Users, Transactions, Audit, Reconciliation, Provider, Outbox, Disputes, KYC documents (visibility depends on role).

3. **RBAC** — the UI shows only what your role allows:
   - **SUPER_ADMIN:** Full access; Admins (list, update email/password), all other sections.
   - **ADMIN:** Same as below + refund, cancel, reconciliation, KYC documents. No admin management.
   - **OPS:** Users (list, freeze, enable), Transactions (list, retry), Audit, Provider, Outbox, Disputes. No refund, cancel, reconciliation, KYC, admin management.
   - **SUPPORT:** Read-only — Users list, Transactions list, Audit.

4. **Admins** (`/admin/admins`, SUPER_ADMIN only) — list admins, update any admin’s email and/or password (e.g. change default password after first login).

5. **Users** — list users; freeze or enable (SUPER_ADMIN, ADMIN, OPS).

6. **Transactions** — list (filter by status); refund, retry, cancel (by role).

7. **Audit** — list audit logs; filter by entity type and entity ID.

8. **Reconciliation** — run (SUPER_ADMIN, ADMIN only).

9. **Provider** — toggle provider enabled/disabled (SUPER_ADMIN, ADMIN, OPS).

10. **Outbox** — list pending events, process (SUPER_ADMIN, ADMIN, OPS).

11. **Disputes** — list, resolve with resolution and notes (SUPER_ADMIN, ADMIN, OPS).

12. **KYC documents** — list (by status or by user), view (presigned URL), approve, reject (SUPER_ADMIN, ADMIN only).

---

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the backend** (PostgreSQL, Redis, Spring Boot) so the API is at `http://localhost:8080`.

3. **Start the dev server**

   ```bash
   npm run dev
   ```

   App runs at **http://localhost:3000**. In dev, API calls use `http://localhost:8080` by default (see **API base URL** below).

---

## Scripts

- `npm run dev` — development server (port 3000)
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — ESLint

---

## API base URL

- **Development:** If the backend is on port 8080, the app defaults to `http://localhost:8080` for API calls (no proxy required). Requests go to the backend directly.
- **Override:** Set `VITE_API_BASE_URL` in `.env` (e.g. `VITE_API_BASE_URL=http://localhost:8080` or `https://nurpay-production.up.railway.app` for production). See `.env.example`.
- **Production + CORS:** When using a remote API (e.g. Railway), see **[docs/PRODUCTION-CORS-RAILWAY.md](docs/PRODUCTION-CORS-RAILWAY.md)** for CORS setup and fixing "Failed to fetch".

---

## 401 / 429 on login

- **401 on customer login** — User does not exist or wrong password. Register first at `/register`, then sign in with that email and password. Do not use admin credentials (e.g. admin@nurpay.local) on the customer login form; use **Admin login** for that.
- **401 on admin login** — Invalid credentials or admin disabled. Use the seeded accounts; no registration.
- **429** — Too many login attempts (rate limit). Wait about a minute or use a different email (customer) or reset the limit in Redis (admin).

---

## Documentation

- **[docs/HOW-NURPAY-WORKS.md](docs/HOW-NURPAY-WORKS.md)** – Full picture: app users vs web admins, tokens, flows, send limits, RBAC.
- **[docs/PRODUCTION-CORS-RAILWAY.md](docs/PRODUCTION-CORS-RAILWAY.md)** – Use production API, CORS, and Railway backend env (`NURPAY_SECURITY_CORS_ALLOWED_ORIGINS`).
- **docs/README-FRONTEND-API.md** – User app API (auth, recipients, send, transactions, compliance).
- **docs/README-ADMIN-API.md** – Admin API (all `/api/admin/*` endpoints, RBAC).
- **docs/RBAC-ENDPOINT-MAPPING.md** – Which role can call which endpoint.

---

## API summary

**Customer app** (user JWT):

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Recipients: `GET/POST/DELETE /api/recipients`
- Transactions: `GET /api/transactions`, `GET /api/transactions/{id}/status`
- Send: `POST /api/send/quote`, `POST /api/send/create-payment`
- Compliance: `GET/PUT /api/compliance/profile`, `GET /api/compliance/postcode-lookup`, `POST/GET /api/compliance/documents`

**Admin app** (admin JWT):

- Auth: `POST /api/admin/auth/login`, `POST /api/admin/auth/refresh`
- Users: `GET /api/admin/users`, `PUT .../freeze`, `PUT .../enable`
- Admins: `GET /api/admin/admins`, `PUT /api/admin/admins/{adminId}` (SUPER_ADMIN only)
- Transactions: `GET /api/admin/transactions`, `POST .../refund`, `.../retry`, `.../cancel`
- Audit: `GET /api/admin/audit`, `GET /api/admin/audit/entity`
- Reconciliation: `POST /api/admin/reconciliation/run`
- Provider: `PUT /api/admin/provider/{code}?enabled=...`
- Outbox: `GET /api/admin/outbox`, `POST /api/admin/outbox/{id}/process`
- Disputes: `GET /api/admin/disputes`, `POST /api/admin/disputes/{id}/resolve`
- KYC: `GET /api/admin/documents`, `GET /api/admin/users/{userId}/documents`, `GET /api/admin/documents/{id}/view`, `POST .../approve`, `POST .../reject`

See the backend’s **docs/README-FRONTEND-API.md** and **docs/README-ADMIN-API.md** for full request/response shapes and RBAC.
