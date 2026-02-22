# Admin app – screens step by step (from README-ADMIN-APP-FULL)

This doc lists **all 14 screens** from the Full Admin App README and the order/steps to build them. The app now implements all 14.

---

## How many screens?

**Total: 14 screens** (each is one main route/page).

| # | Screen | Route | Roles | Status |
|---|--------|-------|--------|--------|
| 1 | **Login** | `/login` | — | Done |
| 2 | **Dashboard** | `/` | Any admin | Done |
| 3 | **Users list** | `/users` | Any admin (freeze/enable: SUPER_ADMIN, ADMIN, OPS) | Done |
| 4 | **Transactions list** | `/transactions` | Any admin (retry: S/A/OPS; refund/cancel: S/A) | Done |
| 5 | **Audit logs** | `/audit` | Any admin | Done |
| 6 | **KYC documents** | `/documents` | SUPER_ADMIN, ADMIN | Done |
| 7 | **Admins** | `/admins` | SUPER_ADMIN only | Done |
| 8 | **Reconciliation** | `/reconciliation` | SUPER_ADMIN, ADMIN | Done |
| 9 | **Provider** | `/provider` | SUPER_ADMIN, ADMIN, OPS | Done |
| 10 | **Outbox** | `/outbox` | SUPER_ADMIN, ADMIN, OPS | Done |
| 11 | **Disputes** | `/disputes` | SUPER_ADMIN, ADMIN, OPS | Done |
| 12 | **Exchange rates** | `/rates` | SUPER_ADMIN, ADMIN | Done |
| 13 | **Fee config** | `/fee-config` | SUPER_ADMIN, ADMIN | Done |
| 14 | **Supported countries** | `/countries` | SUPER_ADMIN, ADMIN | Done |

---

## Step-by-step (build order)

1. **Login** – POST /api/admin/auth/login; store accessToken, refreshToken, adminType; redirect to `/`.
2. **Dashboard** – GET users + transactions (optional filters); show summary.
3. **Users list** – GET /api/admin/users; freeze/enable per RBAC.
4. **Transactions list** – GET /api/admin/transactions?status=...; retry/refund/cancel per RBAC; show receiveAmount, receiveCurrency, failureReason.
5. **Audit logs** – GET /api/admin/audit; optional GET audit/entity for one entity.
6. **KYC documents** – GET /api/admin/documents?status=PENDING; view (presigned URL), approve, reject.
7. **Admins** – POST/GET/PUT /api/admin/admins (SUPER_ADMIN only).
8. **Reconciliation** – POST /api/admin/reconciliation/run.
9. **Provider** – PUT /api/admin/provider/{code}?enabled=true|false.
10. **Outbox** – GET /api/admin/outbox; POST .../process.
11. **Disputes** – GET /api/admin/disputes; POST .../resolve?resolution=...
12. **Exchange rates** – GET /api/admin/rates; PUT /api/admin/rates (sendCurrency, receiveCurrency, rate).
13. **Fee config** – GET /api/admin/fee-config; PUT /api/admin/fee-config (sendCurrency, feePercent, feeMinAmount, feeMaxAmount, feeCurrency).
14. **Supported countries** – GET /api/admin/countries; POST add; PUT /api/admin/countries/{countryCode} update; after add, add rate on Exchange rates.

---

## RBAC summary (who sees what in nav)

- **SUPPORT:** Dashboard, Users, Transactions, Audit only (read-only).
- **OPS:** + Provider, Outbox, Disputes; + freeze/enable users, retry payout.
- **ADMIN:** + Reconciliation, KYC documents, **Exchange rates**, **Fee config**, **Countries**; + refund, cancel.
- **SUPER_ADMIN:** + Admins (list, create, update).

All 14 screens are implemented; nav entries for rates, fee-config, and countries are shown only to SUPER_ADMIN and ADMIN (`canRatesFeeCountries`).
