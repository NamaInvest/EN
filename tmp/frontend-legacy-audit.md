
# Frontend Legacy & UI Modernization Audit
**Total Files Scanned:** 598
**Total Lines of Code:** 95237

## 1. UX / Architecture Problems (Huge Pages)
*Files > 500 lines. These represent monolithic components mixing UI, state, and business logic.*
- **src\app\(dashboard)\sales\page.tsx** (1780 lines)
- **src\components\Sidebar.tsx** (1255 lines)
- **src\app\(dashboard)\accounting\page.tsx** (1063 lines)
- **src\app\(dashboard)\restaurant-pos\page.tsx** (962 lines)
- **src\app\(dashboard)\settings\page.tsx** (939 lines)
- **src\app\(dashboard)\pos\page.tsx** (879 lines)
- **src\components\InvoiceReceipt.tsx** (827 lines)
- **src\app\company-info\page.tsx** (715 lines)
- **src\app\(dashboard)\products\components\ProductFormModal.tsx** (680 lines)
- **src\app\(dashboard)\settings\roles\page.tsx** (653 lines)
- **src\app\(dashboard)\purchase-orders\page.tsx** (642 lines)
- **src\app\design2\page.tsx** (596 lines)
- **src\app\login\page.tsx** (582 lines)
- **src\app\design4\page.tsx** (552 lines)
- **src\app\(dashboard)\settings\company\page.tsx** (549 lines)

## 2. Legacy UI Patterns & RTL Issues
*Files with hardcoded left/right alignments instead of start/end (Breaks RTL).*
- src\app\(dashboard)\accounting\allocations\rules\page.tsx
- src\app\(dashboard)\accounting\banks\imports\page.tsx
- src\app\(dashboard)\accounting\banks\recon\page.tsx
- src\app\(dashboard)\accounting\customer-statements\page.tsx
- src\app\(dashboard)\accounting\customer-statements\templates\page.tsx
- src\app\(dashboard)\accounting\dunning\page.tsx
- src\app\(dashboard)\accounting\journal\new\page.tsx
- src\app\(dashboard)\accounting\multi-book\page.tsx
- src\app\(dashboard)\accounting\page.tsx
- src\app\(dashboard)\accounting\payment-runs\page.tsx
- src\app\(dashboard)\accounting\trial-balance\page.tsx
- src\app\(dashboard)\accounting\vendor-statements\page.tsx
- src\app\(dashboard)\accounting\year-end-close\page.tsx
- src\app\(dashboard)\admin\bi-builder\page.tsx
- src\app\(dashboard)\admin\compliance\page.tsx
*Total files with inline styles: 276*

## 3. Security & Governance Issues
*DangerouslySetInnerHTML used:*
- src\app\(dashboard)\accounting\journal\page.tsx
- src\app\(dashboard)\accounting\page.tsx
- src\app\(dashboard)\ai-cfo\page.tsx
- src\app\(dashboard)\ai-copilot\page.tsx
- src\app\(dashboard)\barcode\page.tsx
- src\app\(dashboard)\crm\leads\page.tsx
- src\app\(dashboard)\employees\page.tsx
- src\app\(dashboard)\hr\payslip\[id]\page.tsx
- src\app\(dashboard)\manufacturing\mrp-dashboard\page.tsx
- src\app\(dashboard)\pos-demo\page.tsx
- src\app\(dashboard)\purchase-orders\page.tsx
- src\app\(dashboard)\rem\page.tsx
- src\app\(dashboard)\rent\page.tsx
- src\app\(dashboard)\reports\customer-statement\page.tsx
- src\app\(dashboard)\sales\analytics\page.tsx
- src\app\(dashboard)\school\attendance\page.tsx
- src\app\(dashboard)\school\dashboard\page.tsx
- src\app\(dashboard)\school\exams\page.tsx
- src\app\(dashboard)\school\page.tsx
- src\app\(dashboard)\school\schedule\page.tsx
- src\app\(dashboard)\school\stages\page.tsx
- src\app\(dashboard)\school\transport\page.tsx
- src\app\(dashboard)\scm\page.tsx
- src\app\(dashboard)\warehouses\page.tsx
- src\app\api-docs\page.tsx
- src\app\design1\page.tsx
- src\app\design2\page.tsx
- src\app\design3\page.tsx
- src\app\design4\page.tsx
- src\app\factory\page.tsx
- src\app\invoice\[id]\page.tsx
- src\app\kiosk\attendance\page.tsx
- src\app\layout.tsx
- src\app\page.tsx
- src\app\page_backup.tsx
- src\app\pricing\page.tsx

*Hardcoded URLs / Unprotected Fetches:*
- src\app\(dashboard)\settings\company\page.tsx
- src\app\auto-login\page.tsx
- src\app\company-info\page.tsx
- src\app\company-setup\page.tsx
- src\app\(dashboard)\accounting\aging-report\page.tsx
- src\app\(dashboard)\accounting\banks\imports\page.tsx
- src\app\(dashboard)\accounting\collection-workflow\page.tsx
- src\app\(dashboard)\accounting\customer-statements\bulk\page.tsx
- src\app\(dashboard)\accounting\customer-statements\templates\page.tsx
- src\app\(dashboard)\accounting\deferred\page.tsx
- src\app\(dashboard)\accounting\financial-close\page.tsx
- src\app\(dashboard)\accounting\journal\new\page.tsx
- src\app\(dashboard)\accounting\journal\page.tsx
- src\app\(dashboard)\accounting\page.tsx

## 4. Performance & State Anti-Patterns
*Excessive or heavy useEffect loops:*
- src\app\(dashboard)\customers\page.tsx
- src\app\(dashboard)\dashboard\page.tsx
- src\app\(dashboard)\hr\payroll-process\page.tsx
- src\app\(dashboard)\manufacturing\boms\[id]\versions\page.tsx
- src\app\(dashboard)\pos\offline\page.tsx
- src\app\(dashboard)\pos\page.tsx
- src\app\(dashboard)\products\page.tsx
- src\app\(dashboard)\purchase-orders\page.tsx
- src\app\(dashboard)\restaurant-pos\page.tsx
- src\app\(dashboard)\sales\options\page.tsx

## Modernization Plan Recommendation
### Phase A: Core Shared Components Cleanup
### Phase B: Dashboard & Layout Modernization
### Phase C: Forms & Tables Standardization
### Phase D: Data Fetching / State Cleanup
### Phase E: Performance Optimization
### Phase F: Accessibility + RTL + Responsive Fixes
