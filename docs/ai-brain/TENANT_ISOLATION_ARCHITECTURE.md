# Tenant Isolation Architecture

## Multi-Tenancy Core Philosophy
Nama Invest ERP is a multi-tenant enterprise system. Total logical separation between tenant data is critical for compliance, security, and operational integrity. Tenant isolation is enforced consistently from the routing edge down to the database schema.

## Enforcement Layers

### 1. Edge Layer (`withRoute` & Middlewares)
- **Extraction:** The `withRoute` wrapper intercepts every incoming request to extract the current context.
- **Token Primacy:** It relies primarily on the authenticated session to identify `tenantId`.
- **Header Fallback:** In headless/API contexts, the `x-tenant` header is checked and validated against the user's allowed tenants.

### 2. Route Classification
Routes are categorized into distinct execution contexts to prevent unauthorized execution:
- **`tenant` (Default):** Requires a fully resolved and authorized `tenantId`. Used for 99% of business logic (Sales, HR, Treasury).
- **`public`:** Exceptions explicitly whitelisted for non-authenticated access (e.g., login, password resets).
- **`system`:** Administrative routes that bypass specific tenant contexts but require overarching `MASTER_ADMIN` roles.
- **`webhook`:** Third-party ingress points (e.g., payment gateways) that rely on HMAC signatures rather than user tokens to resolve tenant mapping.

### 3. Application Logic & Tenant Guard
- **`requireTenantId(req)`:** An aggressive utility that enforces the presence of a tenant context. If invoked and no tenant is found, it throws an immediate architectural violation.
- **Injection Rejection:** API controllers explicitly ignore any `tenantId` property passed inside the JSON request body, preventing malicious users from targeting other tenants' records.

### 4. Database Layer
- **Mandatory `tenantId` Columns:** Every operational table in the Prisma schema includes a `tenantId` column.
- **Query Hardcoding:** All `findMany`, `update`, `delete`, and `findUnique` operations explicitly spread `{ tenantId }` into the `where` clause.
- **Foreign Key Isolation:** Cross-tenant joins are impossible by design due to compound unique constraints linking entity IDs strictly with their corresponding `tenantId`.

## Audit & Compliance
Any action attempted against an invalid or unauthorized tenant context is aggressively blocked and logged as a security event within the Application Observability stack, alerting administrators to potential lateral movement attempts.
