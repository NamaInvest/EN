
# Financial Integrity
**Generated At:** 2026-05-14T08:21:09.109Z

## Core Principles
1. **Zero Split-Brain:** All financial operations must occur inside a single atomic transaction. An invoice must never exist without its corresponding journal entry, and vice-versa.
2. **TxClient Injection:** Any service function that performs database updates (like `createJournalEntry`) MUST accept a `txClient` (Prisma Transaction Client) and use it exclusively.
3. **Hard Failures (Throw Errors):** Do not return soft `{ success: false }` inside atomic transactions. Throwing forces rollback.
4. **Outbox Pattern:** External API calls (like ZATCA) must NEVER be made synchronously inside a financial transaction.

## Release Operations & Database Safety
- Modifying applied historic migrations is strictly prohibited.
- Use `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script` to safely generate diffs bypassing broken shadow DBs.
