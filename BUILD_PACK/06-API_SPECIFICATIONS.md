# 06 — API Specifications
**Standard:** OpenAPI 3.1 | **Style:** REST | **Auth:** Bearer + Tenant header

---

## 1. API Conventions

### 1.1 Versioning
- Version in header: `X-API-Version: 2026-01`
- Breaking changes require new version + 6-month deprecation notice
- URL stays clean (`/api/sales/invoices`, no `/v1/`)

### 1.2 Authentication
```
Authorization: Bearer <jwt-token>
X-Tenant-ID: <tenant-id>          (when using API key, otherwise resolved from session)
Idempotency-Key: <uuid>           (for POST/PUT)
X-API-Version: 2026-01
```

### 1.3 Resource Naming
- **Plural nouns:** `/customers`, `/invoices`, `/payments`
- **Kebab-case** for multi-word: `/sales-orders`, `/work-orders`
- **Sub-resources:** `/customers/:id/invoices`, `/orders/:id/lines`
- **Actions on resources:** `/invoices/:id/post`, `/orders/:id/cancel`

### 1.4 HTTP Methods
- `GET` — read (idempotent)
- `POST` — create / non-idempotent action
- `PUT` — full replace (rare)
- `PATCH` — partial update
- `DELETE` — soft-delete (HARD-DELETE never via API)

### 1.5 Pagination
```
GET /api/customers?page=1&pageSize=50&sort=createdAt:desc
```
Response:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "total": 1234,
    "totalPages": 25
  }
}
```

For very large lists, use cursor-based:
```
GET /api/journal-lines?cursor=abc&limit=100
```

### 1.6 Filtering & Search
```
GET /api/invoices?status=POSTED&customerId=cus_123&dateFrom=2026-01-01&dateTo=2026-12-31&q=keyword
```

Allowed operators (per field, documented per endpoint):
- exact: `status=POSTED`
- in: `status[]=DRAFT&status[]=POSTED` or `status=DRAFT,POSTED`
- range: `dateFrom`, `dateTo` or `amount[gte]=100&amount[lte]=1000`
- search: `q=keyword`

### 1.7 Sorting
```
sort=field1:asc,field2:desc
```

### 1.8 Field Selection (sparse fieldsets)
```
GET /api/customers?fields=id,fullName,phone
```

### 1.9 Includes (related resources)
```
GET /api/invoices/:id?include=customer,lines,payments
```

### 1.10 Response Format

Success:
```json
{
  "data": { ... },
  "meta": { "requestId": "...", "duration": 45 }
}
```

Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invoice total must be positive",
    "messageAr": "إجمالي الفاتورة يجب أن يكون موجباً",
    "field": "totalAmount",
    "details": [...]
  },
  "meta": { "requestId": "...", "documentationUrl": "..." }
}
```

### 1.11 HTTP Status Codes
- 200 OK — success with body
- 201 Created — resource created
- 202 Accepted — async job started
- 204 No Content — success without body
- 400 Bad Request — validation error
- 401 Unauthorized — no/invalid auth
- 403 Forbidden — auth ok, permission denied
- 404 Not Found — resource missing
- 409 Conflict — state conflict (e.g., voiding paid invoice)
- 422 Unprocessable Entity — semantic validation
- 429 Too Many Requests — rate limit
- 500 Internal Server Error — bug
- 503 Service Unavailable — maintenance / dep down

### 1.12 Error Codes (Application)
| Code | When |
|------|------|
| `VALIDATION_ERROR` | Zod failure |
| `PERMISSION_DENIED` | RBAC denied |
| `TENANT_INVALID` | tenant suspension |
| `INVOICE_ALREADY_POSTED` | re-post attempt |
| `INSUFFICIENT_STOCK` | Sales order over qty |
| `BUDGET_EXCEEDED` | budget control fired |
| `CONTROL_ACCOUNT_DIRECT_POST` | trying to JE control account directly |
| `ZATCA_REJECTED` | ZATCA returned error |
| `MUDAD_OFFLINE` | Mudad API down |
| `INVALID_STATE_TRANSITION` | doc state machine reject |

---

## 2. OpenAPI 3.1 Pattern (Sample)

`openapi/sales-invoices.yaml`:

```yaml
openapi: 3.1.0
info:
  title: Namasoft Sales Invoices API
  version: 2026-01
  description: |
    Manages sales invoices including ZATCA Phase 2 compliance.
servers:
  - url: https://api.namasoft.sa
security:
  - bearerAuth: []
  - apiKey: []

paths:
  /api/sales/invoices:
    get:
      summary: List sales invoices
      tags: [Sales Invoices]
      parameters:
        - $ref: '#/components/parameters/Page'
        - $ref: '#/components/parameters/PageSize'
        - name: status
          in: query
          schema:
            type: string
            enum: [DRAFT, PENDING_APPROVAL, APPROVED, POSTED, CANCELLED, ZATCA_CLEARED]
        - name: customerId
          in: query
          schema: { type: string }
        - name: dateFrom
          in: query
          schema: { type: string, format: date }
        - name: dateTo
          in: query
          schema: { type: string, format: date }
      responses:
        '200':
          description: List of invoices
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InvoiceListResponse'
    post:
      summary: Create new invoice (DRAFT)
      tags: [Sales Invoices]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/InvoiceCreateRequest'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InvoiceResponse'

  /api/sales/invoices/{id}:
    parameters:
      - $ref: '#/components/parameters/Id'
    get:
      summary: Get invoice by ID
      tags: [Sales Invoices]
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InvoiceResponse'

  /api/sales/invoices/{id}/post:
    parameters: [{ $ref: '#/components/parameters/Id' }]
    post:
      summary: Post invoice (creates JE + ZATCA submission)
      tags: [Sales Invoices]
      responses:
        '200':
          description: Posted
          content:
            application/json:
              schema:
                type: object
                properties:
                  invoice:
                    $ref: '#/components/schemas/Invoice'
                  journalEntryId: { type: string }
                  zatcaSubmissionId: { type: string }

  /api/sales/invoices/{id}/cancel:
    parameters: [{ $ref: '#/components/parameters/Id' }]
    post:
      summary: Cancel invoice (DRAFT only)
      tags: [Sales Invoices]
      responses:
        '200': { description: Cancelled }
        '409': { description: Cannot cancel posted invoice }

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key

  parameters:
    Id:
      name: id
      in: path
      required: true
      schema: { type: string }
    Page:
      name: page
      in: query
      schema: { type: integer, minimum: 1, default: 1 }
    PageSize:
      name: pageSize
      in: query
      schema: { type: integer, minimum: 1, maximum: 200, default: 50 }

  schemas:
    Invoice:
      type: object
      properties:
        id: { type: string }
        number: { type: string }
        customerId: { type: string }
        date: { type: string, format: date }
        dueDate: { type: string, format: date }
        currency: { type: string, default: SAR }
        subtotal: { type: number, format: decimal }
        taxAmount: { type: number, format: decimal }
        totalAmount: { type: number, format: decimal }
        status: { type: string }
        zatcaStatus: { type: string }
        zatcaQr: { type: string }
        lines:
          type: array
          items:
            $ref: '#/components/schemas/InvoiceLine'
    InvoiceLine:
      type: object
      properties:
        productId: { type: string }
        description: { type: string }
        qty: { type: number }
        unitPrice: { type: number }
        discount: { type: number }
        taxRate: { type: number }
        lineTotal: { type: number }
    InvoiceCreateRequest:
      type: object
      required: [customerId, lines]
      properties:
        customerId: { type: string }
        date: { type: string, format: date }
        dueDate: { type: string, format: date }
        currency: { type: string }
        lines:
          type: array
          minItems: 1
          items:
            $ref: '#/components/schemas/InvoiceLine'
    InvoiceResponse:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/Invoice'
    InvoiceListResponse:
      type: object
      properties:
        data:
          type: array
          items: { $ref: '#/components/schemas/Invoice' }
        pagination: { $ref: '#/components/schemas/Pagination' }
    Pagination:
      type: object
      properties:
        page: { type: integer }
        pageSize: { type: integer }
        total: { type: integer }
        totalPages: { type: integer }
    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code: { type: string }
            message: { type: string }
            messageAr: { type: string }
            field: { type: string }
            details: { type: array }
```

---

## 3. Endpoint Catalog (per Module)

### 3.1 Accounting & GL
- `GET /api/accounting/coa` — Chart of accounts
- `POST /api/accounting/coa` — Create account
- `POST /api/accounting/coa/reset-to-socpa` — Reset to SOCPA template
- `GET /api/accounting/journal` — JE list
- `POST /api/accounting/journal` — Create JE
- `POST /api/accounting/journal/:id/post` — Post JE
- `POST /api/accounting/journal/:id/reverse` — Reverse JE
- `GET /api/accounting/trial-balance` — TB by period
- `GET /api/accounting/gl-inquiry` — GL by account
- `POST /api/accounting/period-close/:periodId/start` — Start close
- `POST /api/accounting/period-close/:periodId/lock` — Lock period
- `POST /api/accounting/year-end/:fiscalYearId/run` — Run year-end
- `GET /api/accounting/budgets` / `POST` / `:id/check`
- `GET /api/accounting/cost-allocation/rules` / `POST` / `run`
- `POST /api/accounting/recurring-journals/run`
- `GET /api/accounting/fx-revaluation` / `POST` to run
- `GET /api/accounting/multi-book` — Books list
- `POST /api/accounting/consolidation/:groupId/run`
- `POST /api/accounting/intercompany/auto-mirror`
- `GET /api/accounting/copa/query`
- `GET /api/accounting/leases` / `POST` / `:id/post-monthly`
- `GET /api/accounting/revenue-recognition/schedule` / `POST recognize`

### 3.2 Fixed Assets
- `GET /api/assets` / `POST`
- `POST /api/assets/:id/depreciate`
- `POST /api/assets/:id/dispose`
- `POST /api/assets/cwip/:id/capitalize`
- `GET /api/assets/depreciation-schedule`

### 3.3 AR
- `GET /api/sales/invoices` / `POST`
- `POST /api/sales/invoices/:id/post`
- `GET /api/sales/payments` / `POST`
- `POST /api/sales/payments/:id/apply` (FIFO/manual)
- `GET /api/ar/aging`
- `GET /api/ar/customer-statements/:customerId`
- `POST /api/ar/customer-statements/bulk-send`
- `GET /api/ar/dunning/campaigns` / `POST`
- `POST /api/ar/dunning/run`
- `POST /api/ar/credit-check/:customerId`
- `GET /api/ar/cash-application/inbox`
- `POST /api/ar/cash-application/:bankLineId/apply`

### 3.4 AP
- `GET /api/purchases/requisitions` / `POST`
- `POST /api/purchases/requisitions/:id/submit`
- `POST /api/purchases/requisitions/:id/approve`
- `GET /api/purchases/rfq` / `POST`
- `POST /api/purchases/rfq/:id/award`
- `GET /api/purchases/po` / `POST`
- `POST /api/purchases/po/:id/send-to-vendor`
- `GET /api/purchases/grn` / `POST`
- `POST /api/purchases/grn/:id/complete`
- `GET /api/purchases/invoices` / `POST`
- `POST /api/purchases/three-way-match/run-bulk`
- `POST /api/purchases/three-way-match/:id/resolve`
- `GET /api/payments/runs` / `POST`
- `POST /api/payments/runs/:id/propose`
- `POST /api/payments/runs/:id/approve`
- `POST /api/payments/runs/:id/generate-files`
- `GET /api/wht/transactions` / `POST`
- `GET /api/wht/forms` / `POST` / `:id/upload-zatca`

### 3.5 Inventory
- `GET /api/inventory/products` / `POST`
- `GET /api/inventory/stock-balances`
- `GET /api/inventory/stock-movements`
- `POST /api/inventory/adjustments`
- `POST /api/inventory/transfers`
- `GET /api/inventory/lots` / `POST`
- `POST /api/inventory/stocktake` / `:id/post-counts`
- `GET /api/inventory/reorder/recommendations`
- `POST /api/inventory/reorder/auto-create-pr`
- `GET /api/reports/inventory-valuation`
- `GET /api/inventory/asn` / `POST` / `:id/receive`

### 3.6 Manufacturing
- `GET /api/manufacturing/bom` / `POST`
- `POST /api/manufacturing/bom/:id/explode`
- `GET /api/manufacturing/routings` / `POST`
- `GET /api/manufacturing/mo` / `POST`
- `POST /api/manufacturing/mo/:id/release`
- `POST /api/manufacturing/mo/:id/operation-report`
- `POST /api/manufacturing/mo/:id/complete`
- `GET /api/manufacturing/mrp/run`
- `GET /api/manufacturing/mps/horizon`
- `POST /api/manufacturing/aps/schedule`
- `GET /api/quality/inspections` / `POST`
- `POST /api/quality/ncr/:id/capa`
- `GET /api/manufacturing/subcontracting/orders`

### 3.7 Sales / O2C
- `GET /api/sales-orders` / `POST`
- `POST /api/sales-orders/:id/check-atp`
- `POST /api/sales-orders/:id/release`
- `GET /api/quotes` / `POST`
- `POST /api/quotes/:id/convert-to-order`
- `GET /api/cpq/calculate`
- `GET /api/contracts` / `POST`
- `POST /api/contracts/:id/complete-milestone`
- `GET /api/sales/commission/records`
- `POST /api/sales/commission/payouts/run`
- `GET /api/sales/forecast`
- `GET /api/delivery-notes` / `POST` / `:id/ship`

### 3.8 CRM
- `GET /api/crm/leads` / `POST`
- `POST /api/crm/leads/:id/convert`
- `GET /api/crm/opportunities` / `POST`
- `PATCH /api/crm/opportunities/:id` (move stage)
- `GET /api/crm/customer360/:customerId`
- `GET /api/crm/activities` / `POST`
- `GET /api/crm/campaigns` / `POST`
- `POST /api/crm/campaigns/:id/launch`
- `GET /api/crm/tickets` / `POST`
- `GET /api/crm/nps/responses`

### 3.9 POS
- `POST /api/pos/sessions/open`
- `POST /api/pos/sessions/:id/close`
- `POST /api/pos/sessions/:id/cash-movement`
- `POST /api/pos/sales` (offline-friendly via Idempotency-Key)
- `POST /api/pos/refunds`
- `GET /api/pos/products/search`
- `POST /api/pos/coupons/validate`
- `POST /api/pos/loyalty/redeem`
- `POST /api/pos/payments/mada/initiate`

### 3.10 HR
- `GET /api/hr/employees` / `POST`
- `GET /api/hr/positions` / `POST`
- `GET /api/hr/contracts` / `POST`
- `POST /api/hr/contracts/:id/submit-mudad`
- `GET /api/hr/documents/expiring`
- `GET /api/hr/onboarding/:empId`
- `POST /api/hr/onboarding/:empId/complete-task`
- `GET /api/hr/recruitment/jobs` / `POST`
- `GET /api/hr/performance/cycles` / `POST`
- `POST /api/hr/performance/appraisals/:id/finalize`
- `GET /api/hr/lms/courses` / `POST`
- `POST /api/hr/lms/enrollments`
- `GET /api/hr/succession/talent-pool`

### 3.11 Attendance & Leave
- `GET /api/attendance/logs`
- `POST /api/attendance/clock-in`
- `POST /api/attendance/clock-out`
- `POST /api/attendance/sync-device`
- `GET /api/leaves/requests` / `POST`
- `POST /api/leaves/requests/:id/approve` / `reject`
- `GET /api/leaves/balance/:empId`
- `GET /api/timesheets` / `POST`

### 3.12 Payroll
- `GET /api/payroll/runs` / `POST`
- `POST /api/payroll/runs/:id/calculate`
- `POST /api/payroll/runs/:id/approve`
- `POST /api/payroll/runs/:id/post` (post to GL)
- `GET /api/payroll/payslips/:empId`
- `POST /api/payroll/wps/generate-sif`
- `POST /api/payroll/eos/calculate/:empId`
- `POST /api/payroll/loans` / `:id/payoff`
- `POST /api/payroll/provisions/run`

### 3.13 Treasury / Banks
- `GET /api/banks/accounts` / `POST`
- `POST /api/banks/statements/upload` (MT940/CSV)
- `POST /api/banks/feed/sync` (open banking)
- `GET /api/banks/recon/exceptions`
- `POST /api/banks/recon/match`
- `GET /api/treasury/cash-position`
- `GET /api/treasury/cash-flow-forecast`
- `GET /api/treasury/petty-cash` / `POST`
- `POST /api/treasury/expense-reports`
- `GET /api/treasury/checks` / `POST`
- `POST /api/treasury/lc` / `POST /api/treasury/bg`

### 3.14 Saudi Compliance
- `POST /api/zatca/invoices/:id/clear`
- `POST /api/zatca/onboard`
- `GET /api/gosi/contributions/:period`
- `POST /api/gosi/upload/:runId`
- `POST /api/mudad/contracts/submit`
- `GET /api/mudad/wps-status`
- `POST /api/qiwa/contracts/attest`
- `GET /api/qiwa/nitaqat`
- `GET /api/zakat/assessments` / `POST`
- `POST /api/wht/forms/:id/upload-zatca`
- `POST /api/pdpl/dsr` / `POST /api/pdpl/breach`

### 3.15 Reporting
- `GET /api/reports/financial-statements/:type` (BS/IS/CF/EQUITY)
- `POST /api/reports/financial-statements/snapshot`
- `GET /api/reports/aging?type=AR|AP`
- `GET /api/reports/inventory-valuation`
- `GET /api/reports/zatca-vat`
- `GET /api/reports/zakat`
- `GET /api/reports/wht`
- `GET /api/reports/payroll-summary`
- `GET /api/reports/sales-by-product` / `by-customer` / `by-region`
- `POST /api/reports/custom/run`
- `POST /api/reports/scheduled/run`
- `GET /api/reports/exports/:id` (download)

### 3.16 Platform
- `GET /api/admin/audit-logs`
- `GET /api/admin/users` / `POST` / `:id/permissions`
- `GET /api/admin/api-keys` / `POST` / `:id/revoke`
- `GET /api/admin/webhooks` / `POST`
- `POST /api/admin/backups/now`
- `GET /api/admin/backups` / `:id/restore`
- `GET /api/admin/llm-costs`
- `POST /api/approvals/:id/decide`
- `POST /api/notifications/:id/mark-read`
- `POST /api/dms/upload` / `GET /api/dms/:id`
- `GET /api/search?q=` (global)
- `POST /api/nlq/query`
- `POST /api/ai-cfo/chat`

### 3.17 Master / Tenant
- `POST /api/master/tenants` (create)
- `POST /api/master/tenants/:id/suspend` / `activate` / `delete`
- `POST /api/master/migrations/apply-all`

### 3.18 Webhooks (Inbound)
- `POST /api/webhooks/zatca/clearance`
- `POST /api/webhooks/salla/order-created`
- `POST /api/webhooks/shopify/orders`
- `POST /api/webhooks/payment-gateway/:provider`
- `POST /api/webhooks/sms-delivery`

---

## 4. WebSocket / Real-time

- `WSS /api/realtime` (Socket.IO or native)
- Channels:
  - `tenant:<id>:notifications` — in-app notifications
  - `tenant:<id>:approval` — approval queue updates
  - `tenant:<id>:pos:<sessionId>` — POS session events
  - `tenant:<id>:dashboard` — KPI updates

---

## 5. Webhook Outbound Events

| Event | Triggered When |
|-------|---------------|
| `invoice.created` | Sales invoice DRAFT created |
| `invoice.posted` | Sales invoice posted to GL |
| `invoice.zatca_cleared` | ZATCA accepted |
| `payment.received` | Customer payment received |
| `payment.applied` | Payment applied to invoice(s) |
| `order.shipped` | Sales order delivery sent |
| `order.delivered` | Sales order delivery confirmed |
| `vendor_invoice.posted` | Purchase invoice posted |
| `vendor_payment.run_executed` | Payment run completed |
| `inventory.low_stock` | Reorder threshold breached |
| `manufacturing.mo_completed` | MO closed |
| `employee.contract_expired` | EmployeeContract expiry |
| `compliance.nitaqat_band_changed` | Qiwa band degraded |
| `compliance.pdpl_breach_detected` | Breach detected |

Payload format:
```json
{
  "id": "evt_abc123",
  "tenantId": "ten_xyz",
  "event": "invoice.posted",
  "createdAt": "2026-05-09T12:34:56Z",
  "data": { "invoiceId": "...", "totalAmount": 1500, "currency": "SAR" }
}
```

Headers:
```
X-Namasoft-Signature: sha256=<hex>
X-Namasoft-Event: invoice.posted
X-Namasoft-Delivery: dlv_abc123
```

Retry: 5 attempts with exponential backoff (1m, 5m, 30m, 3h, 12h).

---

## 6. Rate Limits

| Plan | Req/min | Burst | AI tokens/day |
|------|---------|-------|---------------|
| Trial | 60 | 100 | 10K |
| Standard | 300 | 600 | 100K |
| Pro | 1000 | 2000 | 500K |
| Enterprise | Custom | Custom | Custom |

Headers in response:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 287
X-RateLimit-Reset: 1714478400
```

---

## 7. SDKs (planned)

- **TypeScript:** `@namasoft/sdk` — auto-generated from OpenAPI
- **Python:** `namasoft-python`
- **PHP:** `namasoft-php` (for Salla/Magento integrations)
- **C#:** `Namasoft.Sdk` (for Windows enterprise)

---

## 8. Documentation Hosting

- **Public:** `developers.namasoft.sa` powered by Stoplight or Redocly
- **Internal:** `/api/openapi/spec.json` exposes live spec from `openapi.ts`

---

## 9. API Versioning Strategy

- **Major changes:** new version (`X-API-Version: 2027-01`)
- **Minor:** backward-compatible (add fields, optional params)
- **Deprecation:** 6 months notice via `Sunset` header + email
- Old versions supported 24 months after sunset announcement

---

## 10. Per-Module OpenAPI Files

Will be created per-module in `BUILD_PACK/openapi/`:
- `accounting.yaml`
- `ar.yaml`
- `ap.yaml`
- `inventory.yaml`
- `manufacturing.yaml`
- `sales.yaml`
- `crm.yaml`
- `pos.yaml`
- `hr.yaml`
- `payroll.yaml`
- `treasury.yaml`
- `compliance.yaml`
- `reports.yaml`
- `platform.yaml`

Bundle into single `openapi/full.yaml` via `redocly bundle`.
