# How the Transaction Gets into the Database

This doc explains how a send (Stripe payment) becomes a row in the database, and how to verify it in the DB, admin API, and frontend.

---

## 1. How the transaction gets into the database

When Stripe sends **`payment_intent.succeeded`** to your backend:

1. **StripeWebhookController** (`/api/webhooks/stripe`) receives it.
2. It creates and saves:
   - a **Recipient** (from metadata: name, phone, country, etc.),
   - a **Transaction** (amount, fee, currency, status `PAYMENT_RECEIVED`, `receiveAmount`/`receiveCurrency`, etc.),
   - **Ledger entries** via `recordPaymentReceived`.
3. It calls **`transactionService.triggerPayoutAfterPayment(tx)`** (stub or Safaricom B2C).

So the transaction is written to the database **in this webhook handler**. If the webhook ran successfully, the row is in the DB.

---

## 2. What to check

### Database

**Table:** `transactions` (and related `recipients`, `ledger_entries`).

Use a DB client (e.g. Railway Postgres dashboard, or `psql`) and run:

```sql
SELECT id, user_id, amount, fee, currency, status, receive_amount, receive_currency, created_at
FROM transactions
ORDER BY created_at DESC
LIMIT 10;
```

If you see the transaction you did, the database is correct.

### Admin (backend API)

- **Endpoint:** **GET /api/admin/transactions** (with admin JWT from **POST /api/admin/auth/login**).
- **Optional query:** `?page=0&size=20` or `?status=PAYMENT_RECEIVED` (or other status).

The backend returns transactions from the **same database**; there is no separate “admin DB”. So if the transaction is in the DB, the admin API will return it as long as the admin is logged in and the request is allowed by RBAC.

**Check:** Call `GET https://nurpay-production.up.railway.app/api/admin/transactions` (or your backend URL) with `Authorization: Bearer <admin_token>`. You should see the transaction in the list.

### Frontend (user app)

- **List:** **GET /api/transactions?page=0&size=10** with **user JWT** (the user who did the send).
- **Status:** **GET /api/transactions/{transactionId}/status** with user JWT.
- **Receipt:** **GET /api/transactions/{transactionId}/receipt** with user JWT.

The backend filters by user: `transactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)`. So the frontend only sees transactions for the logged-in user.

**Check:** In the app, log in as the user who made the transaction and open “Transactions” or “History”. The app should call **GET /api/transactions**; the list and receipt should match the transaction you did.

---

## 3. Quick verification summary

| What you want to check | Where |
|------------------------|--------|
| **Transaction in DB** | Query `transactions` (and optionally `recipients`, `ledger_entries`) in Railway Postgres (or your DB client). |
| **Admin sees it** | **GET /api/admin/transactions** with admin token; same data as DB. |
| **Frontend sees it** | User logged in → app calls **GET /api/transactions** (and status/receipt); same transaction for that user. |

---

## 4. Important point

The transaction you did is stored in the database **when the Stripe webhook runs**. The admin and frontend both “see” it by calling the APIs above; they do **not** have a different copy of the data—they all read from the **same DB**.

If you see it in the DB but not in admin or frontend, the next step is to confirm:

- The right **tokens** (admin JWT for admin endpoints, user JWT for user endpoints).
- The frontend is calling the **correct base URL** and **endpoints** (see [TROUBLESHOOT-BACKEND-URLS.md](TROUBLESHOOT-BACKEND-URLS.md)).
