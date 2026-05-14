# Database Schema Map

## System Tables
- `IdempotencyRecord` (PENDING IMPLEMENTATION)
  - Purpose: Enterprise-grade idempotency to prevent double-posting of financial transactions.
  - Fields: `id`, `tenantId`, `key`, `endpoint`, `requestHash`, `status`, `responseCode`, `responseBody`, `lockedAt`, `expiresAt`, `createdAt`.
  - Constraints: Unique (`tenantId`, `key`).
