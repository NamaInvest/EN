# Agent Scan Report — Phase 2 Part 2 Dashboards

This report outlines the scan and impact analysis performed for Phase 2 Part 2 on the Sales, POS, and Purchases Dashboards.

## 1. Files & Directories Scanned
We have thoroughly inspected the following paths in the workspace:
1. **Sales Directory & Files**:
   - `src/app/(dashboard)/sales` (Directory)
   - `src/app/(dashboard)/sales/page.tsx` (Current point-of-sale retail billing terminal, 78.7 KB)
   - `src/app/(dashboard)/sales/analytics/page.tsx` (Static sales analytics dashboard)
   - `src/app/api/sales/route.ts` (API route providing GET for sales invoices)
2. **POS Directory & Files**:
   - `src/app/(dashboard)/pos` (Restaurant POS terminal client)
   - `src/app/(dashboard)/pos-dashboard` (POS sessions dashboard)
   - `src/app/(dashboard)/pos-dashboard/page.tsx` (Direct Prisma queries inside UI, needs rewrite to fetch)
   - `src/app/api/pos/route.ts` (POS POST route)
   - `src/app/api/pos/accountant/route.ts` (POS sessions accountant GET route — perfectly secure, handles tenant isolation)
3. **Purchases Directory & Files**:
   - `src/app/(dashboard)/purchases` (Directory)
   - `src/app/(dashboard)/purchases/page.tsx` (Simple static navigation links)
   - `src/app/api/purchases/route.ts` (GET and POST for purchase invoices)
   - `src/app/api/purchase-orders/route.ts` (GET and POST for purchase orders)
4. **General files**:
   - `src/components/Sidebar.tsx` (Sidebar menu structure and translations)

---

## 2. Core Discoveries & Understandings
- **Retail Billing POS (in `sales/page.tsx`)**:
  Currently, `sales/page.tsx` is not a dashboard; it is a full point-of-sale retail client. Overwriting it completely would destroy the retail POS billing terminal UI.
  *Solution*: We will safely move the retail POS billing terminal UI from `sales/page.tsx` to `src/app/(dashboard)/sales/terminal/page.tsx`, adjusting the one relative import (`VoucherReceipt` from `../../../../components/VoucherReceipt`). Then, we will create a magnificent `sales/page.tsx` acting as a secure, high-end Sales Dashboard. This dashboard will fetch from `/api/sales` and provide key stats (invoices today, sales amount, etc.), quick actions (including launching the Retail Terminal `/sales/terminal`), and empty/loading states.
- **POS Sessions Dashboard (in `pos-dashboard/page.tsx`)**:
  It currently queries Prisma directly: `await prisma.posSession.findMany(...)`. This violates the ERP architecture rule "لا تستخدم Prisma داخل UI. استخدم fetch فقط."
  *Solution*: We will rewrite `pos-dashboard/page.tsx` to be a `'use client';` React component that securely fetches POS sessions from `/api/pos/accountant` (which already implements perfect tenant isolation). We will display active terminals, closed sessions, and cash variance in a premium, hardware-accelerated dashboard with micro-animations.
- **Purchases Dashboard (in `purchases/page.tsx`)**:
  It is currently a simple navigation card layout.
  *Solution*: We will elevate it to a gorgeous, client-side dashboard matching the design standard of `InventoryDashboardPage`. It will fetch purchase invoices from `/api/purchases` and purchase orders from `/api/purchase-orders` to render KPIs, quick actions, lists, and empty/loading states.

---

## 3. Affected Files (Candidate Patches)
1. **[NEW]** `src/app/(dashboard)/sales/terminal/page.tsx`: Contains the retail POS billing client code.
2. **[MODIFY]** `src/app/(dashboard)/sales/page.tsx`: Completely rewrites this page to be the new, beautiful Sales Dashboard.
3. **[MODIFY]** `src/app/(dashboard)/pos-dashboard/page.tsx`: Rewrites this to be a client component fetching from `/api/pos/accountant`.
4. **[MODIFY]** `src/app/(dashboard)/purchases/page.tsx`: Rewrites this to be a gorgeous Purchases Dashboard fetching from `/api/purchases` and `/api/purchase-orders`.
5. **[MODIFY]** `src/components/Sidebar.tsx`: Updates the `/sales` reference if needed, though `/sales` will now correctly go to the Sales Dashboard (which is cleaner).

---

## 4. Risks & Mitigations
- **Risk: Breaking existing Retail POS terminal code during move**:
  *Mitigation*: The move will be a direct drop-in. Only the path of `VoucherReceipt` will be adjusted to accommodate one additional directory depth. No business logic or payment flow will be modified in any way.
- **Risk: Direct Prisma client inside POS back office**:
  *Mitigation*: Rewriting `pos-dashboard/page.tsx` to use `/api/pos/accountant` completely eliminates direct DB queries from the UI layer and adheres strictly to the Multi-tenant security isolation.
- **Risk: No mock data rule**:
  *Mitigation*: We will only show fetched numbers or empty/disabled states. If the API returns zero records, it will show a clean, elegant "Empty State" or "No Data" panel with beautiful iconography.

---

## 5. Execution Plan
1. **Step 0**: Confirm `.gitignore` has been successfully verified (done and documented in `tmp/gitignore-safety-review.md`).
2. **Step 1**: Copy the current point-of-sale retail billing code from `sales/page.tsx` to `sales/terminal/page.tsx` with adjusted relative imports.
3. **Step 2**: Create the new Sales Dashboard in `sales/page.tsx` with KPIs fetched from `/api/sales`, quick actions, and recent sales list.
4. **Step 3**: Rewrite the POS back-office dashboard in `pos-dashboard/page.tsx` to fetch from `/api/pos/accountant`.
5. **Step 4**: Rewrite the Purchases Dashboard in `purchases/page.tsx` to fetch from `/api/purchases` and `/api/purchase-orders`.
6. **Step 5**: Run system verification (`npm run typecheck`, `npx prisma validate`, `npm run build`) to ensure 100% build pass.

---

## 6. Testing & Validation Plan
- **Typecheck**: `npm run typecheck` must pass with zero new errors.
- **Prisma Validate**: `npx prisma validate` must pass.
- **Build validation**: `npm run build` must succeed completely.
- **Visual & functional checks**: Verify that all links load safely without Prisma exceptions.