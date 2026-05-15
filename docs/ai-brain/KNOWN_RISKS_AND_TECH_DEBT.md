# KNOWN RISKS AND TECH DEBT

- Over-reliance on monolithic Prisma schema; schema file is massive.
- Direct database writes without `runFinancialTx` might still exist in legacy modules (require ongoing audit).
- Dangerous `any` types in TypeScript can cause runtime failures.
