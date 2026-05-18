# ENVIRONMENT AND CONFIGURATION

## 1. Environment Variables
- **Database**: `DATABASE_URL` (PostgreSQL connection string). Requires `?pgbouncer=true` if using Prisma with connection pooling.
- **Redis**: `REDIS_URL` or `REDIS_HOST`, `REDIS_PORT` for BullMQ/background jobs.
- **Authentication**: `NEXTAUTH_SECRET`, `NEXTAUTH_URL` or equivalent for session security.
- **Tenant Context**: While tenants are dynamic, specific subdomains might be resolved via `NEXT_PUBLIC_APP_DOMAIN`.
- **Integrations**: `ZATCA_ENV` (Simulation, Core, Developer), `MAIL_SERVER_URL`, etc.

## 2. Configuration Files
- **`package.json`**: Defines scripts like `npm run typecheck`, `npm run lint`, `npm run test:financial`.
- **`prisma/schema.prisma`**: The heart of the application. Contains all models and generator configurations.
- **`next.config.js`**: Contains Next.js build settings, potentially rewrites for multitenancy subdomains.
- **`tsconfig.json`**: TypeScript strictness. Must remain at `strict: true` with zero-errors allowed on build.

## 3. Secrets Management
- Hardcoded secrets are absolutely forbidden.
- Environment variables must be validated at boot time (e.g., using `zod` in a `env.ts` file) to fail fast if required secrets are missing.
- ZATCA private keys (`CSID`) should be securely stored in the database per-tenant (e.g., `GovApiCredentials`), encrypted at rest, and never exposed in API payloads.

## 4. Missing Validation (Tech Debt)
- **Startup Guard**: The system needs a robust `validateEnv()` call during Next.js bootstrap to crash immediately if `DATABASE_URL` or `REDIS_URL` is missing.
