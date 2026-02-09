# Frontend API reference (NurPay backend)

Use this when building or integrating the web/mobile frontend with the NurPay backend.

## Base URL

- **Local dev:** `http://localhost:8080` (or use your app’s proxy, e.g. `/api` → `http://localhost:8080`)
- **Production:** Set via env / config (e.g. `VITE_API_BASE_URL`).

All user-facing endpoints are under `/api/...`.

## Authentication

- **Register:** `POST /api/auth/register`  
  Body: `{ "email": "string", "password": "string" }`  
  Returns: `{ "accessToken", "refreshToken", "expiresIn?", "user?" }`

- **Login:** `POST /api/auth/login`  
  Body: `{ "email", "password" }`  
  Returns: same as register.

- **Current user:** `GET /api/auth/me`  
  Header: `Authorization: Bearer <accessToken>`  
  Returns: `{ "id", "email", "createdAt?" }`

- **Refresh:** `POST /api/auth/refresh`  
  Body: `{ "refreshToken" }` or send refresh token in header/body as documented by backend.

- **Logout:** `POST /api/auth/logout` (optional; invalidate refresh token if supported).

Use the **access token** in the header for all protected endpoints:

```http
Authorization: Bearer <accessToken>
```

Store `accessToken` and `refreshToken` (e.g. in memory or secure storage); do not expose in URLs.

## Error format

On 4xx/5xx the backend typically returns JSON, e.g.:

- `{ "message": "Human-readable message" }`
- `{ "error": "..." }`
- Validation: `{ "message", "fieldErrors": { "field": "error" } }`

Use `message` or `error` for user-facing messages.

## User-facing endpoints (summary)

| Area        | Method | Path                          | Notes                    |
|------------|--------|-------------------------------|--------------------------|
| Auth       | POST   | /api/auth/register            | email, password          |
| Auth       | POST   | /api/auth/login               | email, password          |
| Auth       | GET    | /api/auth/me                  | Bearer token             |
| Auth       | POST   | /api/auth/refresh             | refresh token            |
| Recipients | GET    | /api/recipients               | List                     |
| Recipients | POST   | /api/recipients               | name, accountNumber, bankCode, currency, country |
| Recipients | DELETE | /api/recipients/{id}          |                          |
| Transactions | GET  | /api/transactions             | List (optional pagination) |
| Transactions | GET  | /api/transactions/{id}/status | Status + details         |
| Send       | POST   | /api/send/quote               | amount, currency, destinationCurrency, destinationCountry |
| Send       | POST   | /api/send/lookup-recipient    | accountNumber, bankCode, country |
| Send       | POST   | /api/send/create-payment      | quoteId, recipientId, idempotencyKey, successUrl?, cancelUrl? |

**Recipients body:** `name`, `accountNumber`, `bankCode`, `currency`, `country` (no `firstName`/`lastName`/`phoneNumber`).

**Send flow (UK → East Africa):** Get quote → optionally lookup recipient → create payment (Stripe). Response may include `clientSecret`, `redirectUrl`, or `transactionId`. Use `transactionId` with `GET /api/transactions/{id}/status` to poll or show receipt.

Admin endpoints are under `/api/admin/...` and require an **admin** JWT from `POST /api/admin/auth/login`; see **README-ADMIN-API.md** for ops/admin.
