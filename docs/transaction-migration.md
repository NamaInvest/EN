# Transaction Retry Migration Guide

Generated: 2026-05-10T19:22:33.473Z

## Overview

53 routes use `prisma.$transaction()` without retry logic.
The `withTransaction` utility has been imported into 53 of them.

## How to Migrate

Replace this pattern:
```ts
const result = await prisma.$transaction(async (tx) => {
  // your operations
});
```

With this:
```ts
const result = await withTransaction(prisma, async (tx) => {
  // your operations
}, { operationName: 'describe-what-this-does' });
```

Or the short form for simple cases:
```ts
import { atomically } from '@/lib/db/transaction';

const result = await atomically(prisma, async (tx) => {
  // your operations
}, 'operation-name');
```

## Why?

- Handles `P2034` (Prisma transaction conflict)
- Handles `40001` (PostgreSQL serialization failure)
- Handles `40P01` (Deadlock detected)
- Uses exponential backoff (100ms → 200ms → 400ms, max 2s)
- Logs retry attempts with structured context

## Routes to Migrate

Run `node scripts/deep-scan.cjs` to see current status.
