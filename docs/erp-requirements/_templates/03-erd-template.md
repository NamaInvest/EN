# [MODULE_NAME] — Database ERD & Prisma Schema

---

## 1. ERD Diagram

```
┌─────────────────────┐         ┌─────────────────────┐
│   ParentEntity      │         │   ChildEntity       │
├─────────────────────┤  1   N  ├─────────────────────┤
│ id        PK        │◄────────│ id        PK        │
│ tenantId  FK        │         │ tenantId  FK        │
│ code      UQ        │         │ parentId  FK        │
│ name                │         │ amount              │
│ status              │         │ ...                 │
│ createdAt           │         └─────────────────────┘
│ updatedAt           │
│ deletedAt           │
└─────────────────────┘
```

---

## 2. Prisma Schema

```prisma
// ========================================================
// [MODULE_NAME] Models
// Added: [DATE]
// Migration: [migration-name]
// ========================================================

model [EntityName] {
  id          String   @id @default(cuid())
  tenantId    String

  // Core fields
  code        String
  name        String
  description String?

  // Business fields
  amount      Decimal  @db.Decimal(18, 4)
  currency    String   @default("SAR")

  // Workflow
  status      String   @default("DRAFT") // DRAFT, SUBMITTED, APPROVED, POSTED, REVERSED
  submittedAt DateTime?
  submittedBy String?
  approvedAt  DateTime?
  approvedBy  String?
  postedAt    DateTime?
  postedBy    String?

  // Soft delete
  deletedAt   DateTime?
  deletedBy   String?

  // Audit
  createdAt   DateTime @default(now())
  createdBy   String?
  updatedAt   DateTime @updatedAt
  updatedBy   String?

  // Relations
  lines       [EntityName]Line[]
  journalEntry JournalEntry? @relation(fields: [journalEntryId], references: [id])
  journalEntryId String?

  // Indexes
  @@unique([tenantId, code])
  @@index([tenantId, status])
  @@index([tenantId, createdAt])
  @@index([tenantId, deletedAt])
  @@map("[entity_table_name]")
}

model [EntityName]Line {
  id          String   @id @default(cuid())
  tenantId    String

  parentId    String
  parent      [EntityName] @relation(fields: [parentId], references: [id], onDelete: Cascade)

  lineNumber  Int
  amount      Decimal  @db.Decimal(18, 4)
  description String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId, parentId])
  @@map("[entity_line_table_name]")
}
```

---

## 3. Migration Strategy

### Forward Migration
```sql
-- Migration: 2026XX_add_[module]_tables.sql
BEGIN;

CREATE TABLE [entity_table_name] (
  id VARCHAR(30) PRIMARY KEY,
  tenant_id VARCHAR(30) NOT NULL,
  code VARCHAR(50) NOT NULL,
  -- ...
);

CREATE UNIQUE INDEX uq_[table]_tenant_code ON [entity_table_name](tenant_id, code);
CREATE INDEX ix_[table]_tenant_status ON [entity_table_name](tenant_id, status);

COMMIT;
```

### Rollback
```sql
DROP TABLE IF EXISTS [entity_line_table_name];
DROP TABLE IF EXISTS [entity_table_name];
```

### Data Backfill (if needed)
```typescript
// scripts/backfill-[module].ts
import { prisma } from '@/lib/prisma';

async function backfill() {
  const records = await prisma.[oldEntity].findMany();
  for (const r of records) {
    await prisma.[newEntity].create({ data: transform(r) });
  }
}
```

---

## 4. Constraints & Validations

### Database Constraints
- `tenant_id NOT NULL` enforced everywhere
- `amount > 0` CHECK constraint (where applicable)
- `currency` matches ISO 4217 (3 chars)
- `status` ENUM via CHECK
- Unique `(tenant_id, code)` per entity

### Application Validations (Zod)
```typescript
export const [Entity]Schema = z.object({
  code: z.string().min(1).max(50).optional(), // auto if not provided
  name: z.string().min(3).max(255),
  amount: z.number().positive().multipleOf(0.0001),
  currency: z.string().length(3).default('SAR'),
  lines: z.array(LineSchema).min(1, 'At least one line required'),
});
```

---

## 5. Tenant Isolation Strategy

All queries MUST include `tenantId` filter:
```typescript
prisma.[entity].findMany({
  where: { tenantId: ctx.tenantId, deletedAt: null }
});
```

Enforced via:
1. Prisma middleware (`src/lib/prisma.ts`)
2. API handler wrapper (`withTenant()`)
3. RLS policies (for legacy tenants)

---

## 6. Decimal Precision Standards

| Field Type | Precision | Scale | Example |
|-----------|-----------|-------|---------|
| Money | 18 | 4 | 1000.0000 |
| Quantity | 18 | 4 | 100.5000 |
| Rate (%) | 8 | 4 | 15.0000 |
| FX Rate | 18 | 8 | 3.75000000 |

**❌ Never use `Float` for money.**

---

## 7. Indexing Strategy

```prisma
// Tenant + status (most common filter)
@@index([tenantId, status])

// Tenant + created date (for date-range queries)
@@index([tenantId, createdAt])

// Tenant + soft delete
@@index([tenantId, deletedAt])

// Foreign keys (Prisma adds automatically)
// @@index([parentId])

// Composite for common queries
@@index([tenantId, status, createdAt])
```

---

## 8. Related Existing Models

This module references / extends:
- `User` (created_by, updated_by)
- `Tenant` (tenantId)
- `JournalEntry` (GL posting)
- `AuditLog` (audit trail)
- `ApprovalRequest` (workflow)
