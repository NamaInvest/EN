# API Specifications — Namasoft ERP

> **آخر تحديث:** 2026-05-10
> **Source of Truth:** OpenAPI 3.1 spec الذي يُولَّد آلياً من Zod schemas.

---

## 1. الوصول للمواصفات

| Resource | URL / Path |
|----------|-----------|
| **OpenAPI 3.1 JSON** | `GET /api/docs` (mounted by route) |
| **Swagger UI** | `https://{tenant}.namasoft.app/api/docs/ui` |
| **Generated spec file** | [`openapi.json`](../../openapi.json) (committed) |
| **Generator script** | `npm run openapi` → `scripts/generate-openapi.js` |
| **Audit script (Zod coverage)** | `npm run audit:zod` |

> **Stat حالياً:** 681 routes, ~97% Zod coverage (ref: latest commit `b8e91fd9`).

---

## 2. API Versioning Strategy

```
Public:    https://{tenant}.namasoft.app/api/v1/*   (rewritten → /api/*)
Internal:  https://{tenant}.namasoft.app/api/*      (no version, current)
v2:        https://{tenant}.namasoft.app/api/v2/*   (breaking changes; opt-in)
```

- `v1` aliases الـ current routes — يمنح stability للـ B2B integrators.
- Breaking changes → `v2`. Deprecation window ≥ 6 شهور.
- Headers required:
  - `Authorization: Bearer <JWT>` أو `X-API-Key: <key>` (B2B)
  - `Idempotency-Key: <uuid>` على POST/PUT writes
  - `X-Tenant-Slug: <slug>` (optional; subdomain default)

---

## 3. Resource Groups

| Group | Prefix | Sample endpoints |
|-------|--------|------------------|
| **Auth** | `/api/auth` | `login, logout, refresh, mfa/verify` |
| **Sales** | `/api/sales` | `invoices, orders, quotations, returns` |
| **POS** | `/api/pos` | `session, sale, sync` |
| **Purchases** | `/api/purchases` | `po, rfq, grn, ocr` |
| **Inventory** | `/api/inventory` | `items, stock, transfers, count` |
| **Accounting** | `/api/accounting` | `accounts, journal, fx, period-close` |
| **Finance** | `/api/finance` | `treasury, banks, checks, cards` |
| **Manufacturing** | `/api/manufacturing` | `bom, mo, routing, qc` |
| **HR** | `/api/hr` | `employees, contracts, leave` |
| **Payroll** | `/api/payroll` | `runs, gosi, wps, eos` |
| **ZATCA** | `/api/zatca` | `xml, callback, qr, status` |
| **Reports** | `/api/reports` | `pnl, bs, cf, custom` |
| **AI** | `/api/explain, /api/cfo, /api/ocr` | Gemini-powered |
| **B2B** | `/api/b2b` | external API keys |
| **Portal** | `/api/portal` | customer/vendor portals |
| **Admin** | `/api/system, /api/sys` | health, settings |

---

## 4. Standard Response Envelope

```jsonc
// Success
{
  "ok": true,
  "data": { ... },
  "meta": { "page": 1, "pageSize": 20, "total": 142 }
}

// Error
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "اسم العميل مطلوب",
    "messageEn": "Customer name required",
    "details": [{ "path": "customer.name", "rule": "required" }]
  },
  "traceId": "01HXYZ..."
}
```

| HTTP | Meaning |
|------|---------|
| 200 | OK (read or update) |
| 201 | Created |
| 202 | Accepted (async; returns jobId) |
| 204 | No Content (delete success) |
| 400 | Validation / business rule failed |
| 401 | Auth required / token invalid |
| 403 | RBAC denied |
| 404 | Resource not found |
| 409 | Conflict (idempotency / state machine) |
| 410 | Gone (disabled endpoint) |
| 422 | Unprocessable (semantic) |
| 423 | Locked (record being edited / period closed) |
| 429 | Rate-limited |
| 500 | Server error (Sentry) |
| 503 | Service unavailable / maintenance |

---

## 5. Error Codes Catalog (سُلّم الأخطاء)

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Zod schema failed |
| `BUSINESS_RULE_VIOLATION` | منطق محاسبي/أعمال |
| `JOURNAL_NOT_BALANCED` | Debit ≠ Credit |
| `PERIOD_CLOSED` | محاولة كتابة في فترة مُقفلة |
| `ZATCA_REJECTED` | الفاتورة رُفضت من ZATCA |
| `INSUFFICIENT_STOCK` | قيمة سالبة (إن لم يُسمح) |
| `INSUFFICIENT_FUNDS` | رصيد بنك/خزينة لا يكفي |
| `IDEMPOTENCY_REPLAY` | نفس Idempotency-Key بنتيجة مختلفة |
| `RATE_LIMITED` | جاوز الحد |
| `TENANT_SUSPENDED` | الاشتراك معلّق |
| `RBAC_DENIED` | صلاحية غير كافية |
| `MFA_REQUIRED` | عملية حساسة تحتاج OTP |

---

## 6. Pagination, Filtering, Sorting

```
GET /api/sales/invoices
    ?page=1
    &pageSize=20
    &sort=-issuedAt           # - = desc
    &filter[status]=POSTED
    &filter[customerId]=cuid_abc
    &filter[issuedAt][gte]=2026-01-01
    &fields=id,number,total,currency
    &include=customer,lines
```

- Max `pageSize=100`. Default 20.
- All list endpoints support cursor-based pagination via `cursor` (alternative to `page`).

---

## 7. Idempotency Contract

```
POST /api/sales/invoices
Headers:
  Idempotency-Key: 01HXYZ-abc-...
Body: { ... }

→ First call: process + persist (key, response_hash) for 24h
→ Replay with same key + same body → return original response
→ Replay with same key + different body → 409 IDEMPOTENCY_REPLAY
```

---

## 8. Webhooks (Outbound)

| Event | Topic | Payload |
|-------|-------|---------|
| `invoice.posted` | sales | invoice metadata + GL impact |
| `invoice.zatca.cleared` | sales | uuid, hash, qrCode |
| `payroll.run.completed` | payroll | period, total, employees |
| `bank.statement.imported` | finance | accountId, count |
| `tenant.suspended` | system | reason, since |

- Signed via HMAC-SHA256 (`X-Namasoft-Signature` header).
- Retry: exponential backoff 5x over 24h; dead-letter queue.

---

## 9. Rate Limits

| Tier | Reads / min | Writes / min |
|------|------------|--------------|
| Anonymous (auth fail) | 30 | 10 |
| Tenant Free / Trial | 300 | 100 |
| Tenant Growth | 1500 | 500 |
| Tenant Enterprise | 6000 | 2000 |
| B2B API key | per-contract | per-contract |
| ZATCA submission | 10 / 5s (ZATCA-imposed) | — |

Returned headers: `X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset`.

---

## 10. SDK / Code Generation

- TypeScript types: generated from OpenAPI via `openapi-typescript`.
- Postman collection: `tools/postman/namasoft.postman_collection.json` (planned).
- Examples:
  ```ts
  import { createClient } from '@namasoft/sdk';
  const ns = createClient({ tenant: 'acme', token: process.env.API_KEY });
  const inv = await ns.sales.invoices.create({ ... });
  ```

---

## 11. References

- [scripts/generate-openapi.js](../../scripts/generate-openapi.js)
- [scripts/audit-zod.js](../../scripts/audit-zod.js)
- [Security Plan](../security/security-plan.md)
- [Multi-Tenant Architecture](../architecture/multi-tenant.md)
