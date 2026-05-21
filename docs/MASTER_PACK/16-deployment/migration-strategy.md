# Zero-Downtime Database Migration Strategy

## Principles
1. **Never mutate existing columns destructively** in a single release.
2. **Backwards Compatibility**: The old version of the application must be able to run against the new version of the database scheme during the blue-green deployment phase.
3. **Expand and Contract Pattern**: 
   - Phase 1 (Expand): Add the new schema element (column, table). Deploy code that writes to *both* old and new elements, but reads from the old.
   - Phase 2 (Migrate): Run a background script to backfill data from the old element to the new.
   - Phase 3 (Transition): Deploy code that reads from the new element.
   - Phase 4 (Contract): Remove the old element.

## Example: Renaming a Column

**Scenario**: Rename `name` to `fullName` in the `User` table.

**PR 1 (Expand):**
- Prisma Schema: Add `fullName String?`
- Code: Update Prisma Client logic to save to both `name` and `fullName`.
- Deploy.

**PR 2 (Backfill):**
- Create a script that updates all existing records where `fullName` is null with the value from `name`.
- Run in production.

**PR 3 (Transition):**
- Update code to read exclusively from `fullName`.
- Deploy.

**PR 4 (Contract):**
- Prisma Schema: Remove `name` column. Change `fullName` to be non-nullable if required.
- Deploy.

By strictly following this process, migrations can be executed safely without taking the application offline.
