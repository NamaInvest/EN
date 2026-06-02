# Nama Prisma Governance Skill

## Purpose

Audit Prisma schema, database governance, tenant coverage, indexes, migrations, and financial data integrity structures.

## Allowed Actions

- Read `prisma/schema.prisma`.
- Read `prisma/migrations/**`.
- Run `npx prisma validate`.
- Generate DB governance reports.
- Generate model/index/tenant audit matrices.
- Update `.ai-brain/05-financial-governance.md`.
- Update risk/gap/evidence registers.

## Forbidden Actions

- `prisma migrate`
- `prisma db push`
- SQL writes
- DB production connection
- Schema changes without approval
- Runtime code changes
- Deploy
- Git push
- Secrets access

## Audit Focus

- models
- enums
- tenantId coverage
- indexes
- relations
- cascade deletes
- financial tables
- audit fields
- soft delete
- migration safety
- schema drift indicators

## Required Outputs

- `DATABASE_GOVERNANCE_REPORT.md`
- `PRISMA_MODEL_AUDIT.csv`
- `DATABASE_INDEX_REVIEW.md`
- `MIGRATION_SAFETY_REPORT.md`

## Stop Conditions

Stop if remediation requires schema change, migration, or DB write.

## Approval Gates

- `GO_FOR_PRISMA_SCHEMA_AUDIT_TOOLING_ONLY`
- `GO_FOR_SCHEMA_CHANGE_PLAN_ONLY`
- `GO_FOR_DB_MIGRATION_PLAN_ONLY`
