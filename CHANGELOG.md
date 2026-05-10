## [2.5.0] - 2026-05-10 — Production Hardening Wave 5

### 🚀 Added
- `src/lib/sentry.ts`: Sentry error tracking integration (lazy init, PII strip, structured logger fallback)
- `tests/e2e/golden-paths/`: 4 complete Playwright E2E specs (sales, payroll, P2P, auth)
- `SECURITY.md`: Security policy and responsible disclosure guide
- `CONTRIBUTING.md`: Full contribution guide with architecture rules
- `package.json`: `validate`, `db:migrate`, `clean`, `test:domain`, `health`, `analyze` scripts

### 🔧 Fixed
- **491 silent catch blocks** across 366 route files now log errors via `log.error`
- **246 machine-path logger service names** (`D:.namasoft...`) → clean names (`auto-journal`, `with-route`)
- **5 routes** missing pagination defaults → `take: 100` added
- **7 pagination gaps** in GET routes fixed

### 🏗️ Changed
- `jest.config.ts`: Added `domain` + `integration` test projects (19 previously-lost test files now run)
- `e2e.yml`: 2-shard parallelism, smoke mode, wait-on health endpoint, merged reports
- `README.md`: Complete rewrite with Quick Start, security checklist, deployment guide

---

## [2.4.0] - 2026-05-10 — Logger Migration Complete

### 🚀 Added
- Structured logging migration: **1,465 `console.log` calls** migrated to `log.*` across 4 waves
- `src/lib/api/with-route.ts`: Unified HOF with auth, rate-limit, tenant isolation, Prometheus metrics
- `src/lib/api-error.ts`: Standardized error response builder
- OpenAPI documentation: 56 API paths documented

### 🔧 Fixed
- **0 TypeScript errors** maintained (strict zero-error policy)
- **0 `console.log`** in API routes
- **8 TODOs** implemented:
  - Shop Floor WIP Relief auto-journal (DR/CR accounting entries)
  - Stock Transfer weighted avg cost calculation
  - IFRS 16 Initial JE (DR ROU Asset / CR Lease Liability)
  - Payment run bank file generation
  - Notification channels (Email, Push, WhatsApp, Telegram)

### 🏗️ Changed
- All 24 previously unprotected Prisma routes now wrapped with try/catch
- logger `service` field normalized across all 246 `src/lib` files

---

## [2.3.0] - 2026-05-09 — Financial Engine Modernization

### 🚀 Added
- Month-End & Year-End close engines (unified facade)
- GOSI engine with KSA social insurance calculations
- WPS file generator (SAMA-compliant)
- IFRS 9 ECL engine
- Fixed Asset lifecycle (CWIP → Capitalization → Revaluation)
- Saudi EOS (End of Service) engine per labor law

### 🔧 Fixed
- TS2451/TS2304 errors in auto-generated routes eliminated
- `withRoute` middleware structural integrity restored

---

## [2.0.0] - 2026-05-08 — Architecture Overhaul

### Breaking Changes
- `FieldAuditTrail` → `AuditLog` (consolidated audit model)
- Sidebar navigation unified (eliminated duplicates)
- `handleLogin` logic consolidated (was duplicated across 3 files)

### 🚀 Added
- 30+ ERP modules: Manufacturing, Pharmacy, Fleet, Leasing, Treasury
- AI Copilot via Gemini + Langchain
- ZATCA Phase 2 complete integration
- Multi-tenant architecture with AsyncLocalStorage
