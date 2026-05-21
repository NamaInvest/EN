# Refactoring Log - Thin Routes, Fat Services

## Progress
- Total Routes Audited: Pending script execution
- Routes Refactored: 0
- Remaining: To be determined by audit script

## Phase 1: Audit
- [x] Create `scripts/audit-thin-routes.ts`
- [x] Run audit script and analyze `tmp/thin-routes-audit.csv`

## Phase 2: High Priority Refactoring
- Identify all routes involving `auto-journal` or critical financial workflows.
- Create appropriate service classes in `src/services/<domain>/<entity>.service.ts`
- Delegate Prisma transactions to the service layer.

## Best Practices
- Controllers (`route.ts`) should ONLY handle Request/Response parsing and invoking the `Service`.
- Services (`*.service.ts`) should handle ALL business logic and DB transactions.
- Always use `zod` schema parsing in `route.ts`.
- Ensure tests (`tests/services/**/*.test.ts`) are added alongside refactoring.

