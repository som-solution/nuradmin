# NurPay Admin

React + TypeScript + Vite + Tailwind CSS **admin web app** for the NurPay backend. Staff only (SUPER_ADMIN, ADMIN, OPS, SUPPORT). Customers use the Flutter app; this project has **no customer screens or code**.

## Stack

- **React 19** + **TypeScript**
- **Vite 7**
- **Tailwind CSS 4**
- **React Router 7**

---

## Routes

| Route | Purpose |
|-------|---------|
| `/login` | Admin sign in (POST /api/admin/auth/login). No registration. |
| `/` | Dashboard (after login) |
| `/users` | List users; freeze/enable (by role) |
| `/transactions` | List transactions; refund, retry, cancel (by role) |
| `/audit` | Audit logs; filter by entity |
| `/reconciliation` | Run reconciliation (SUPER_ADMIN, ADMIN only) |
| `/provider` | Toggle payout provider (SUPER_ADMIN, ADMIN, OPS) |
| `/outbox` | Pending outbox events; process (SUPER_ADMIN, ADMIN, OPS) |
| `/disputes` | List and resolve disputes (SUPER_ADMIN, ADMIN, OPS) |
| `/documents` | KYC documents – list, view, approve, reject (SUPER_ADMIN, ADMIN only) |
| `/admins` | List admins; create/update (SUPER_ADMIN only) |

---

## RBAC

- **SUPER_ADMIN:** Full access; admin management (list/create/update admins).
- **ADMIN:** Refund, cancel, reconciliation, KYC documents. No admin management.
- **OPS:** Users (freeze/enable), transactions (retry), audit, provider, outbox, disputes. No refund, cancel, reconciliation, KYC, admins.
- **SUPPORT:** Read-only – users list, transactions list, audit.

---

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the backend** so the API is at `http://localhost:8080`.

3. **Start the dev server**

   ```bash
   npm run dev
   ```

   App runs at **http://localhost:3000**. API base URL defaults to `http://localhost:8080` (set `VITE_API_BASE_URL` in `.env` for production).

---

## Scripts

- `npm run dev` — development server (port 3000)
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — ESLint

---

## API base URL

- **Development:** `http://localhost:8080` (or set `VITE_API_BASE_URL` in `.env`).
- **Production:** Set `VITE_API_BASE_URL` (e.g. `https://nurpay-production.up.railway.app`) in your deployment (e.g. Vercel env). See [docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md).

---

## Login

- **No registration.** Admins are created by the backend (seed) or by SUPER_ADMIN in the Admins section.
- **Seed accounts** (non-production): `admin@nurpay.local` / `admin123`, `superadmin2@nurpay.local` / `admin123`.
- All requests use **admin JWT** (`Authorization: Bearer <adminAccessToken>`) for `/api/admin/*` only.

---

## Documentation

- **[docs/README-ADMIN-API.md](docs/README-ADMIN-API.md)** – Full admin API (endpoints, RBAC, request/response).
- **[docs/README-FRONTEND-GUIDE-ADMIN-APP.md](docs/README-FRONTEND-GUIDE-ADMIN-APP.md)** – Frontend guide (screens, flows).
- **[docs/FRONTEND-FLOW-CHECKLIST.md](docs/FRONTEND-FLOW-CHECKLIST.md)** – Flow checklist (admin section).
- **[docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md)** – Deploy to Vercel.
- **[docs/PRODUCTION-CORS-RAILWAY.md](docs/PRODUCTION-CORS-RAILWAY.md)** – CORS for production backend.
