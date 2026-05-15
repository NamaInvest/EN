# SYSTEM MAP

## Folder Structure
- `src/app/(dashboard)`: Main UI pages for all ERP modules.
- `src/app/api`: Backend API endpoints.
- `src/lib/services`: Core business logic (Accounting Engine, Inventory Service, etc.).
- `src/middleware.ts`: Authentication and tenant subdomain resolution guard.
- `prisma/schema.prisma`: Database schema definition.

## Entry Points
- Web Application: `src/app/page.tsx`
- Desktop App: Electron/Qt bootstrappers (via APIs).
- API Gateway: `src/middleware.ts` intercepts all API requests.

## Runtime Flow
Request -> Middleware (Subdomain/Tenant logic, Clerk/API Auth) -> Next.js Route Handler -> Prisma Client (wrapped in Tx) -> PostgreSQL.

## Shared Libraries
- `runFinancialTx`: Core atomic wrapper for financial mutations.
- `runInventoryTx`: Core atomic wrapper for stock mutations.
- `ZatcaService`: KSA e-invoicing compliance logic.
