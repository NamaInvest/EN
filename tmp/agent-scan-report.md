# Open Items UI Preview Deep Scan Report (Phase OPEN-ITEMS-01H)

## 1. Files Scanned & Read
We have thoroughly scanned the following files in the project to understand the structure, architecture, and current state:
* [AGENTS.md](file:///d:/namasoft9-3-main/AGENTS.md) (Governance, rules, safety)
* [src/app/api/open-items/route.ts](file:///d:/namasoft9-3-main/src/app/api/open-items/route.ts) (Read-only API preview endpoint)
* [src/lib/services/open-items.service.ts](file:///d:/namasoft9-3-main/src/lib/services/open-items.service.ts) (Open Items matching backend engine)
* [src/app/(dashboard)/accounting/open-items/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/accounting/open-items/page.tsx) (Draft implementation)
* [src/app/(dashboard)/accounting/customer-statements/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/accounting/customer-statements/page.tsx) (Reference dashboard design pattern)
* [src/app/(dashboard)/accounting/prepayments/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/accounting/prepayments/page.tsx) (Reference dashboard layout)

---

## 2. Candidate Files for Modification
* [src/app/(dashboard)/accounting/open-items/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/accounting/open-items/page.tsx) - We will enrich this page with premium, visually stunning UI styling, search capability, filtering by type (AR/AP/All) and status, high-fidelity loading/empty/error states, and full RTL Arabic/LTR English dual support, while maintaining absolute read-only safety.

---

## 3. Affected Domains
* **Accounting UI Dashboard (Read-Only)**: Purely a presentation layer page.
* **No Database Mutation**: 0 writes, 0 prisma updates, 0 ledger modifications.
* **No API Modification**: Purely calling GET /api/open-items.

---

## 4. Identified Risks & Mitigation Matrix

| Identified Risk | Severity | Root Cause | Preventive Mitigation |
| :--- | :--- | :--- | :--- |
| **Accidental Mutation Actions** | **HIGH** | Adding action buttons/mutations in a preview phase | Absolute read-only UI. No allocation or reversal buttons will be created. |
| **Cross-Tenant Data Leakage** | **HIGH** | API query without session tenant isolation | The GET `/api/open-items` API is already hard-isolated using `requireTenantId(request)` and `withRoute` middleware. |
| **Type Safety Errors** | **MEDIUM** | Mismatch between API return schema and frontend TypeScript types | Strict typing matching `{ salesInvoices: Array, purchaseInvoices: Array, openReceipts: Array }` exactly. |
| **Layout Distortion in RTL** | **MEDIUM** | Hardcoded grid/margins or absolute values | Fluid flex layouts, Tailwind responsive grids, dynamically set `dir="rtl"` or `dir="ltr"` based on language selector. |
| **Aesthetic Blandness** | **MEDIUM** | Simple basic tables and white panels | Stunning premium CSS cards, gradients, Outfit fonts, custom HSL status tags, hover states, and SVG illustration empty states. |

---

## 5. Implementation Plan (Small & Safe)
1. **Design System & Aesthetics Setup**:
   - Establish custom cohesive colors: Indigo/Violet for AR (Accounts Receivable), Amber/Orange for AP (Accounts Payable), Green/Emerald for Receipts, and Rose/Red for Outstanding/Negative states.
   - Use dynamic fonts, micro-animations, glassmorphic accents, and smooth hover scales on interactive cards.
2. **Read-Only Filters & Selection**:
   - Customer/Partner ID input field with numeric validation.
   - Partner Selector & View Mode filter: `Show All`, `AR Only` (Accounts Receivable), or `AP Only` (Accounts Payable).
   - Dynamic search/filter to query records by invoice number, date ranges, or status fields.
3. **Data Fetching, Loading, Error & Empty States**:
   - Standard React state hook implementation fetching from GET `/api/open-items?customerId=ID` on submit and mount.
   - Elegant skeleton loader/spinner to indicate query state.
   - Beautiful warning/error alerts indicating API exceptions (e.g. invalid customer, closed connection).
   - Visually striking SVG illustration empty state when no open items exist for the requested partner.
4. **Data Tables & Cards**:
   - Outstanding AR Grid: displaying Invoice No, Date, Total, Paid, Outstanding Balance, and Status badge.
   - Outstanding AP Grid: displaying Supplier Invoice No, Date, Total, Paid, Outstanding Balance, and Status.
   - Unallocated Collections Grid: displaying Treasury ID, Date, Amount, Unallocated Balance, and Description.
   - Summary/KPI Card deck displaying real-time outstanding AR/AP sums and total unallocated amounts.

---

## 6. Test Plan
* **TypeScript Compilation**: Run `npm run typecheck` to verify zero type mismatches or build errors.
* **Jest Unit Suite Verification**: Execute `npx jest src/__tests__/open-items-api-readonly.test.ts src/__tests__/open-items.service.test.ts --runInBand --forceExit` to guarantee 100% test passing.
* **Manual UI Audit**: Check that the generated code contains no forms or buttons triggering POST, PUT, DELETE, PATCH, or mutation calls.
* **Responsive Layout checks**: Ensure container widths and tables adjust cleanly on desktop/tablet views.