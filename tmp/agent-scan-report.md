# Agent Scan Report — Payroll Process Action Bug Investigation

## 1. الملفات التي قرأتها (Files Scanned)
- [src/app/api/payroll/route.ts](file:///d:/namasoft9-3-main/src/app/api/payroll/route.ts): The main endpoint handling POST/GET payroll actions.
- [src/app/(dashboard)/hr/payroll-process/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/hr/payroll-process/page.tsx): The frontend interface for manually adjusted payroll processing.
- [src/app/api/payroll/[id]/route.ts](file:///d:/namasoft9-3-main/src/app/api/payroll/[id]/route.ts): Single payslip retrieval route.
- [src/app/api/payroll/calculate/route.ts](file:///d:/namasoft9-3-main/src/app/api/payroll/calculate/route.ts): Real-time salary calculation endpoint.
- [src/services/hr/payroll.service.ts](file:///d:/namasoft9-3-main/src/services/hr/payroll.service.ts): High-level service that deals with payroll calculations, WPS files, and GOSI.
- [.ai-brain/25-hr-payroll.md](file:///d:/namasoft9-3-main/.ai-brain/25-hr-payroll.md): The payroll module domain documentation.
- [prisma/schema.prisma](file:///d:/namasoft9-3-main/prisma/schema.prisma): Schema for `PayrollInvoice` and `PayrollInvoiceDetail`.

## 2. الملفات المرشحة للتعديل (Candidate Files for Modification)
- **Backend**: [src/app/api/payroll/route.ts](file:///d:/namasoft9-3-main/src/app/api/payroll/route.ts)
  - Add standard Zod schema to validate single-employee payslip submission (`CreatePayslipSchema`).
  - Implement a dedicated action: `action === 'create-payslip'` (and optionally allow it as a fallback when `action === ''`).
  - Restore the atomic database transaction block that:
    - Checks the financial period status (ensuring it is open).
    - Creates `PayrollInvoice` header record.
    - Creates corresponding `PayrollInvoiceDetail` items.
    - Updates active employee loans remaining balance if `loanId` is passed in the deduction line.
    - Registers a `ZATCARecord` for compliance.
- **Frontend**: [src/app/(dashboard)/hr/payroll-process/page.tsx](file:///d:/namasoft9-3-main/src/app/(dashboard)/hr/payroll-process/page.tsx)
  - Update `handleSubmit` fetch URL (line 104) from `/api/payroll` to `/api/payroll?action=create-payslip` to explicitly define the intended action.

## 3. الدومينات المتأثرة (Affected Domains)
- **HR & Payroll**: Individual employee payroll manual issuing flow.
- **Accounting & Compliance**: ZATCA compliance records (`ZATCARecord` link) and Employee Loans (`employeeLoan` table balance update).

## 4. المخاطر (Risks)
- **Financial Integrity**: Double-deducting loans or mismatch in invoice totals.
  - *Mitigation*: Run calculations strictly within an atomic `prisma.$transaction` block and ensure correct decimal precision matching.
- **Tenant Leakage**: Generating records across multiple tenants.
  - *Mitigation*: Ensure the query uses standard tenant isolation headers (`req.headers.get('x-tenant-id')`) verified via auth context.
- **Data Duplication**: Creating multiple invoices for the same employee in the same period.
  - *Mitigation*: We can add a check to verify if a payroll invoice for the given employee and period already exists before creating a new one (similar to the logic in `generate`).

## 5. خطة التنفيذ (Execution Plan)
- **Phase 1: Backend Patch**:
  - Define `CreatePayslipSchema` using Zod inside `src/app/api/payroll/route.ts`.
  - Re-integrate the single-payslip invoice transaction logic inside a dedicated block in `POST` when `action === 'create-payslip'` or when `action === ''` (as fallback).
- **Phase 2: Frontend Patch**:
  - Update `src/app/(dashboard)/hr/payroll-process/page.tsx` to explicitly fetch `/api/payroll?action=create-payslip`.
- **Phase 3: Integration Smoke Test**:
  - Run the frontend interface, select an employee, make manual adjustments, click "اعتماد وتصدير", and ensure successful creation of the `PayrollInvoice` and redirect to the print PDF page.

## 6. خطة الاختبار (Testing Plan)
- **Manual Smoke Test**: Verify individual employee manual payslip generation on the tenant subdomain.
- **RBAC Test**: Verify that only authorized roles ('admin', 'owner', 'hr', 'hr_manager', 'payroll_admin') can trigger `create-payslip`.
- **Loan Deduction Test**: Verify that loan balances are correctly updated when manual deduction with `loanId` is processed.