---
version: 1.0
last_updated: 2026-05-12
---

# OpenAPI Specifications

## استراتيجية التوليد

- **Source of truth:** Zod schemas في كل route
- **Auto-generation:** `src/lib/openapi.ts` يستخرج schemas + routes
- **Output:** `public/openapi.json` + `public/openapi.yaml`
- **UI:** Swagger UI تحت `/api-docs` (موجود)
- **Postman:** auto-import via OpenAPI URL
- **Client SDKs:** generated nightly via `openapi-generator`

## Sample Spec (Sales Invoice)

```yaml
openapi: 3.1.0
info:
  title: Namasoft ERP API
  version: 1.0.0
  description: |
    Saudi enterprise ERP system API.
    Multi-tenant. Production: https://app.namasoft.sa/api
    Sandbox: https://staging.namasoft.sa/api
  contact:
    name: API Support
    email: api@namasoft.sa
  license:
    name: Proprietary

servers:
  - url: https://app.namasoft.sa/api
    description: Production
  - url: https://staging.namasoft.sa/api
    description: Staging

security:
  - bearerAuth: []
  - apiKey: []

paths:
  /sales/invoices:
    get:
      summary: List sales invoices
      operationId: listSalesInvoices
      tags: [Sales]
      parameters:
        - name: cursor
          in: query
          schema: { type: string }
        - name: limit
          in: query
          schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
        - name: status
          in: query
          schema:
            type: string
            enum: [DRAFT, POSTED, CLEARED, PARTIALLY_PAID, PAID, DISPUTED, CANCELLED]
        - name: customerId
          in: query
          schema: { type: string }
        - name: from
          in: query
          schema: { type: string, format: date-time }
        - name: to
          in: query
          schema: { type: string, format: date-time }
      responses:
        '200':
          description: List of invoices
          content:
            application/json:
              schema:
                type: object
                required: [data, pagination]
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/SalesInvoice' }
                  pagination: { $ref: '#/components/schemas/CursorPagination' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '429': { $ref: '#/components/responses/RateLimit' }
    
    post:
      summary: Create sales invoice
      operationId: createSalesInvoice
      tags: [Sales]
      parameters:
        - name: Idempotency-Key
          in: header
          required: false
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/CreateSalesInvoiceInput' }
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema: { $ref: '#/components/schemas/SalesInvoice' }
        '422': { $ref: '#/components/responses/ValidationError' }

  /sales/invoices/{id}:
    get:
      summary: Get sales invoice
      operationId: getSalesInvoice
      tags: [Sales]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Invoice details
          content:
            application/json:
              schema: { $ref: '#/components/schemas/SalesInvoiceFull' }
        '404': { $ref: '#/components/responses/NotFound' }
    
    patch:
      summary: Update sales invoice (DRAFT only)
      operationId: updateSalesInvoice
      tags: [Sales]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/UpdateSalesInvoiceInput' }
      responses:
        '200':
          description: Updated
          content:
            application/json:
              schema: { $ref: '#/components/schemas/SalesInvoice' }
        '409':
          description: Cannot edit POSTED invoice

  /sales/invoices/{id}/post:
    post:
      summary: Post sales invoice (DRAFT → POSTED)
      operationId: postSalesInvoice
      tags: [Sales]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Posted
          content:
            application/json:
              schema: { $ref: '#/components/schemas/SalesInvoice' }

  /sales/invoices/{id}/clear-zatca:
    post:
      summary: Submit to ZATCA for clearance
      operationId: clearZatca
      tags: [Sales, ZATCA]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: ZATCA clearance result
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ZatcaClearanceResult' }

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

  schemas:
    SalesInvoice:
      type: object
      required: [id, code, customerId, invoiceDate, currency, grandTotal, status]
      properties:
        id: { type: string }
        code: { type: string, example: "INV-2026-05-0001" }
        customerId: { type: string }
        customerName: { type: string }
        invoiceDate: { type: string, format: date-time }
        dueDate: { type: string, format: date-time }
        currency: { type: string, example: "SAR" }
        fxRate: { type: number, format: float }
        subtotal: { type: number, format: float, example: 10000.0000 }
        discountTotal: { type: number, format: float }
        vatTotal: { type: number, format: float }
        whtTotal: { type: number, format: float }
        grandTotal: { type: number, format: float }
        paidAmount: { type: number, format: float }
        status:
          type: string
          enum: [DRAFT, POSTED, CLEARED, PARTIALLY_PAID, PAID, DISPUTED, CANCELLED]
        zatca:
          type: object
          properties:
            uuid: { type: string, format: uuid }
            icv: { type: integer }
            status:
              type: string
              enum: [PENDING, CLEARED, REPORTED, FAILED]
            clearedAt: { type: string, format: date-time }
            qrCode: { type: string, description: "Base64 PNG" }
        createdAt: { type: string, format: date-time }

    CreateSalesInvoiceInput:
      type: object
      required: [customerId, invoiceDate, lines]
      properties:
        customerId: { type: string }
        invoiceDate: { type: string, format: date-time }
        dueDate: { type: string, format: date-time }
        currency: { type: string, default: "SAR" }
        paymentTermsId: { type: string }
        reference: { type: string, maxLength: 100 }
        lines:
          type: array
          minItems: 1
          items:
            type: object
            required: [productId, qty, unitPrice]
            properties:
              productId: { type: string }
              qty: { type: number, exclusiveMinimum: 0 }
              unitPrice: { type: number, minimum: 0 }
              discountPct: { type: number, minimum: 0, maximum: 100 }
              vatRate: { type: number, minimum: 0, maximum: 1, default: 0.15 }
              costCenterId: { type: string }
              profitCenterId: { type: string }
              memo: { type: string }
        notes: { type: string }

    CursorPagination:
      type: object
      required: [hasMore]
      properties:
        nextCursor: { type: string, nullable: true }
        hasMore: { type: boolean }

    ProblemDetails:
      type: object
      required: [type, title, status]
      properties:
        type: { type: string, format: uri }
        title: { type: string }
        status: { type: integer }
        detail: { type: string }
        instance: { type: string }
        context: { type: object, additionalProperties: true }

    ZatcaClearanceResult:
      type: object
      properties:
        status: { type: string, enum: [CLEARED, REPORTED, FAILED] }
        uuid: { type: string, format: uuid }
        icv: { type: integer }
        clearedAt: { type: string, format: date-time }
        xml: { type: string, description: "Signed XML" }
        qrCode: { type: string, description: "Base64 PNG" }
        warnings:
          type: array
          items: { type: string }
        errors:
          type: array
          items: { type: string }

  responses:
    Unauthorized:
      description: Missing or invalid auth
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ProblemDetails' }
    Forbidden:
      description: Permission denied
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ProblemDetails' }
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ProblemDetails' }
    ValidationError:
      description: Invalid input
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ProblemDetails' }
    RateLimit:
      description: Rate limit exceeded
      headers:
        Retry-After:
          schema: { type: integer }
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ProblemDetails' }

tags:
  - name: Sales
    description: Sales invoices, orders, quotes
  - name: Procurement
    description: PRs, POs, GRNs, vendor invoices
  - name: Accounting
    description: GL, journals, period close
  - name: Treasury
    description: Banks, cash, payments
  - name: HR
    description: Employees, payroll, leaves
  - name: Inventory
    description: Stock, warehouses, movements
  - name: Manufacturing
    description: MOs, BOMs, work orders
  - name: ZATCA
    description: Saudi e-invoicing
```

## Generation Script

```typescript
// src/lib/openapi.ts (موجود, تحديث)
import { writeFileSync } from 'fs';
import { generateOpenApiDocument } from 'zod-openapi';

export async function generateOpenAPI() {
  const doc = await generateOpenApiDocument({
    info: {
      title: 'Namasoft ERP API',
      version: process.env.npm_package_version,
    },
    servers: [
      { url: 'https://app.namasoft.sa/api', description: 'Production' },
      { url: 'https://staging.namasoft.sa/api', description: 'Staging' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      },
    },
    paths: await collectRoutes(),
  });
  
  writeFileSync('public/openapi.json', JSON.stringify(doc, null, 2));
  writeFileSync('public/openapi.yaml', yaml.dump(doc));
}

// Run on `npm run build` or in CI
```

## Client SDK Generation

```bash
# nightly via GitHub Actions
openapi-generator-cli generate \
  -i https://app.namasoft.sa/api/openapi.json \
  -g typescript-fetch \
  -o packages/namasoft-sdk-ts

openapi-generator-cli generate \
  -i https://app.namasoft.sa/api/openapi.json \
  -g python \
  -o packages/namasoft-sdk-py

# Publish to npm/PyPI
```
