# New app users not showing in Admin Users list

The admin “Users” list comes from **GET /api/admin/users**. That endpoint returns all users from the same **users** table that the app uses when someone registers. There’s no separate “admin-only” user list.

If you see **old users** in admin but not the **new users** you created from the app, the usual cause is:

## 1. Admin and app are using different backends (most common)

- **Admin app** → e.g. `http://localhost:8080` → backend A → **DB A** (where you see the “old” users).
- **Customer app** → e.g. `https://nurpay-production.up.railway.app` → backend B → **DB B** (where new registrations are stored).

New users exist in DB B, but the admin is only querying DB A, so they never show up.

### What to do

**Use the same API for admin as the one your app uses for registration.**

| Where new users are created | Set in admin app `.env` |
|-----------------------------|-------------------------|
| **Production** (e.g. app uses Railway) | `VITE_API_BASE_URL=https://nurpay-production.up.railway.app` |
| **Local** (app uses localhost) | `VITE_API_BASE_URL=http://localhost:8080` |

**Steps:**

1. In the admin project, open **`.env`**.
2. Set **`VITE_API_BASE_URL`** to the **same base URL** the customer app uses (e.g. production URL if that’s where users register).
3. **Restart** the admin dev server (`npm run dev`), then reload the admin and open the Users list again.

After that, the admin will call the same backend (and DB) as the app, and you should see the new users.

---

## 2. Other backend checks (if URLs already match)

If admin and app already point to the same backend and new users still don’t appear:

- **Same data source** – POST /api/auth/register must write to the same `users` table (and DB) that GET /api/admin/users reads from.
- **No caching** – If the backend caches the “list users” response, disable it for that endpoint or invalidate the cache when a new user is created.
- **Query/sort** – GET /api/admin/users should return all customer users; sort by `createdAt,desc` so newest appear first.
- **Read replicas** – If the admin API reads from a replica, replication lag can delay new users; consider reading from primary for this endpoint.

Use the **Refresh** button on the Admin Users page to reload the list after any change.
