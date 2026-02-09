# Deploy admin app to Vercel

Deploy this admin app to Vercel so it runs at a URL like **https://your-admin-app.vercel.app** and talks to the production API (e.g. Railway).

---

## 1. Deploy to Vercel

1. Push this repo to GitHub (if not already).
2. Go to [vercel.com](https://vercel.com) and sign in.
3. **Add New** → **Project** → import your `nuradmin` repo.
4. Vercel will detect Vite. Keep **Build Command**: `npm run build`, **Output Directory**: `dist`.
5. Before deploying, add the environment variable (step 2 below).
6. Click **Deploy**. Your app will be at `https://<project-name>.vercel.app` (or a custom domain).

The repo includes **`vercel.json`** so that:
- All routes are rewritten to `/index.html` (SPA routing for React Router).
- Build uses `npm run build` and output is `dist`.

---

## 2. Environment variable on Vercel

So the **deployed** admin talks to the production backend:

1. In Vercel: your project → **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://nurpay-production.up.railway.app`  
     (no trailing slash; same backend the customer app uses)
3. Apply to **Production** (and Preview if you want).
4. **Redeploy** the project (Deployments → … → Redeploy) so the new variable is used.

---

## 3. CORS on Railway (backend)

The production API (Railway) must allow your **Vercel admin origin** in CORS.

1. In **Railway** → your **NurPay backend** service → **Variables**.
2. Set or extend **`NURPAY_SECURITY_CORS_ALLOWED_ORIGINS`** to include your Vercel URL, e.g.:
   ```text
   https://your-admin-app.vercel.app
   ```
   Use your real URL (e.g. `https://nuradmin.vercel.app`). No trailing slash. Comma-separate if you have other origins (e.g. localhost).
3. Save; Railway will redeploy the backend.

See [PRODUCTION-CORS-RAILWAY.md](PRODUCTION-CORS-RAILWAY.md) for more CORS examples.

---

## 4. After deploy

- Open **https://your-admin-app.vercel.app** (your actual Vercel URL).
- Log in with an admin account. The app will call `https://nurpay-production.up.railway.app/api/admin/*`.
- If you see “Cannot reach the backend” or CORS errors, confirm `NURPAY_SECURITY_CORS_ALLOWED_ORIGINS` on Railway includes `https://your-admin-app.vercel.app` and redeploy the backend.
