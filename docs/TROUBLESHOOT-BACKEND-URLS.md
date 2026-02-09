# Troubleshoot: Cannot reach backend / 404 NOT_FOUND

When you see **"Cannot reach the backend"** or requests return **404 NOT_FOUND**, follow these steps.

---

## 1. See which URL is called

In the browser:

1. Open **DevTools** (F12) → **Network**.
2. Trigger the action that causes the error (e.g. open a page, click Sign in).
3. Find the red or failed request and note:
   - **Method** (GET, POST, …)
   - **Request URL** (exact path).

---

## 2. Compare with the real API

**Backend base:** `https://nurpay-production.up.railway.app` (no trailing slash)

| Purpose        | Method | Path                          |
|----------------|--------|-------------------------------|
| Admin login    | POST   | `/api/admin/auth/login`       |
| Admin refresh  | POST   | `/api/admin/auth/refresh`     |
| List users     | GET    | `/api/admin/users`            |
| List transactions | GET  | `/api/admin/transactions`     |
| Health         | GET    | `/actuator/health` (not under /api) |

Full URLs should look like:

- `https://nurpay-production.up.railway.app/api/admin/auth/login`
- `https://nurpay-production.up.railway.app/api/admin/users`
- `https://nurpay-production.up.railway.app/actuator/health`

This app builds URLs as: `VITE_API_BASE_URL` (no trailing slash) + path. See [README-ADMIN-API.md](README-ADMIN-API.md) for the full list.

---

## 3. Typical causes of NOT_FOUND or "Cannot reach"

### Trailing slash

- Backend has `/api/admin/users`; app calls `/api/admin/users/` → 404.
- **Fix:** No trailing slash on base URL and on paths. This app strips a trailing slash from `VITE_API_BASE_URL` in code.

### Wrong path

- e.g. `/api/admin/user` (singular) or `/api/users` instead of `/api/admin/users`.
- **Fix:** Use the paths from the table above and from [README-ADMIN-API.md](README-ADMIN-API.md).

### Wrong base URL

- e.g. `VITE_API_BASE_URL` has a typo or wrong host.
- **Fix:** Base = `https://nurpay-production.up.railway.app` (no trailing slash). The app appends paths like `/api/admin/users` (no double `/api`).

### Health / root

- If a health check calls `/api/health` or `/`, the backend may not have that route and return 404.
- **Fix:** Use **GET** `https://nurpay-production.up.railway.app/actuator/health` for health. This app and the error message use `/actuator/health`.

### CORS (browser blocks request)

- Request never reaches the server; browser shows CORS error in console and "Cannot reach the backend" in the app.
- **Fix:** Add your frontend origin to `NURPAY_SECURITY_CORS_ALLOWED_ORIGINS` on Railway. See [PRODUCTION-CORS-RAILWAY.md](PRODUCTION-CORS-RAILWAY.md).
