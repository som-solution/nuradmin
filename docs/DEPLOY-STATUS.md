# NurPay Admin App – Deploy Status

Use this checklist to confirm the admin web app deployment is complete and working.

---

## 1. Build and deploy (Vercel)

| Item | Status | Notes |
|------|--------|--------|
| **Build** | Done | `npm run build` (tsc + Vite) succeeds; output in `dist/`. |
| **Deploy** | Done | App is live at **https://nuradmin.vercel.app**. |
| **SPA routing** | Done | `vercel.json` rewrites routes to `/index.html`. |

---

## 2. Post-deploy configuration (required for full functionality)

| Item | Where | What to do |
|------|--------|------------|
| **API base URL** | Vercel → Project → Settings → Environment Variables | Add **`VITE_API_BASE_URL`** = `https://nurpay-production.up.railway.app` (or your backend URL). Apply to **Production** (and Preview if needed). Then **Redeploy** so the build picks it up. Without this, production API calls go to the wrong host. |
| **CORS** | Railway → NurPay backend → Variables | Set **`NURPAY_SECURITY_CORS_ALLOWED_ORIGINS`** to include `https://nuradmin.vercel.app` (no trailing slash). Save; Railway redeploys. See [PRODUCTION-CORS-RAILWAY.md](PRODUCTION-CORS-RAILWAY.md). |

---

## 3. Quick verification

1. Open **https://nuradmin.vercel.app** – you should see the app (customer sign-in or landing).
2. Go to **https://nuradmin.vercel.app/admin/login** – admin login page.
3. After setting `VITE_API_BASE_URL` and CORS: log in with `admin@nurpay.local` / `admin123` (if backend is seeded). If you see “Cannot reach the backend” or CORS errors, complete step 2 above.

---

## 4. Summary

- **Frontend deploy:** Complete (Vercel, https://nuradmin.vercel.app).
- **Backend:** Separate service (e.g. Railway). Not part of this repo.
- **To finish:** Set `VITE_API_BASE_URL` on Vercel and allow `https://nuradmin.vercel.app` in backend CORS, then redeploy if needed.

Full deploy steps: [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md).
