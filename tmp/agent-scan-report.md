# Scan Report (Pre-Implementation) - Nama Invest ERP P2 Remediation Scan and Plan

## 1. الملفات التي قرأتها (Files Read)
- `docs/reports/full-project-audit/FULL_PROJECT_ISSUES_REGISTER.md`
- `docs/reports/full-project-audit/FULL_PROJECT_PERFORMANCE_SRE_AUDIT.md`
- `docs/reports/full-project-audit/FULL_PROJECT_SECURITY_AUDIT.md`
- `src/lib/bom-engine.ts`
- `src/app/api/manufacturing/bom/route.ts`
- `src/app/api/pos/checkout/route.ts`
- `src/lib/pos-session-engine.ts`
- `src/app/(dashboard)/pos/page.tsx`
- `src/app/api/reports/[type]/route.ts`
- `src/app/api/reports/dimensional-gl/route.ts`
- `src/app/api/upload/route.ts`

## 2. الملفات المرشحة للتعديل (Candidate Files to Modify)
- `src/lib/bom-engine.ts` (For ISS-04: Resolving N+1 nested loop queries in BOM explosion)
- `src/app/api/pos/checkout/route.ts` (For ISS-05: Enforcing cashier POS session checks before checkouts)
- `src/app/(dashboard)/pos/page.tsx` (For ISS-06: Adjusting Arabic text styling and responsive layout widths)
- `src/app/api/reports/[type]/route.ts` (For ISS-07: Extracting pagination parameters for large report queries)
- `src/app/api/reports/dimensional-gl/route.ts` (For ISS-07: Extracting pagination parameters for ledger queries)
- `src/app/api/upload/route.ts` (For ISS-08: Hardening file-type upload checks via Magic Bytes signature scanning)

## 3. الدومينات المتأثرة (Affected Domains)
- **Manufacturing / BOM Module**: Product recipe structures and recursively exploded trees.
- **POS / Sales Module**: Cashier terminals, session validation state machines, cash drawers, and responsive cashier layouts.
- **Financial Reports / General Ledger**: Large query payloads, data transmission size controls, and pagination in Next.js endpoints.
- **Document Management System (DMS) / Upload**: File system security, file stream parsers, and type verification.

## 4. المخاطر (Risks)
- **ISS-04 N+1 Fix Risk**: Large BOM trees might exceed array buffer sizing if loaded entirely in a single batch query. Resolved by keeping execution depth limits (`maxDepth = 5`) and mapping parent-child relations efficiently.
- **ISS-05 Session Check Risk**: Preventing POS checkouts if the session state is out of sync in offline mode. Resolved by fallback mechanisms that read local SQLite session states.
- **ISS-06 Layout Polish Risk**: Breaking existing cashier styles in mobile screens or changing font scaling unexpectedly. Resolved by CSS utility wrappers (`text-wrap`, min-width parameters).
- **ISS-07 Pagination Risk**: Breaking financial sum total aggregates in reports if only paginated subsets are aggregated. Resolved by doing aggregate calculations on the whole filter set first, then returning the paginated subset rows.
- **ISS-08 magic-bytes scanner dependency**: Native binary files parsing might fail if incorrect header formats are parsed. Resolved by fallback checks and using light in-memory byte arrays signatures (e.g. `[0x89, 0x50, 0x4E, 0x47]` for PNG).

## 5. خطة التنفيذ (Implementation Plan)
- **Wave P2-A (Performance & Pagination)**: Optimize `BOMEngine.explode` by batch-fetching product information and implementing Redis cache where appropriate. Add standard offset pagination (`page`, `limit`) to dimensional GL report API and `[type]/route.ts` endpoints.
- **Wave P2-B (POS Session Governance)**: Modify `/api/pos/checkout` to query `PosSession` matching the active cashier and branch, rejecting checkouts if status is not `OPEN`.
- **Wave P2-C (Upload Hardening)**: Integrate in-memory magic bytes validator into `/api/upload` route to check signature arrays for PNG, JPEG, WEBP, and GIF files prior to storage.
- **Wave P2-D (Responsive Mobile RTL Polish)**: Add responsive CSS flex layout scaling and `text-wrap` properties to POS terminal drawer elements to fit smaller displays without overlapping Arabic phrases.

## 6. خطة الاختبار (Test Plan)
- **Unit & Integration tests**: Write mock database transaction tests under `tests/integration/pos-sessions.test.ts` to ensure checkout fails without an open session.
- **Security Validation tests**: Write mock multipart upload tests under `tests/integration/upload-hardening.test.ts` sending forged headers with binary payloads to verify that spoofed files are safely rejected.
- **Performance benchmarking**: Run local mock load tests on exploded BOM queries and reports endpoints to confirm that execution and query durations scale linearly under large sets.
