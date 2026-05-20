# Database Map

# Project Brain

Generated: 2026-05-18 02:34:44 +03:00

Scan facts:
- API routes: 850
- Prisma models: 609
- Prisma enums: 2
- Pages: 492
- Tests: 83
- Graphify files: 4576
- Graphify words: 6562824
- Sensitive skipped by graphify: 14
- graph.html: 27.75 MB, updated 05/18/2026 02:21:51
- graph.json: 29.84 MB, updated 05/18/2026 02:21:48

## Executive Overview

Nama Invest / 
amaweb is a large Multi-Tenant SaaS ERP + POS + Electron Desktop + PWA repository. The stack detected from code/config includes Next.js, React, Prisma, PostgreSQL, TypeScript, Electron, Redis/BullMQ patterns, Sentry, Zod, and Saudi compliance/ZATCA modules.

## Schema Source

- Main schema: prisma/schema.prisma
- Generated complete model inventory: [_PRISMA_MODEL_INVENTORY.md](./_PRISMA_MODEL_INVENTORY.md)

## What Is Documented

The generated inventory lists every detected Prisma model with:

- field count
- tenantId presence
- status-like fields
- Decimal/financial precision fields
- relation count
- unique/index directive counts
- @@map table name when present
- static risk flags

## Model Inventory

| Model | Fields | tenantId | Status fields | Decimal fields | Relations | Unique | Indexes | Map | Risks |
|---|---:|---|---|---:|---:|---:|---:|---|---|
| $name | 60 | NO | - | 0 | 11 | 1 | 0 | $mapValue | no tenantId or system/master model; high relation coupling |
| $name | 11 | YES | - | 0 | 1 | 0 | 2 | $mapValue | - |
| $name | 14 | YES | - | 0 | 1 | 0 | 3 | $mapValue | - |
| $name | 17 | YES | - | 0 | 1 | 1 | 2 | $mapValue | - |
| $name | 18 | YES | - | 0 | 0 | 0 | 1 | $mapValue | - |
| $name | 13 | YES | status | 0 | 1 | 0 | 2 | $mapValue | - |
| $name | 7 | YES | - | 0 | 1 | 1 | 1 | $mapValue | - |
| $name | 10 | YES | - | 0 | 1 | 1 | 0 | $mapValue | - |
| $name | 6 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 5 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 58 | YES | - | 5 | 4 | 1 | 5 | $mapValue | financial precision fields |
| $name | 19 | YES | - | 8 | 4 | 1 | 0 | $mapValue | financial precision fields |
| $name | 110 | YES | status | 3 | 5 | 1 | 4 | $mapValue | financial precision fields |
| $name | 15 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 14 | YES | - | 1 | 4 | 1 | 1 | $mapValue | financial precision fields |
| $name | 54 | YES | status, zatcaStatus | 15 | 8 | 0 | 13 | $mapValue | financial precision fields |
| $name | 19 | YES | - | 7 | 4 | 0 | 1 | $mapValue | financial precision fields |
| $name | 26 | YES | zatcaStatus, status | 4 | 2 | 0 | 1 | $mapValue | financial precision fields |
| $name | 16 | YES | - | 7 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 30 | YES | status | 3 | 7 | 0 | 2 | $mapValue | financial precision fields |
| $name | 15 | YES | - | 7 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 37 | YES | status, receiptStatus | 13 | 5 | 0 | 5 | $mapValue | financial precision fields |
| $name | 15 | YES | - | 7 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 21 | YES | zatcaStatus | 5 | 2 | 0 | 2 | $mapValue | financial precision fields |
| $name | 14 | YES | - | 7 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 18 | YES | - | 1 | 4 | 0 | 4 | $mapValue | financial precision fields |
| $name | 13 | YES | - | 1 | 3 | 0 | 2 | $mapValue | financial precision fields |
| $name | 13 | YES | - | 1 | 2 | 0 | 4 | $mapValue | financial precision fields |
| $name | 5 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 18 | YES | - | 0 | 1 | 0 | 4 | $mapValue | - |
| $name | 63 | YES | maritalStatus, mudadStatus | 7 | 9 | 1 | 1 | $mapValue | financial precision fields; high relation coupling |
| $name | 8 | YES | - | 0 | 1 | 0 | 1 | $mapValue | - |
| $name | 16 | YES | - | 12 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 17 | YES | status | 1 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 3 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | - | 1 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 13 | YES | status | 3 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 22 | YES | - | 1 | 3 | 0 | 1 | $mapValue | financial precision fields |
| $name | 29 | YES | status | 8 | 4 | 0 | 9 | $mapValue | financial precision fields |
| $name | 31 | YES | - | 12 | 6 | 0 | 5 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 8 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 5 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 6 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 17 | YES | - | 10 | 0 | 0 | 3 | $mapValue | financial precision fields |
| $name | 7 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 9 | YES | - | 0 | 0 | 1 | 1 | $mapValue | - |
| $name | 13 | YES | status | 0 | 0 | 1 | 1 | $mapValue | - |
| $name | 8 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 9 | YES | - | 0 | 1 | 1 | 0 | $mapValue | - |
| $name | 14 | YES | status | 5 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 5 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | status | 6 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 1 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 17 | YES | - | 1 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 13 | YES | - | 3 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 4 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | status | 6 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 26 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 17 | YES | status | 8 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 14 | YES | - | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 13 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 1 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 20 | YES | - | 16 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 13 | YES | - | 13 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 23 | YES | status | 8 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 14 | YES | status | 6 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 14 | YES | - | 6 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 4 | 1 | 1 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 2 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 3 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 1 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 11 | YES | status | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 22 | YES | status | 7 | 3 | 1 | 0 | $mapValue | financial precision fields |
| $name | 32 | YES | - | 4 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | - | 1 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 21 | YES | status | 6 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 16 | YES | - | 0 | 1 | 1 | 0 | $mapValue | - |
| $name | 12 | YES | status | 5 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 16 | YES | - | 2 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 6 | YES | - | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 4 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | status | 0 | 2 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 16 | YES | - | 3 | 4 | 0 | 0 | $mapValue | financial precision fields |
| $name | 17 | YES | status | 1 | 3 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | status | 6 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | status | 5 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 19 | YES | status | 3 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 3 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | status | 0 | 2 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | - | 1 | 3 | 0 | 0 | $mapValue | financial precision fields |
| $name | 18 | YES | status | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 4 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 17 | YES | status | 1 | 1 | 1 | 2 | $mapValue | financial precision fields |
| $name | 9 | YES | status | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 13 | YES | status | 6 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | status | 1 | 1 | 1 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | status | 1 | 1 | 1 | 0 | $mapValue | financial precision fields |
| $name | 20 | YES | status | 6 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 15 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 17 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 10 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 13 | YES | status | 4 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 14 | YES | status | 2 | 1 | 1 | 0 | $mapValue | financial precision fields |
| $name | 13 | YES | status | 0 | 2 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 1 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | status | 0 | 2 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 3 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 18 | YES | status | 2 | 4 | 0 | 1 | $mapValue | financial precision fields |
| $name | 12 | YES | - | 5 | 3 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 13 | YES | - | 0 | 2 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | status | 0 | 2 | 0 | 0 | $mapValue | - |
| $name | 13 | YES | status | 2 | 2 | 1 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 1 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 13 | YES | status | 2 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 4 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 9 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 2 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | - | 6 | 3 | 0 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | status | 1 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 4 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 2 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | status | 0 | 2 | 1 | 0 | $mapValue | - |
| $name | 9 | YES | status | 4 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 20 | YES | status, paymentStatus, subscriptionStatus | 0 | 0 | 3 | 0 | $mapValue | - |
| $name | 32 | YES | status | 0 | 1 | 1 | 0 | $mapValue | - |
| $name | 10 | YES | - | 0 | 2 | 2 | 0 | $mapValue | - |
| $name | 5 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | status | 0 | 1 | 1 | 0 | $mapValue | - |
| $name | 8 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 11 | YES | status | 0 | 1 | 1 | 0 | $mapValue | - |
| $name | 17 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 14 | YES | status | 0 | 1 | 0 | 1 | $mapValue | - |
| $name | 23 | YES | status | 0 | 1 | 1 | 2 | $mapValue | - |
| $name | 15 | YES | - | 4 | 2 | 1 | 1 | $mapValue | financial precision fields |
| $name | 18 | YES | - | 0 | 1 | 0 | 2 | $mapValue | - |
| $name | 14 | YES | status | 0 | 0 | 0 | 1 | $mapValue | - |
| $name | 18 | YES | status | 6 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 17 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 18 | YES | - | 2 | 1 | 1 | 2 | $mapValue | financial precision fields |
| $name | 18 | YES | - | 2 | 0 | 1 | 2 | $mapValue | financial precision fields |
| $name | 20 | YES | status | 0 | 2 | 0 | 2 | $mapValue | - |
| $name | 12 | YES | status | 3 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 16 | YES | status | 6 | 2 | 1 | 2 | $mapValue | financial precision fields |
| $name | 15 | YES | - | 1 | 2 | 0 | 2 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 1 | 1 | 0 | 1 | $mapValue | financial precision fields |
| $name | 11 | YES | status | 0 | 0 | 0 | 1 | $mapValue | - |
| $name | 11 | YES | status | 1 | 1 | 0 | 1 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 4 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | status | 1 | 1 | 0 | 1 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 4 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 1 | 1 | 0 | 1 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 1 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 14 | YES | - | 0 | 0 | 0 | 3 | $mapValue | - |
| $name | 16 | YES | - | 0 | 0 | 1 | 1 | $mapValue | - |
| $name | 8 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | status | 6 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | status | 1 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | - | 1 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 4 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | status | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 2 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 6 | YES | - | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 39 | YES | status, disputeStatus, promiseStatus | 14 | 4 | 0 | 5 | $mapValue | financial precision fields |
| $name | 28 | YES | - | 12 | 2 | 0 | 4 | $mapValue | financial precision fields |
| $name | 32 | YES | status | 4 | 1 | 1 | 3 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | - | 0 | 1 | 0 | 1 | $mapValue | - |
| $name | 10 | YES | - | 0 | 0 | 1 | 1 | $mapValue | - |
| $name | 11 | YES | - | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 0 | 0 | 1 | 1 | $mapValue | - |
| $name | 7 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 31 | YES | validationStatus, reconStatus | 8 | 1 | 0 | 3 | $mapValue | financial precision fields |
| $name | 43 | YES | matchStatus | 8 | 2 | 0 | 5 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 2 | 1 | 0 | 1 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 0 | 0 | 0 | 1 | $mapValue | - |
| $name | 10 | YES | - | 0 | 1 | 1 | 0 | $mapValue | - |
| $name | 19 | YES | - | 2 | 1 | 1 | 1 | $mapValue | financial precision fields |
| $name | 24 | YES | status | 10 | 1 | 2 | 1 | $mapValue | financial precision fields |
| $name | 13 | YES | - | 0 | 1 | 1 | 2 | $mapValue | - |
| $name | 12 | YES | status | 2 | 0 | 0 | 2 | $mapValue | financial precision fields |
| $name | 9 | YES | status | 2 | 0 | 0 | 1 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 14 | YES | - | 10 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 83 | YES | status, statusChangedAt, lastPhysicalCountStatus | 28 | 5 | 2 | 6 | $mapValue | financial precision fields |
| $name | 16 | YES | - | 2 | 2 | 1 | 0 | $mapValue | financial precision fields |
| $name | 14 | YES | - | 10 | 1 | 0 | 1 | $mapValue | financial precision fields |
| $name | 19 | YES | - | 10 | 1 | 0 | 1 | $mapValue | financial precision fields |
| $name | 20 | YES | - | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 18 | YES | - | 4 | 1 | 0 | 2 | $mapValue | financial precision fields |
| $name | 18 | YES | status | 6 | 1 | 1 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 2 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | - | 8 | 1 | 0 | 1 | $mapValue | financial precision fields |
| $name | 14 | YES | fromStatus, toStatus | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 0 | 1 | 0 | 1 | $mapValue | - |
| $name | 15 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 10 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 11 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 14 | YES | - | 6 | 1 | 2 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 11 | YES | status | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 6 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 5 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 8 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 6 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 6 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 8 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 26 | YES | status | 22 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 15 | YES | status | 2 | 1 | 1 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | paymentStatus | 8 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 20 | YES | status | 22 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | - | 3 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 27 | YES | matchStatus | 24 | 2 | 1 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | - | 10 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 6 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 6 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 8 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | status | 0 | 3 | 0 | 0 | $mapValue | - |
| $name | 16 | YES | status | 0 | 3 | 1 | 0 | $mapValue | - |
| $name | 59 | YES | status | 18 | 1 | 1 | 3 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 6 | 1 | 1 | 0 | $mapValue | financial precision fields |
| $name | 20 | YES | - | 18 | 1 | 0 | 3 | $mapValue | financial precision fields |
| $name | 21 | YES | - | 12 | 1 | 0 | 1 | $mapValue | financial precision fields |
| $name | 15 | YES | - | 10 | 1 | 1 | 0 | $mapValue | financial precision fields |
| $name | 14 | YES | status | 4 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 15 | YES | - | 6 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 4 | 1 | 0 | 1 | $mapValue | financial precision fields |
| $name | 30 | YES | status, approvalStatus | 12 | 3 | 1 | 2 | $mapValue | financial precision fields |
| $name | 32 | YES | status | 20 | 1 | 1 | 3 | $mapValue | financial precision fields |
| $name | 14 | YES | - | 2 | 1 | 1 | 0 | $mapValue | financial precision fields |
| $name | 13 | YES | status | 4 | 1 | 0 | 3 | $mapValue | financial precision fields |
| $name | 14 | YES | status | 2 | 1 | 1 | 0 | $mapValue | financial precision fields |
| $name | 16 | YES | - | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 14 | YES | - | 4 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | - | 2 | 0 | 0 | 1 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 6 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 8 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 38 | YES | - | 8 | 0 | 1 | 1 | $mapValue | financial precision fields |
| $name | 12 | YES | status | 4 | 1 | 1 | 1 | $mapValue | financial precision fields |
| $name | 27 | YES | status | 6 | 3 | 1 | 3 | $mapValue | financial precision fields |
| $name | 16 | YES | status | 0 | 1 | 0 | 2 | $mapValue | - |
| $name | 18 | YES | status | 2 | 1 | 0 | 2 | $mapValue | financial precision fields |
| $name | 15 | YES | - | 8 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 15 | YES | status | 6 | 2 | 0 | 2 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 0 | 1 | 0 | 1 | $mapValue | - |
| $name | 11 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 11 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 14 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 39 | YES | status | 8 | 0 | 1 | 2 | $mapValue | financial precision fields |
| $name | 38 | YES | status | 10 | 2 | 0 | 3 | $mapValue | financial precision fields |
| $name | 25 | YES | - | 2 | 1 | 0 | 2 | $mapValue | financial precision fields |
| $name | 15 | YES | status | 0 | 1 | 0 | 2 | $mapValue | - |
| $name | 25 | YES | - | 0 | 1 | 1 | 1 | $mapValue | - |
| $name | 14 | YES | - | 0 | 0 | 0 | 2 | $mapValue | - |
| $name | 13 | YES | status | 8 | 0 | 0 | 2 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 4 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 17 | YES | - | 6 | 3 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | status | 4 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 7 | YES | - | 6 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 8 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 8 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 5 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | status | 0 | 2 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 2 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 6 | YES | - | 0 | 1 | 1 | 0 | $mapValue | - |
| $name | 10 | YES | - | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 8 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | status | 6 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 26 | YES | - | 0 | 4 | 1 | 1 | $mapValue | - |
| $name | 15 | YES | - | 0 | 3 | 1 | 1 | $mapValue | - |
| $name | 13 | YES | - | 2 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 14 | YES | - | 2 | 2 | 0 | 1 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 12 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 6 | YES | - | 0 | 1 | 1 | 0 | $mapValue | - |
| $name | 14 | YES | - | 12 | 1 | 1 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 18 | YES | status | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 21 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 16 | YES | status | 2 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 13 | YES | - | 0 | 2 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 13 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | status | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 15 | YES | status | 8 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 1 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 15 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 2 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 21 | YES | - | 3 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 16 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | - | 3 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 17 | YES | status | 2 | 3 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | status | 1 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 4 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 32 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 35 | YES | status | 8 | 2 | 0 | 4 | $mapValue | financial precision fields |
| $name | 18 | YES | status | 0 | 0 | 1 | 1 | $mapValue | - |
| $name | 12 | YES | - | 0 | 1 | 0 | 2 | $mapValue | - |
| $name | 10 | YES | - | 2 | 0 | 0 | 1 | $mapValue | financial precision fields |
| $name | 12 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | - | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 9 | YES | status | 1 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 7 | YES | - | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 7 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 13 | YES | status | 2 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 14 | YES | status | 2 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 7 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 10 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 9 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 8 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 9 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 8 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 6 | YES | status | 1 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 6 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 6 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 6 | YES | - | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 6 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 5 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 6 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | - | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 0 | 1 | 0 | 1 | $mapValue | - |
| $name | 14 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | - | 8 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 6 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 14 | YES | status | 0 | 3 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 10 | YES | status | 0 | 2 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 1 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | status | 0 | 2 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 25 | YES | status | 20 | 0 | 0 | 1 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 2 | 1 | 0 | 1 | $mapValue | financial precision fields |
| $name | 13 | YES | - | 2 | 0 | 0 | 2 | $mapValue | financial precision fields |
| $name | 14 | YES | qiwaStatus | 2 | 1 | 1 | 2 | $mapValue | financial precision fields |
| $name | 14 | YES | status | 0 | 0 | 0 | 2 | $mapValue | - |
| $name | 11 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 16 | YES | status | 0 | 0 | 0 | 2 | $mapValue | - |
| $name | 9 | YES | - | 2 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | statusCode | 0 | 1 | 0 | 1 | $mapValue | - |
| $name | 8 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 6 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 11 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 13 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 4 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 13 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 5 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 0 | 0 | 0 | 1 | $mapValue | - |
| $name | 10 | YES | - | 0 | 0 | 0 | 1 | $mapValue | - |
| $name | 11 | YES | - | 4 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | status | 1 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 1 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 1 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | status | 1 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 14 | YES | status | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 13 | YES | status | 0 | 2 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 13 | YES | - | 4 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 14 | YES | - | 2 | 3 | 0 | 0 | $mapValue | financial precision fields |
| $name | 17 | YES | status | 4 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 19 | YES | status | 0 | 1 | 1 | 2 | $mapValue | - |
| $name | 8 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 11 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 11 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 13 | YES | - | 6 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 1 | 2 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | status | 1 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 11 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 13 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 24 | YES | status, paymentStatus | 8 | 1 | 1 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 3 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 11 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 11 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 13 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 14 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | status | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 12 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 13 | YES | status | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 14 | YES | status | 6 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 6 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 15 | YES | status | 6 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 2 | 1 | 0 | 0 | $mapValue | financial precision fields |
| $name | 20 | YES | status | 2 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 15 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 12 | YES | - | 2 | 0 | 0 | 1 | $mapValue | financial precision fields |
| $name | 15 | YES | - | 0 | 0 | 0 | 2 | $mapValue | - |
| $name | 6 | YES | - | 2 | 0 | 0 | 1 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 6 | 0 | 0 | 1 | $mapValue | financial precision fields |
| $name | 6 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 14 | YES | matchStatus | 0 | 0 | 0 | 1 | $mapValue | - |
| $name | 5 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 15 | YES | status | 4 | 0 | 0 | 1 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | - | 0 | 0 | 0 | 1 | $mapValue | - |
| $name | 11 | YES | - | 0 | 1 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | - | 4 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 0 | 0 | 1 | 1 | $mapValue | - |
| $name | 9 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 11 | YES | - | 0 | 0 | 0 | 2 | $mapValue | - |
| $name | 12 | YES | - | 0 | 1 | 0 | 3 | $mapValue | - |
| $name | 7 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 10 | YES | - | 2 | 1 | 1 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 0 | 1 | 0 | 1 | $mapValue | - |
| $name | 18 | YES | status | 10 | 0 | 0 | 1 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 10 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 7 | YES | - | 2 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 11 | YES | status | 10 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 5 | NO | - | 0 | 0 | 1 | 0 | $mapValue | no tenantId or system/master model |
| $name | 15 | YES | documentationStatus | 4 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 9 | NO | - | 0 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model |
| $name | 8 | NO | - | 0 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model |
| $name | 7 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 9 | NO | - | 6 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model; financial precision fields |
| $name | 7 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 7 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 6 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 7 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 6 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 4 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 7 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 8 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 6 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 6 | YES | - | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 6 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 7 | YES | - | 4 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 7 | YES | status | 4 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 7 | YES | - | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 7 | YES | - | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 7 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 6 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 7 | NO | - | 8 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model; financial precision fields |
| $name | 5 | NO | - | 2 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model; financial precision fields |
| $name | 8 | YES | status | 6 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 5 | NO | - | 2 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model; financial precision fields |
| $name | 8 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | approvalStatus | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 12 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 6 | NO | - | 2 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model; financial precision fields |
| $name | 6 | YES | - | 2 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 7 | YES | - | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | status | 6 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 7 | NO | status | 4 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model; financial precision fields |
| $name | 5 | NO | - | 0 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model |
| $name | 8 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 6 | NO | - | 0 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model |
| $name | 5 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 10 | YES | - | 6 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | NO | - | 4 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model; financial precision fields |
| $name | 11 | YES | - | 8 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 6 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 7 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 7 | NO | - | 0 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model |
| $name | 5 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 6 | NO | - | 0 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model |
| $name | 7 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 6 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 6 | NO | - | 0 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model |
| $name | 4 | NO | - | 0 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model |
| $name | 6 | YES | status | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 7 | NO | approvalStatus | 6 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model; financial precision fields |
| $name | 7 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 6 | NO | - | 4 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model; financial precision fields |
| $name | 7 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 6 | NO | - | 2 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model; financial precision fields |
| $name | 6 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 9 | YES | - | 6 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 10 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 6 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 3 | NO | - | 0 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model |
| $name | 7 | YES | - | 2 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 6 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 6 | YES | - | 4 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 6 | 0 | 0 | 0 | $mapValue | financial precision fields |
| $name | 5 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 8 | YES | status | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 6 | NO | - | 0 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model |
| $name | 7 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 6 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 9 | YES | - | 0 | 0 | 0 | 0 | $mapValue | - |
| $name | 8 | NO | - | 0 | 0 | 0 | 0 | $mapValue | no tenantId or system/master model |
| $name | 11 | YES | status | 0 | 0 | 1 | 1 | $mapValue | - |
| $name | 18 | YES | status | 4 | 0 | 0 | 2 | $mapValue | financial precision fields |
| $name | 11 | YES | - | 2 | 0 | 0 | 3 | $mapValue | financial precision fields |
| $name | 9 | YES | status | 2 | 0 | 0 | 1 | $mapValue | financial precision fields |
| $name | 14 | YES | - | 12 | 0 | 1 | 1 | $mapValue | financial precision fields |
| $name | 14 | YES | - | 4 | 0 | 0 | 3 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 4 | 0 | 1 | 1 | $mapValue | financial precision fields |
| $name | 6 | YES | - | 4 | 0 | 1 | 0 | $mapValue | financial precision fields |
| $name | 7 | YES | - | 2 | 0 | 0 | 1 | $mapValue | financial precision fields |
| $name | 9 | YES | - | 4 | 0 | 0 | 1 | $mapValue | financial precision fields |
| $name | 10 | YES | - | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 20 | YES | - | 26 | 0 | 1 | 1 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 4 | 0 | 1 | 1 | $mapValue | financial precision fields |
| $name | 6 | YES | - | 2 | 0 | 0 | 2 | $mapValue | financial precision fields |
| $name | 8 | YES | - | 0 | 0 | 1 | 1 | $mapValue | - |
| $name | 12 | YES | status | 0 | 0 | 0 | 2 | $mapValue | - |
| $name | 9 | YES | status | 0 | 0 | 1 | 1 | $mapValue | - |
| $name | 7 | YES | status | 0 | 1 | 0 | 2 | $mapValue | - |
| $name | 19 | NO | - | 0 | 2 | 2 | 0 | $mapValue | no tenantId or system/master model |
| $name | 6 | NO | - | 0 | 0 | 1 | 0 | $mapValue | no tenantId or system/master model |
| $name | 18 | NO | - | 4 | 0 | 1 | 0 | $mapValue | no tenantId or system/master model; financial precision fields |
| $name | 14 | YES | status | 0 | 1 | 1 | 2 | $mapValue | - |
| $name | 15 | YES | status | 6 | 1 | 1 | 2 | $mapValue | financial precision fields |
| $name | 12 | NO | - | 0 | 2 | 1 | 0 | $mapValue | no tenantId or system/master model |
| $name | 5 | NO | - | 0 | 2 | 1 | 0 | $mapValue | no tenantId or system/master model |
| $name | 5 | YES | - | 0 | 1 | 1 | 0 | $mapValue | - |
| $name | 13 | YES | status | 0 | 1 | 2 | 1 | $mapValue | - |
| $name | 11 | NO | - | 0 | 1 | 0 | 2 | $mapValue | no tenantId or system/master model |
| $name | 8 | NO | status | 0 | 1 | 0 | 2 | $mapValue | no tenantId or system/master model |
| $name | 11 | YES | status | 0 | 1 | 1 | 2 | $mapValue | - |
| $name | 9 | NO | - | 0 | 2 | 0 | 0 | $mapValue | no tenantId or system/master model |
| $name | 5 | NO | - | 0 | 0 | 1 | 0 | $mapValue | no tenantId or system/master model |
| $name | 12 | YES | status | 0 | 0 | 1 | 0 | $mapValue | - |
| $name | 12 | YES | status | 0 | 0 | 1 | 1 | $mapValue | - |

## Relationship Notes

Relationships are identified through Prisma @relation counts in the inventory. Exact semantic relationship behavior must be checked in prisma/schema.prisma before changing relations, deletes, cascades, or migrations.

## Tenant Fields

Models with 	enantId = YES are tenant-scoped candidates. Models without 	enantId may be system/master tables or may require review; this brain does not assume either without code confirmation.

## Financial Fields

Models with Decimal fields are flagged because financial precision and rounding require special review.

## Missing Constraints / Risky Schemas

UNKNOWN until each model is reviewed with production requirements. Use the risk column as the starting point.
