# Production API & CORS (Railway)

This doc covers using the **production backend** (e.g. `https://nurpay-production.up.railway.app`) from this frontend and how to fix **"Failed to fetch"** (CORS).

---

## Summary (fix CORS on the backend)

| Check | Action |
|-------|--------|
| **Backend up?** | Open [https://nurpay-production.up.railway.app/actuator/health](https://nurpay-production.up.railway.app/actuator/health) |
| **CORS for localhost** | In Railway **backend** → Variables, set `NURPAY_SECURITY_CORS_ALLOWED_ORIGINS` to a comma-separated list of your frontend origins (see below), then **redeploy** |
| **After redeploy** | Reload the admin app and try again; check the browser **Network** tab if it still fails |

**So:** You fix this on the **backend** (Railway) by setting CORS and redeploying. The admin app only needs to keep using `https://nurpay-production.up.railway.app` (in `.env`) and run at an origin you’ve allowed. **Admin on Vite (port 5173):** The backend default only allows `http://localhost:3000`. If the admin runs at `http://localhost:5173` (Vite default), you **must** add that origin. Example: `http://localhost:5173,http://127.0.0.1:5173` (or add these to the list if you already have other origins). No trailing slashes. Redeploy after changing the variable.

---

## Frontend: use production API

1. In the project root, set in **`.env`** (see `.env.example`):
   ```bash
   VITE_API_BASE_URL=https://nurpay-production.up.railway.app
   ```
   (No trailing slash. All `/api` and `/api/admin` requests then go to this URL.)

2. **Restart the dev server** after changing `.env`:
   ```bash
   # Stop with Ctrl+C, then:
   npm run dev
   ```

3. Open the app (e.g. `http://localhost:5173` for Vite or `http://localhost:3000`). Reload the admin and open the Users list so it loads from the production API/DB.

---

## Backend: CORS on production (Railway)

The backend (NurPay API repo) gets **allowed origins** from:

- **Config property:** `nurpay.security.cors.allowed-origins`
- **Railway variable:** `NURPAY_SECURITY_CORS_ALLOWED_ORIGINS` (overrides default)
- **Default in code:** `http://localhost:3000`, `http://127.0.0.1:3000` — so **port 5173 (Vite) must be added** if that's where the admin runs

When the browser calls `https://nurpay-production.up.railway.app` from your frontend, the **frontend’s origin** must be in that list or you get **"Failed to fetch"** (CORS blocked).

### Set CORS on Railway (backend service)

Add an environment variable to the **backend** service on Railway:

| Name | Value |
|------|--------|
| `NURPAY_SECURITY_CORS_ALLOWED_ORIGINS` | Comma-separated list of frontend origins |

**Examples:**

- **Admin on Vite default (port 5173):**
  ```text
  http://localhost:5173,http://127.0.0.1:5173
  ```

- **Multiple local ports (3000, 3001, 5173):**
  ```text
  http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:5173,http://127.0.0.1:5173
  ```

- **Admin deployed on Vercel:**
  ```text
  https://your-admin-app.vercel.app
  ```
  (Use your real Vercel URL, e.g. `https://nuradmin.vercel.app`. No trailing slash. Add to the list if you also use localhost.)

- **Local dev + deployed frontend (Vercel admin + local):**
  ```text
  https://your-admin-app.vercel.app,http://localhost:5173,http://127.0.0.1:5173
  ```

- **Local dev + other deployed frontends:**
  ```text
  https://your-admin-app.up.railway.app,https://your-customer-app.up.railway.app,http://localhost:5173,http://127.0.0.1:5173
  ```

After changing the variable on Railway, redeploy or restart the backend so the new CORS config is applied.

---

## Recap

| Item | Action |
|------|--------|
| **Use production API** | Set `VITE_API_BASE_URL=https://nurpay-production.up.railway.app` in `.env` |
| **After changing .env** | Restart dev server: stop `npm run dev`, then run it again |
| **"Failed to fetch" / "Cannot reach backend"** | Ensure backend CORS includes your frontend origin (Railway env: `NURPAY_SECURITY_CORS_ALLOWED_ORIGINS`) |
| **Admin on Vercel** | Deploy with Vercel, set `VITE_API_BASE_URL` there; add `https://your-admin-app.vercel.app` to Railway CORS. See [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md). |
| **Switch back to local API** | Set `VITE_API_BASE_URL=http://localhost:8080` in `.env` and restart dev server |

---

## Quick checks

- **Backend up:** Open `https://nurpay-production.up.railway.app/actuator/health` in a new tab; you should see JSON (e.g. `{"status":"UP"}`).
- **CORS:** If that works but the app still shows "Failed to fetch", the browser is blocking the request due to CORS — add your frontend origin to `NURPAY_SECURITY_CORS_ALLOWED_ORIGINS` on the backend (Railway).
