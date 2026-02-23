# NurPay Admin Web App

Staff-only admin UI for NurPay. Uses **only** `/api/admin/**` endpoints. Never calls user auth or user APIs.

## Stack

- React 18 + TypeScript
- Vite
- React Router
- React Query (TanStack Query)
- Zustand (auth state)
- Axios (HTTP client, 401 → refresh flow)
- TailwindCSS
- JWT in memory; refresh token in sessionStorage

## Setup

```bash
npm install
cp .env.example .env
# Edit .env: VITE_API_BASE_URL=/api  (use /api when backend is proxied from Vite)
```

## Run

```bash
npm run dev
```

Runs at `http://localhost:3000`. API requests to `/api/*` are proxied to `http://localhost:8080` (see `vite.config.ts`).

## Build

```bash
npm run build
npm run preview  # serve dist
```

## Login

- **Admin login only:** `POST /api/admin/auth/login` (email + password).
- Seed admins (non-production): `admin@nurpay.local` / `superadmin2@nurpay.local` with password `admin123`.

## RBAC

- **SUPER_ADMIN:** All actions + admin management.
- **ADMIN:** All except admin management.
- **OPS:** Users (freeze/enable), transactions (retry), provider, outbox, disputes, audit. No refund/cancel/reconciliation/KYC.
- **SUPPORT:** Read-only users, transactions, audit.

UI hides actions the current `adminType` cannot perform.

## Pages

- `/login` – Admin login
- `/dashboard` – Overview (users, transactions, pending KYC, disputes)
- `/users`, `/users/:id` – List users, freeze/enable
- `/transactions`, `/transactions/:id` – List/filter, retry/refund/cancel
- `/kyc`, `/kyc/:documentId` – KYC review (view, approve, reject)
- `/admins`, `/admins/:id` – Admin management (SUPER_ADMIN only)
- `/rates` – Exchange rates
- `/fee-config` – Fee config
- `/countries` – Supported countries
- `/provider` – Toggle payout provider
- `/outbox` – Pending outbox events, process
- `/disputes` – List and resolve disputes
- `/audit`, `/audit/entity/:entityType/:entityId` – Audit logs
- `/reconciliation` – Run reconciliation (SUPER_ADMIN, ADMIN)

See `docs/README-ADMIN-APP-FULL.md` in the repo root for full API reference.
