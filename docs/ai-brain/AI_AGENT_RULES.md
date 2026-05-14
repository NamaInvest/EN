
# AI Agent Rules
**Generated At:** 2026-05-14T08:21:09.109Z

## 1. NEVER Break Atomicity
If you modify financial code, you MUST use `prisma.$transaction` and pass the `tx` client down to sub-functions.

## 2. NEVER Modify Old Migrations
Do not edit files in `prisma/migrations` once they are applied.

## 3. ALWAYS Scan First
Run `tsc --noEmit` before declaring a task "DONE".

## 4. Tenant Isolation
Never query `findMany` across tenants without explicit Master ICE authorization.

## 5. Idempotency
Any new financial `POST` or `PUT` endpoint must be wrapped in `withIdempotency`.
