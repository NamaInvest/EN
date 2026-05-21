# B3 — API Specifications (OpenAPI)

## الحالة الحالية
- `public/openapi.json` ✓ — **681 path, 150 tag** (قوي!)
- `src/lib/openapi.ts` ✓ — generator
- لكن لا Postman collection
- لا TypeScript SDK
- لا Redoc HTML docs

## الفجوة (مقابل Stripe Docs / Twilio Console)
- لا examples لكل request/response
- لا interactive try-it-out
- لا rate-limit metadata في الـ spec
- لا CI gate على coverage

## 🎯 Ready Prompt

```
المهمة: تحويل openapi.json (681 path) إلى deliverables production-grade.

السياق:
- public/openapi.json موجود فعلياً
- 681 paths, 150 tags
- src/lib/openapi.ts يولّده آلياً

المخرجات:
1) Enrich spec:
   لكل path في openapi.json أضف:
   - request example (من test fixtures إن وُجدت)
   - response example (success + error)
   - x-rate-limit: { tier: 'DEFAULT'|'FINANCIAL'|'AI'|'ADMIN', perMinute: N }
   - x-saudi-compliance: ['ZATCA', 'GOSI', ...] tags
   - x-required-roles: ['admin', 'accountant']

2) Postman collection:
   npx openapi-to-postmanv2 -s public/openapi.json \
     -o postman/namasoft.json -p -O folderStrategy=Tags
   إضافة:
   - environment variables: {baseUrl}, {token}, {tenantId}
   - pre-request scripts للـ auth
   - tests للـ status code + response shape

3) TypeScript SDK:
   npx openapi-typescript public/openapi.json -o src/sdk/types.ts
   إضافة client wrapper:
   src/sdk/client.ts:
   - typed fetch calls
   - auto-retry on 429
   - bearer token injection

4) Redoc HTML:
   npx @redocly/cli build-docs public/openapi.json \
     -o docs/api-docs.html
   نشر على /api-docs route:
   src/app/api-docs/route.ts → serve docs/api-docs.html

5) CI gates .github/workflows/openapi.yml:
   - on PR: check every new route.ts is registered in openapi.json
   - validate openapi.json syntax
   - generate diff comment on PR

6) versioning:
   .well-known/api-version: v1
   X-Api-Version header injection in withRoute

القيود:
- لا breaking changes في الـ contract الموجود
- backward compat للـ v1 paths
- secrets في examples = placeholders ({{API_KEY}})
```

## السيناريو

عميل B2B (Salla/Zid integration) يحتاج يربط مع Namasoft:

1. Customer Success يفتح `/api-docs` ويُرسل الرابط
2. عميل B2B يستكشف الـ APIs بصرياً (Redoc UI)
3. يضغط "Download Postman" → يستورد `namasoft.json`
4. يضغط على /sales/invoice/create → "Try it out" → success
5. مطوّر B2B يستورد TypeScript SDK:
   ```typescript
   import { createClient } from '@namasoft/sdk';
   const client = createClient({ baseUrl, token });
   const invoice = await client.sales.invoice.create({ ... });
   // type-safe!
   ```
6. لو فات الـ rate limit (FINANCIAL = 30/min)، SDK يعمل auto-retry
7. كل request يُرسل بـ X-Tenant-Id header

## Data Flow

```
[Spec generation flow]
src/app/api/*/route.ts (new endpoint added)
   ↓
next build
   ↓
src/lib/openapi.ts scanner
   ├→ walk all route.ts files
   ├→ extract Zod schemas
   ├→ extract withRoute options (rateLimit, roles)
   └→ extract JSDoc tags
   ↓
public/openapi.json (regenerated)
   ↓
CI: .github/workflows/openapi.yml
   ├→ validate spec syntax
   ├→ run openapi-to-postmanv2
   ├→ run openapi-typescript
   └→ run redocly build-docs
   ↓
Artifacts:
   ├── postman/namasoft.json
   ├── src/sdk/types.ts (committed)
   └── docs/api-docs.html (committed)

[Client usage flow]
External developer downloads SDK
   ↓
import { createClient } from '@namasoft/sdk'
   ↓
const client = createClient({ baseUrl, token, tenantId })
   ↓
client.sales.invoice.create({ customerId, lines, ... })
   ↓
HTTP POST /api/sales/invoice
   Headers: {
     Authorization: 'Bearer <token>',
     X-Tenant-Id: <tenantId>,
     X-Api-Version: 'v1',
     Content-Type: 'application/json'
   }
   ↓
Namasoft API
   ↓
Response (typed) ← SDK transforms
   ↓
TypeScript-safe data in client code

[Rate limit handling]
SDK fetch hits 429
   ↓
SDK extracts Retry-After header
   ↓
Exponential backoff (max 3 retries)
   ↓
Success or final 429 thrown
```

## ملفات المُنتَج

- `public/openapi.json` (enriched)
- `postman/namasoft.json`
- `src/sdk/types.ts` + `src/sdk/client.ts`
- `docs/api-docs.html`
- `src/app/api-docs/route.ts` (serve HTML)
- `.github/workflows/openapi.yml`

## أوامر سريعة

```bash
# Generate everything
npm run openapi:gen

# Or step by step
npx openapi-to-postmanv2 -s public/openapi.json -o postman/namasoft.json -p
npx openapi-typescript public/openapi.json -o src/sdk/types.ts
npx @redocly/cli build-docs public/openapi.json -o docs/api-docs.html
```
