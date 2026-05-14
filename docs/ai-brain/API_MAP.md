# API Map
This file contains all automatically discovered API routes.

# 07 - توثيق جميع مسارات API بالتفصيل (All API Endpoints)

> **إجمالي عدد ملفات route.ts:** 848
> **تم التوليد تلقائياً من الكود الفعلي بتاريخ:** 2026-05-14T08:21:19.870Z

## 📂 `/api/accounting` (99 مسار)

### `/api/accounting/accounts/init`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **جداول مستخدمة:** `account`

### `/api/accounting/accounts`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `account`, `journalLine`

### `/api/accounting/accruals`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/aging`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/allocations`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/accounting/allocations/run`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/allocations/simulate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/audit-export`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/balance-sheet`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `account`, `journalLine`

### `/api/accounting/bank-feed`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/bank-recon/auto-match`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/bank-recon`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/bank-statements`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `bankStatement`

### `/api/accounting/bank-statements/upload`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `UPLOAD`
- **التحقق:** Zod Schema ✅

### `/api/accounting/banks/imports`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/accounting/banks/recon/create-je`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `bankStatementLine`, `journalEntry`

### `/api/accounting/banks/recon/match`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `bankStatementLine`

### `/api/accounting/books`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `accountingBook`

### `/api/accounting/budget/check`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/budget/variance`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/cashflow/forecast`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/chart-of-accounts-import`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/closing`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **جداول مستخدمة:** `fiscalPeriod`

### `/api/accounting/coa/reset-to-socpa`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/collection-workflow`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/consolidation/commit`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/consolidation/run`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/cost-center-report`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/cost-centers`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `costCenter`

### `/api/accounting/customer-statements/bulk/history`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `statementBatch`

### `/api/accounting/customer-statements/bulk/preview`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `customer`, `salesInvoice`

### `/api/accounting/customer-statements/bulk/run`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `customer`, `statementBatch`, `statementDispatchLog`

### `/api/accounting/customer-statements/generate-pdf`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `statementDispatchLog`

### `/api/accounting/customer-statements/preview`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/customer-statements/send-email`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/customer-statements/templates`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `customerStatementTemplate`

### `/api/accounting/customer-statements/templates/[id]`
- **Methods:** PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `customerStatementTemplate`

### `/api/accounting/customers/[id]/statement`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/deferred`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/deferred-tax`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/depreciation`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/dunning/daily-run`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/dunning/promise-to-pay`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `promiseToPay`, `customer`

### `/api/accounting/ecl/run`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/financial-close`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/financial-statements`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/fiscal-periods`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `fiscalPeriod`

### `/api/accounting/fiscal-years`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `fiscalYear`

### `/api/accounting/fixed-assets/depreciate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/accounting/fixed-assets`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/fx-revaluation/run`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/governance-violations`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `auditLog`

### `/api/accounting/gr-ir-clearing`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/income-statement`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `account`, `journalLine`

### `/api/accounting/inter-company`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/intercompany`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/inventory-valuation-snapshot`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/journal`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `journalEntry`, `auditLog`

### `/api/accounting/journal/[id]`
- **Methods:** PUT, PATCH
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `fiscalPeriod`, `journalEntry`, `account`, `auditLog`, `journalLine`

### `/api/accounting/lc`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `letterOfCredit`, `bankAccount`, `customer`

### `/api/accounting/leases/amortize`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/accounting/leases`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/ledger`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `account`, `journalLine`

### `/api/accounting/month-end-close`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/multi-book/adjustments`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/open-items/apply-payment`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/accounting/open-items/auto-clear`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/accounting/open-items/disputes`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/accounting/open-items/promise-to-pay`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/accounting/open-items`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/opening-balances`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/payment-runs/propose`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/payment-runs/[id]/approve`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `paymentRun`

### `/api/accounting/payment-runs/[id]/generate-files`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `paymentRun`, `paymentRunBankFile`

### `/api/accounting/payment-runs/[id]/post-journal`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `paymentRun`, `journalEntry`

### `/api/accounting/payment-runs/[id]/submit-for-approval`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/payment-runs/[id]/upload-confirmation`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `UPLOAD`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `paymentRun`, `paymentRunLine`

### `/api/accounting/payroll-gl`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/period-close`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/period-lock`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/prepayments`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/profit-centers`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `profitCenter`

### `/api/accounting/profit-loss`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/revenue-recognition/amortize`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/accounting/revenue-recognition`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesInvoice`

### `/api/accounting/reversal`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **جداول مستخدمة:** `journalEntry`

### `/api/accounting/segments`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/statement`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/trial-balance`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/vat-return`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/accounting/year-end/initiate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/accounting/year-end/reopen`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **جداول مستخدمة:** `fiscalYear`, `fiscalYearReopenRequest`

### `/api/accounting/year-end/[runId]/finalize`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/accounting/year-end/[runId]/reports`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/accounting/year-end/[runId]/tasks`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `yearEndCloseTask`

### `/api/accounting/year-end/[runId]/tasks/[taskCode]/complete`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/year-end/[runId]/tasks/[taskCode]/execute`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/accounting/year-end-close/close-period`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/accounting/year-end-close`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

## 📂 `/api/adjustments` (1 مسار)

### `/api/adjustments`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `productStock`

## 📂 `/api/admin` (12 مسار)

### `/api/admin/backups`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `ADMIN`
- **جداول مستخدمة:** `backupRecord`

### `/api/admin/bi/query`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `ADMIN`
- **التحقق:** Zod Schema ✅

### `/api/admin/compliance`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `ADMIN`
- **جداول مستخدمة:** `complianceAuditLog`

### `/api/admin/e2e-test`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `ADMIN`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `customer`

### `/api/admin/knowledge`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `ADMIN`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `knowledgeDocument`

### `/api/admin/llm-costs`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `ADMIN`
- **جداول مستخدمة:** `promptUsageLog`

### `/api/admin/nodes/backup`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `ADMIN`

### `/api/admin/nodes/billing`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `ADMIN`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `tenantAccount`

### `/api/admin/nodes`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `ADMIN`
- **جداول مستخدمة:** `tenantAccount`

### `/api/admin/nodes/sync`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `ADMIN`

### `/api/admin/orchestration`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `ADMIN`
- **جداول مستخدمة:** `sagaTransaction`, `eventLog`, `q2CJourney`, `p2PJourney`, `h2RJourney`, `r2RJourney`, `o2DJourney`, `planToProduceJourney`, `a2RJourney`, `i2RJourney`

### `/api/admin/prompts`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `ADMIN`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `promptTemplate`

## 📂 `/api/ai` (13 مسار)

### `/api/ai/bank-fraud`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AI`

### `/api/ai/bank-reconciliation`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AI`
- **جداول مستخدمة:** `salesInvoice`

### `/api/ai/cfo`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AI`
- **جداول مستخدمة:** `salesInvoice`, `leaseContract`, `fleetTrip`, `employee`, `student`, `vehicle`

### `/api/ai/chat`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AI`
- **التحقق:** Zod Schema ✅

### `/api/ai/copilot/chat`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AI`
- **جداول مستخدمة:** `aiConversationMessage`, `aiConversation`

### `/api/ai/copilot`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/ai/demand-forecast`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AI`
- **جداول مستخدمة:** `salesInvoiceDetail`, `product`

### `/api/ai/fraud-monitoring`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AI`
- **جداول مستخدمة:** `auditLog`, `salesInvoice`, `treasury`, `setting`

### `/api/ai/ingest`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/ai/nlq`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AI`
- **التحقق:** Zod Schema ✅

### `/api/ai/predictive-scm`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AI`
- **جداول مستخدمة:** `product`, `purchaseOrder`

### `/api/ai/rag`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AI`

### `/api/ai/sales-coach`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AI`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `salesInvoice`

## 📂 `/api/ai-auditor` (1 مسار)

### `/api/ai-auditor`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AI`
- **جداول مستخدمة:** `salesInvoice`, `purchaseInvoice`, `expense`, `setting`

## 📂 `/api/ai-cfo` (2 مسار)

### `/api/ai-cfo/report`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AI`
- **جداول مستخدمة:** `setting`, `salesInvoice`, `purchaseInvoice`, `salesInvoiceDetail`, `product`

### `/api/ai-cfo`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AI`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `setting`

## 📂 `/api/ap` (3 مسار)

### `/api/ap/capture`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/ap/match`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/ap/three-way-match`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/approvals` (5 مسار)

### `/api/approvals/inbox`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/approvals`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `approvalStep`

### `/api/approvals/[id]/approve`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `approvalRequest`

### `/api/approvals/[id]/reject`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `approvalRequest`

### `/api/approvals/[id]`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/ar` (2 مسار)

### `/api/ar/credit`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/ar/dunning`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

## 📂 `/api/assets` (4 مسار)

### `/api/assets/depreciate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/assets/leases/post-monthly`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/assets/leases/[id]/post-inception`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/assets`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `asset`

## 📂 `/api/attendance` (2 مسار)

### `/api/attendance/face-id`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `employee`, `attendance`

### `/api/attendance`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `attendance`

## 📂 `/api/audit` (1 مسار)

### `/api/audit/field-trail`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `user`

## 📂 `/api/audit-logs` (1 مسار)

### `/api/audit-logs`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `auditLog`

## 📂 `/api/auth` (23 مسار)

### `/api/auth/2fa/backup-codes`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AUTH`
- **التحقق:** Zod Schema ✅

### `/api/auth/2fa/login`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AUTH`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `user`

### `/api/auth/2fa/setup`
- **Methods:** POST, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AUTH`
- **التحقق:** Zod Schema ✅

### `/api/auth/2fa/verify`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AUTH`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `user`

### `/api/auth/auto-login`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `AUTH`
- **جداول مستخدمة:** `user`

### `/api/auth/find-tenant-by-email`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `AUTH`

### `/api/auth/login`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `AUTH`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `user`

### `/api/auth/login-by-email`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `AUTH`
- **جداول مستخدمة:** `user`

### `/api/auth/me`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `user`

### `/api/auth/mfa/audit-log`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AUTH`
- **جداول مستخدمة:** `mfaAttempt`

### `/api/auth/mfa/backup-verify`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AUTH`
- **التحقق:** Zod Schema ✅

### `/api/auth/mfa/confirm`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AUTH`
- **التحقق:** Zod Schema ✅

### `/api/auth/mfa/disable`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AUTH`
- **التحقق:** Zod Schema ✅

### `/api/auth/mfa/enroll`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AUTH`
- **التحقق:** Zod Schema ✅

### `/api/auth/mfa/qr-code`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AUTH`
- **جداول مستخدمة:** `user`

### `/api/auth/mfa/regenerate-codes`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AUTH`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `userBackupCode`, `auditLog`

### `/api/auth/mfa/status`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AUTH`
- **جداول مستخدمة:** `user`

### `/api/auth/mfa/trust-device`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AUTH`
- **التحقق:** Zod Schema ✅

### `/api/auth/mfa/trusted-devices/[id]`
- **Methods:** DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AUTH`
- **جداول مستخدمة:** `trustedDevice`, `auditLog`

### `/api/auth/mfa/verify`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AUTH`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `user`

### `/api/auth/sso`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/auth/sso-redirect`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `AUTH`

### `/api/auth/sync`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `AUTH`
- **جداول مستخدمة:** `user`

## 📂 `/api/b2b` (3 مسار)

### `/api/b2b/checkout`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesOrder`

### `/api/b2b/login`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `customer`

### `/api/b2b/shop`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `product`

## 📂 `/api/banks` (5 مسار)

### `/api/banks/import`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `salesInvoice`

### `/api/banks/reconciliation`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/banks`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `bankAccount`, `bankTransaction`

### `/api/banks/[id]`
- **Methods:** PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `bankAccount`, `bankTransaction`

### `/api/banks/[id]/transactions`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `bankTransaction`

## 📂 `/api/batches` (3 مسار)

### `/api/batches/expiry`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `productBatch`

### `/api/batches`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `productBatch`, `stockMovement`, `product`

### `/api/batches/[id]`
- **Methods:** PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `productBatch`

## 📂 `/api/bi` (3 مسار)

### `/api/bi/budget-variance`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/bi/cube`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/bi/kpis`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/bnpl` (4 مسار)

### `/api/bnpl/create-session`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/bnpl/status`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/bnpl/tabby`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `setting`

### `/api/bnpl/tamara`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `setting`

## 📂 `/api/bookings` (2 مسار)

### `/api/bookings/invoice`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `booking`, `product`, `salesInvoice`

### `/api/bookings`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `booking`, `treasury`

## 📂 `/api/branches` (1 مسار)

### `/api/branches`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `branch`, `company`

## 📂 `/api/budgeting` (2 مسار)

### `/api/budgeting/encumbrance`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/budgeting/variance`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `budget`

## 📂 `/api/budgets` (2 مسار)

### `/api/budgets`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/budgets/scenarios`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/categories` (2 مسار)

### `/api/categories`
- **Methods:** GET, POST, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `category`

### `/api/categories/[id]`
- **Methods:** PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `category`, `product`

## 📂 `/api/check-env` (1 مسار)

### `/api/check-env`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/clinic` (3 مسار)

### `/api/clinic/appointments`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `appointment`, `employee`, `customer`, `clinicRoom`

### `/api/clinic/erx`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `medication`, `clinicPrescription`, `employee`, `customer`

### `/api/clinic/lab`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `labOrder`, `labTest`, `employee`, `customer`, `labResult`

## 📂 `/api/cmms` (2 مسار)

### `/api/cmms/schedules`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/cmms/work-orders`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/com` (1 مسار)

### `/api/com/rules`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `commissionRule`

## 📂 `/api/compliance` (3 مسار)

### `/api/compliance/audits`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/compliance/risks`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/compliance/rules`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/contracts` (4 مسار)

### `/api/contracts/alerts`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `leaseContract`, `systemAlert`

### `/api/contracts/renewals`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/contracts`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/contracts/templates`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/copa` (4 مسار)

### `/api/copa/allocations`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/copa/characteristics`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `copaCharacteristic`

### `/api/copa`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/copa/value-fields`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/coupons` (3 مسار)

### `/api/coupons`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `coupon`

### `/api/coupons/validate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `coupon`

### `/api/coupons/[id]`
- **Methods:** PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `coupon`, `couponUsage`

## 📂 `/api/cpq` (1 مسار)

### `/api/cpq`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/credit-check` (1 مسار)

### `/api/credit-check`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/crm` (23 مسار)

### `/api/crm/accounts`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/crm/activities`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/crm/campaigns`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/crm/customer-health`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/crm/customer360`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/crm/forecast`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/crm/help-desk`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/crm/kb`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/crm/leads`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `lead`

### `/api/crm/leads/[id]/convert`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/crm/marketing`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/crm/omnichannel`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/crm/opportunities`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `pipelineStage`, `opportunity`, `crmAccount`

### `/api/crm/opportunities/[id]/win`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/crm/portal`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/crm/sla`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/crm/surveys`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/crm/territory`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/crm/tickets`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/crm/whatsapp/broadcast`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `setting`, `customer`, `user`

### `/api/crm/whatsapp`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `setting`

### `/api/crm/whatsapp/sessions`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `setting`

### `/api/crm/whatsapp/webhook`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `setting`, `product`

## 📂 `/api/cron` (29 مسار)

### `/api/cron/approval-sla`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/cron/ar-collection-dunning`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/cron/backup`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `salesInvoice`, `customer`, `product`, `employee`, `journalEntry`, `auditLog`

### `/api/cron/contract-expiry`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `supplierContract`, `systemAlert`

### `/api/cron/contracts`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `supplierContract`

### `/api/cron/cycle-count`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `stocktake`

### `/api/cron/daily-audit`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/cron/debts`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `installmentPayment`, `customer`

### `/api/cron/depreciation-monthly`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/cron/document-expiry`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`

### `/api/cron/ecl`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `systemAlert`

### `/api/cron/fx-revaluation`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/cron/hr`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `employee`, `attendance`

### `/api/cron/ifrs16-monthly`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/cron/payment-reminders`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/cron/payroll-monthly`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/cron/predictive-po`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `productStock`, `purchaseOrderDetail`, `product`, `purchaseOrder`

### `/api/cron/prepayments-amortization`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/cron/recurring-billing`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/cron/rem-leases`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `rentInstallment`, `leaseContract`

### `/api/cron/reorder-alerts`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `product`, `systemAlert`

### `/api/cron/scheduled-reports`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `salesInvoice`, `purchaseInvoice`, `expense`, `product`, `setting`

### `/api/cron/self-healer`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `salesInvoice`

### `/api/cron/shifts`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `shift`, `treasury`

### `/api/cron/trigger-invoices`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `salesOrder`, `salesInvoice`

### `/api/cron/vat-return-reminder`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/cron/vendor-scoring`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `vendorRating`

### `/api/cron/zatca-batch-submit`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/cron/zatca-worker`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `CRON`
- **جداول مستخدمة:** `zATCARecord`

## 📂 `/api/customer` (1 مسار)

### `/api/customer/table/[qrToken]`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `restaurantTable`, `waiterCall`

## 📂 `/api/customers` (6 مسار)

### `/api/customers`
- **Methods:** GET, POST, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `customer`

### `/api/customers/[id]/credit`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/customers/[id]/gdpr-delete`
- **Methods:** DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `customer`, `auditLog`

### `/api/customers/[id]/hold`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `customer`, `documentStateLog`

### `/api/customers/[id]`
- **Methods:** GET, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `customer`

### `/api/customers/[id]/statement`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/dashboard` (1 مسار)

### `/api/dashboard`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesInvoice`, `expense`, `approvalRequest`, `product`

## 📂 `/api/delivery-platforms` (1 مسار)

### `/api/delivery-platforms`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/desktop` (1 مسار)

### `/api/desktop/verify-license`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `desktopLicense`

## 📂 `/api/dms` (1 مسار)

### `/api/dms`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/docs` (2 مسار)

### `/api/docs/openapi.json`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/docs`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/documents` (3 مسار)

### `/api/documents`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `documentArchive`

### `/api/documents/transition`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/documents/[id]`
- **Methods:** DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `documentArchive`

## 📂 `/api/ecommerce` (3 مسار)

### `/api/ecommerce/orders`
- **Methods:** GET, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/ecommerce/stores`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/ecommerce/sync`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `product`, `customer`, `salesInvoice`

## 📂 `/api/email` (1 مسار)

### `/api/email`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/employees` (2 مسار)

### `/api/employees`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `employee`

### `/api/employees/[id]`
- **Methods:** PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `employee`

## 📂 `/api/enterprise` (9 مسار)

### `/api/enterprise/fleet`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `vehicle`

### `/api/enterprise/legal`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `promissoryNote`, `letterOfGuarantee`, `checkTransaction`

### `/api/enterprise/mrp`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `manufacturingOrder`, `recipe`

### `/api/enterprise/projects/budget`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `project`, `projectBudgetLine`

### `/api/enterprise/projects`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `project`

### `/api/enterprise/projects/tasks`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `projectTask`, `project`

### `/api/enterprise/property`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `property`, `propertyUnit`

### `/api/enterprise/quality`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `qualityInspection`

### `/api/enterprise/wms`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `stock`, `warehouseZone`, `warehouseRack`, `warehouseBin`

## 📂 `/api/esign` (1 مسار)

### `/api/esign`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/events` (2 مسار)

### `/api/events/registrations`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/events`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/expenses` (1 مسار)

### `/api/expenses`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `user`, `expense`

## 📂 `/api/explain` (1 مسار)

### `/api/explain`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/field-service` (2 مسار)

### `/api/field-service/orders`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/field-service`
- **Methods:** GET, POST, PATCH
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/finance` (72 مسار)

### `/api/finance/aging`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/allocation`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/ap-aging`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/aro`
- **Methods:** POST, PUT
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/asset-lifecycle`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `fixedAsset`

### `/api/finance/assets`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `fixedAsset`

### `/api/finance/auto-ecl`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `user`, `salesInvoice`

### `/api/finance/bad-debt`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/balance-sheet`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `account`

### `/api/finance/bank-recon/rules`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `bankReconRule`, `bankAccount`

### `/api/finance/bank-recon/rules/simulate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `bankReconRule`

### `/api/finance/budget`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/budget/variance`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `budget`

### `/api/finance/budget-control`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/finance/budget-upload`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/finance/cash-flow/forecast`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `customer`, `bankAccount`, `cashFlowForecast`

### `/api/finance/cash-flow`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/finance/cash-flow-forecast`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/cash-flow-indirect`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/cashflow`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/cfo`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesInvoice`, `purchaseInvoice`

### `/api/finance/cfo-dashboard`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `user`, `customer`, `product`, `treasury`, `salesInvoice`, `expense`

### `/api/finance/checks`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `checkTransaction`

### `/api/finance/checks/[id]/process`
- **Methods:** PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `checkTransaction`, `account`

### `/api/finance/commitments`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/consolidation/elimination`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `customer`, `consolidationRun`, `consolidationLine`

### `/api/finance/consolidation`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/finance/contract-assets`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/controls`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/finance/copa`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/deferred-tax`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/dunning/history`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/dunning`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesInvoice`

### `/api/finance/dunning/run`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/finance/ecl`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `customer`

### `/api/finance/equity-statement`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/financial-health`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/fs-notes`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/fx-revaluation`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `journalEntry`

### `/api/finance/hedge`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/ifrs16`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/finance/ifrs16-lease`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `ifrsLeaseContract`

### `/api/finance/impairment`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/match/queue`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `invoiceMatchResult`

### `/api/finance/match/[id]/resolve`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/finance/multi-gaap`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/notes-to-fs`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/payment-run/propose`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `purchaseInvoice`, `paymentRun`

### `/api/finance/payment-run`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `paymentRun`

### `/api/finance/payment-run/[id]/approve`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `paymentRun`

### `/api/finance/payment-run/[id]/confirm`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `paymentRun`, `purchaseInvoice`

### `/api/finance/payment-run/[id]`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `paymentRun`

### `/api/finance/payment-run/[id]/send-bank`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `paymentRun`

### `/api/finance/payment-runs/propose`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/finance/payment-runs`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/finance/payment-runs/[id]/approve`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/finance/payment-runs/[id]/execute`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/finance/payment-runs/[id]/submit-for-approval`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/finance/payment-schedule`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesInvoice`, `purchaseInvoice`

### `/api/finance/period-close`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `periodCloseChecklist`

### `/api/finance/period-close/[id]/step`
- **Methods:** PATCH
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `periodCloseChecklist`

### `/api/finance/period-reports`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/petty-cash`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `pettyCashTransaction`

### `/api/finance/petty-cash/[id]/process`
- **Methods:** PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `pettyCashTransaction`, `account`

### `/api/finance/reconciliations`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `bankReconciliation`, `journalLine`

### `/api/finance/reconciliations/[id]`
- **Methods:** PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `bankReconciliation`, `journalLine`

### `/api/finance/rolling-forecast`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/finance/segments`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/transfer-pricing`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/treasury`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/finance/variance`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/finance/wht`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/fiscal-periods` (1 مسار)

### `/api/fiscal-periods`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `auditLog`

## 📂 `/api/fixed-assets` (3 مسار)

### `/api/fixed-assets`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `fixedAsset`

### `/api/fixed-assets/[id]/depreciate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `fixedAsset`, `setting`, `account`

### `/api/fixed-assets/[id]`
- **Methods:** GET, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `fixedAsset`

## 📂 `/api/fleet` (4 مسار)

### `/api/fleet/advanced`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/fleet/fuel`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `fuelLog`

### `/api/fleet/maintenance`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `vehicle`

### `/api/fleet/trips`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `fleetTrip`

## 📂 `/api/fng` (2 مسار)

### `/api/fng/budgets`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `budget`

### `/api/fng/petty-cash-funds`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `pettyCashFund`, `employee`

## 📂 `/api/fsm` (2 مسار)

### `/api/fsm/complete`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `serviceTicket`

### `/api/fsm/tickets`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `serviceTicket`

## 📂 `/api/fx` (1 مسار)

### `/api/fx`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/gaps` (5 مسار)

### `/api/gaps/abc-costing`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/gaps/anomaly`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/gaps/esg`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/gaps/evm`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/gaps/forecast-v2`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/gift-cards` (2 مسار)

### `/api/gift-cards`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `giftCard`

### `/api/gift-cards/[id]`
- **Methods:** PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `giftCard`

## 📂 `/api/grn` (1 مسار)

### `/api/grn`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `product`

## 📂 `/api/health` (1 مسار)

### `/api/health`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/hr` (39 مسار)

### `/api/hr/attendance/punch`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/hr/attendance`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `attendance`

### `/api/hr/comp-review`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/hr/competency`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/hr/documents/expiry`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/hr/documents/expiry/[id]`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/hr/employees`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `employee`

### `/api/hr/eos`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `endOfServiceCalculation`

### `/api/hr/eos/[id]`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/hr/ess`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/hr/evaluations`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `employeeEvaluation`

### `/api/hr/expense-reports`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/hr/gosi/calculate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `payrollRun`, `salary`

### `/api/hr/gosi/file`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `gOSIMonthlyFile`

### `/api/hr/gosi/file/submit`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/hr/gosi`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `employee`, `salary`, `journalEntry`

### `/api/hr/jobs`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `jobPosting`

### `/api/hr/leaves/accrual`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/hr/leaves/balance`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/hr/leaves`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/hr/leaves/[id]`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/hr/lms`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/hr/loans`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `employeeLoan`

### `/api/hr/mudad/compliance`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/hr/mudad/wps/submit/[batchId]`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/hr/okrs`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/hr/org-chart`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `employee`

### `/api/hr/payroll/calculate`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `employee`, `attendance`, `employeeLoan`, `salary`

### `/api/hr/payroll/config`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `setting`, `account`

### `/api/hr/payroll/generate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `employee`, `attendance`, `employeeLoan`

### `/api/hr/payroll/multi-country`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/hr/payroll/run`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `employee`, `setting`, `salary`

### `/api/hr/performance`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `employeeEvaluation`, `employee`

### `/api/hr/recruitment`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/hr/safety`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/hr/succession`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/hr/timesheet`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/hr/training`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `trainingCourse`

### `/api/hr/wps`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `wPSBatch`, `payrollRun`, `employee`

## 📂 `/api/ice` (16 مسار)

### `/api/ice/admin/2fa/disable`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `iceAdmin`, `iceAuditLog`

### `/api/ice/admin/2fa/enable`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `iceAdmin`, `iceAuditLog`

### `/api/ice/admin/2fa/generate`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `iceAdmin`

### `/api/ice/auth/2fa/verify`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `iceAdmin`, `iceLoginLog`

### `/api/ice/auth/login`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `iceAdmin`, `iceLoginLog`

### `/api/ice/auth`
- **Methods:** GET, POST, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `AUTH`

### `/api/ice/backup/download`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/ice/backup/list`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/ice/backup/upload`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `UPLOAD`

### `/api/ice/desktop-licenses`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/ice/desktop-register`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/ice/license/verify`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/ice/subscriptions`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `iceTenantSubscription`, `iceAuditLog`

### `/api/ice/tenant-features`
- **Methods:** GET, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `tenantFeatureFlag`

### `/api/ice/tenants`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/ice/toggle`
- **Methods:** POST, PATCH, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/installments` (1 مسار)

### `/api/installments`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `installment`

## 📂 `/api/integrations` (1 مسار)

### `/api/integrations/mudad`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `wPSBatch`, `payrollRun`

## 📂 `/api/inv` (1 مسار)

### `/api/inv/serials`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `productSerialNumber`

## 📂 `/api/inventory` (18 مسار)

### `/api/inventory/abc-analysis`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/inventory/ai-vision`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `AI`

### `/api/inventory/analytics`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/inventory/batches/expiring`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/inventory/batches/[id]/quarantine`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/inventory/batches/[id]/recall`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/inventory/batches/[id]/release`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/inventory/clear-all`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `productStock`, `product`

### `/api/inventory/costing`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `purchaseInvoiceDetail`, `product`

### `/api/inventory/picking/[id]/confirm`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/inventory/picking/[id]`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesOrder`

### `/api/inventory/products/[id]/variants`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/inventory/putaway/suggest`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/inventory/quality-control`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `qualityInspection`

### `/api/inventory/reorder`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `product`

### `/api/inventory/reorder-rules`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/inventory/stocktake`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/inventory/stocktake/[id]/approve`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `stocktake`, `stocktakeItem`, `product`, `stockMovement`

## 📂 `/api/knowledge` (2 مسار)

### `/api/knowledge/articles`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/knowledge/categories`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/license` (1 مسار)

### `/api/license/verify`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `desktopLicense`

## 📂 `/api/lms` (1 مسار)

### `/api/lms/courses`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/logistics` (2 مسار)

### `/api/logistics/carriers`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/logistics/freight`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/loyalty` (2 مسار)

### `/api/loyalty`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `loyaltyPoint`

### `/api/loyalty/[customerId]/transactions`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `loyaltyTransaction`

## 📂 `/api/maintenance` (2 مسار)

### `/api/maintenance/preventive`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/maintenance`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `maintenance`, `treasury`

## 📂 `/api/manifest` (1 مسار)

### `/api/manifest`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/manufacturing` (40 مسار)

### `/api/manufacturing/aps`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/manufacturing/blockchain-trace`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `qualityCheck`

### `/api/manufacturing/bom`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/manufacturing/boms/versions/[versionId]/activate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `bOMVersion`

### `/api/manufacturing/boms/[id]/versions`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `product`, `recipe`, `bOMVersion`, `engineeringChangeOrder`

### `/api/manufacturing/capa`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `nonConformanceReport`, `correctiveAction`

### `/api/manufacturing/capacity`
- **Methods:** GET, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `machine`, `manufacturingOrder`

### `/api/manufacturing/digital-twin`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `machine`

### `/api/manufacturing/eco`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/manufacturing/kanban`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `manufacturingOrder`

### `/api/manufacturing/labor-efficiency`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `manufacturingOrder`

### `/api/manufacturing/mes`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/manufacturing/mes-oee`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/manufacturing/mps/generate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/manufacturing/mrp`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `manufacturingOrder`, `purchaseRequisition`

### `/api/manufacturing/mrp-run`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `manufacturingOrder`, `machine`

### `/api/manufacturing/oee`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/manufacturing/orders`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `manufacturingOrder`, `recipe`, `machine`

### `/api/manufacturing/orders/[id]`
- **Methods:** PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `manufacturingOrder`

### `/api/manufacturing/orders/[id]/schedule`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/manufacturing/qc`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `machineMaintenance`, `qualityCheck`

### `/api/manufacturing/quality`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/manufacturing/quality-control`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `qualityCheck`, `manufacturingOrder`, `manufacturingCost`

### `/api/manufacturing/quality-management`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/manufacturing/recipes`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `recipe`

### `/api/manufacturing/recipes/[id]`
- **Methods:** PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `recipeIngredient`, `recipe`, `manufacturingOrder`

### `/api/manufacturing`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `manufacturingOrder`, `recipe`

### `/api/manufacturing/routing`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `recipe`, `workCenter`, `recipeOperation`

### `/api/manufacturing/scheduler`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/manufacturing/scrap`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `manufacturingWastage`, `manufacturingOrder`, `product`, `stockMovement`

### `/api/manufacturing/shopfloor`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `shopFloorSession`, `andonCall`

### `/api/manufacturing/sop`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/manufacturing/spc`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/manufacturing/standard-cost`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/manufacturing/stats`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/manufacturing/subcontracting`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/manufacturing/variance`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `varianceTransaction`

### `/api/manufacturing/wip-valuation`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `manufacturingOrder`

### `/api/manufacturing/work-centers`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `workCenter`

### `/api/manufacturing/work-orders`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `manufacturingOrder`

## 📂 `/api/master` (1 مسار)

### `/api/master`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/master-panel` (4 مسار)

### `/api/master-panel/auth`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/master-panel/deploy`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `user`

### `/api/master-panel/licenses`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `desktopLicense`

### `/api/master-panel/servers`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `DEFAULT`

## 📂 `/api/master-panel-data` (1 مسار)

### `/api/master-panel-data`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `tenantAccount`

## 📂 `/api/metrics` (1 مسار)

### `/api/metrics`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/notifications` (1 مسار)

### `/api/notifications/stream`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/openapi` (1 مسار)

### `/api/openapi`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/payments` (1 مسار)

### `/api/payments/charge`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/payroll` (10 مسار)

### `/api/payroll/calculate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `employee`, `employeeLoan`, `attendance`

### `/api/payroll/provisions/run`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/payroll`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/payroll/runs/[id]/post`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/payroll/wps/generate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/payroll/wps/history`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `wPSBatch`

### `/api/payroll/wps`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/payroll/wps/[batchId]/download`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `wPSBatch`

### `/api/payroll/wps/[batchId]/mark-uploaded`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/payroll/[id]`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `payrollInvoice`

## 📂 `/api/pdpl` (3 مسار)

### `/api/pdpl/breach`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/pdpl/dsr`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/pdpl/dsr/[id]/fulfill`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/pharmacy` (6 مسار)

### `/api/pharmacy/drug-interactions`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `pharmacyDrug`

### `/api/pharmacy/drugs`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `product`

### `/api/pharmacy/insurance/journal`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `insuranceClaim`, `journalEntry`

### `/api/pharmacy/insurance`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/pharmacy/patients`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/pharmacy/prescriptions`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `prescription`

## 📂 `/api/planning` (1 مسار)

### `/api/planning/slots`
- **Methods:** GET, POST, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/platform` (9 مسار)

### `/api/platform/dms`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/platform/encryption`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/platform/esignature`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/platform/forms`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/platform/ipaas`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/platform/localization`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/platform/reports`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/platform/sso`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/platform/webhooks`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/portal` (4 مسار)

### `/api/portal/customer`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `customer`, `salesOrder`, `salesInvoice`

### `/api/portal/messages`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/portal/users`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/portal/vendor/rfq/[id]/bid`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `vendorPortalToken`, `vendorBid`, `vendorBidDetail`

## 📂 `/api/portals` (2 مسار)

### `/api/portals/parent`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `student`

### `/api/portals/tenant`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `customer`, `leaseContract`

## 📂 `/api/pos` (13 مسار)

### `/api/pos/bnpl`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/pos/bnpl/status`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/pos/checkout`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `setting`, `salesInvoice`

### `/api/pos/pending-orders`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesInvoice`, `product`

### `/api/pos/products`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `product`, `category`

### `/api/pos/restaurant/floor`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `restaurantZone`, `restaurantTable`, `restaurantSession`, `waiterCall`

### `/api/pos/restaurant/kds`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesInvoice`

### `/api/pos/restaurant/tables`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `restaurantZone`, `restaurantTable`, `waiterCall`

### `/api/pos`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/pos/sessions/close`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/pos/sessions/movement`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/pos/sessions/open`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/pos/sync`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/price-quotes` (1 مسار)

### `/api/price-quotes`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `priceQuote`

## 📂 `/api/procurement` (17 مسار)

### `/api/procurement/ap-ocr`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/procurement/auto-draft`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `user`, `product`, `purchaseOrder`

### `/api/procurement/blanket-po`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/procurement/contracts`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `supplierContract`

### `/api/procurement/dropship`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/procurement/reverse-auction`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/procurement/rfq/[id]/award`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `vendorBid`, `requestForQuotation`, `purchaseOrder`

### `/api/procurement/rfq/[id]/comparison`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `requestForQuotation`, `vendorBid`

### `/api/procurement/rfq/[id]/invite`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `requestForQuotation`, `vendorPortalToken`

### `/api/procurement/rfq/[id]`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `requestForQuotation`, `vendorBid`

### `/api/procurement/rma`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/procurement/spend-analytics`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/procurement/supplier-contracts`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `supplierContract`

### `/api/procurement/supplier-portal`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/procurement/vendor-onboarding`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/procurement/vendor-portal`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `purchaseOrder`

### `/api/procurement/vendors/scorecard`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `vendorRating`, `vendorPortalUser`

## 📂 `/api/product-stocks` (1 مسار)

### `/api/product-stocks/location`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `productStock`

## 📂 `/api/products` (4 مسار)

### `/api/products/export`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `user`, `product`

### `/api/products/import`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `UPLOAD`
- **جداول مستخدمة:** `unit`, `product`, `category`

### `/api/products`
- **Methods:** GET, POST, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `user`, `product`, `setting`, `stock`, `productStock`, `stockMovement`

### `/api/products/[id]`
- **Methods:** GET, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `product`, `stock`, `productStock`, `salesInvoiceDetail`, `purchaseInvoiceDetail`, `stockMovement`

## 📂 `/api/projects` (7 مسار)

### `/api/projects/advanced`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `project`

### `/api/projects/evm`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/projects/milestones`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `projectMilestone`

### `/api/projects/phases`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/projects/resources`
- **Methods:** GET, POST, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `projectResource`

### `/api/projects/risks`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `projectRisk`

### `/api/projects/time-entries`
- **Methods:** GET, POST, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/promotions` (1 مسار)

### `/api/promotions`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `promotion`

## 📂 `/api/public` (4 مسار)

### `/api/public/call-waiter`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesInvoice`

### `/api/public/menu`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `setting`, `product`, `category`

### `/api/public/order`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `product`, `salesInvoice`, `salesInvoiceDetail`

### `/api/public/table`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/purchase-orders` (3 مسار)

### `/api/purchase-orders`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `purchaseOrder`

### `/api/purchase-orders/[id]/landed-costs`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `landedCost`, `purchaseOrder`, `account`

### `/api/purchase-orders/[id]`
- **Methods:** GET, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `purchaseOrder`, `purchaseInvoice`, `landedCost`

## 📂 `/api/purchase-returns` (1 مسار)

### `/api/purchase-returns`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `purchaseReturn`, `user`

## 📂 `/api/purchases` (16 مسار)

### `/api/purchases/drop-ship`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/purchases/grn`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `goodsReceiptNote`, `customer`

### `/api/purchases/letters-of-credit/landed-costs`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **جداول مستخدمة:** `purchaseOrder`, `product`, `stockMovement`, `journalEntry`

### `/api/purchases/letters-of-credit`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `letterOfCredit`

### `/api/purchases/letters-of-credit/[id]`
- **Methods:** PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `letterOfCredit`

### `/api/purchases/matching`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `threeWayMatch`, `purchaseInvoice`, `tolerancePolicy`, `purchaseOrder`, `goodsReceiptNote`

### `/api/purchases/matching/[id]/resolve`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `threeWayMatch`, `purchaseInvoice`

### `/api/purchases/ocr`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **جداول مستخدمة:** `setting`

### `/api/purchases/po/[id]/landed-costs`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `landedCost`

### `/api/purchases/po/[id]/landed-costs/[costId]/allocate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **جداول مستخدمة:** `landedCost`, `purchaseOrder`, `product`

### `/api/purchases/po/[id]`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `purchaseOrder`

### `/api/purchases/requisitions`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `purchaseRequisition`

### `/api/purchases/rfq`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `requestForQuotation`

### `/api/purchases`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `user`, `purchaseInvoice`

### `/api/purchases/three-way-match`
- **Methods:** GET, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/purchases/[id]/receive`
- **Methods:** PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **جداول مستخدمة:** `purchaseInvoice`, `product`, `productStock`

## 📂 `/api/purchasing` (1 مسار)

### `/api/purchasing/three-way-match`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/quality` (2 مسار)

### `/api/quality/calibration`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/quality/stats`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/rebates` (1 مسار)

### `/api/rebates`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/recurring-invoices` (1 مسار)

### `/api/recurring-invoices`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `salesOrder`

## 📂 `/api/rem` (2 مسار)

### `/api/rem/installments`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `rentInstallment`

### `/api/rem/leases`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `leaseContract`

## 📂 `/api/rent` (1 مسار)

### `/api/rent`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/rental` (2 مسار)

### `/api/rental/agreements`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/rental/returns`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/reports` (11 مسار)

### `/api/reports/aging`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/reports/bi-export`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesInvoice`, `purchaseInvoice`, `product`, `customer`

### `/api/reports/cash-flow`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesInvoice`, `purchaseInvoice`, `expense`, `salary`, `treasury`

### `/api/reports/customer-statement`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `customer`, `salesInvoice`, `treasury`

### `/api/reports/dimensional-gl`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `journalLine`

### `/api/reports/export`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `company`, `account`, `journalLine`

### `/api/reports/financial-statements/generate`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/reports/returns`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesReturn`, `stock`

### `/api/reports/what-if`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesInvoice`, `purchaseInvoice`, `expense`

### `/api/reports/zatca-vat`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesInvoice`, `purchaseInvoice`, `salesReturn`, `purchaseReturn`, `setting`

### `/api/reports/[type]`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `user`, `salesInvoice`, `purchaseInvoice`, `product`, `expense`, `customer`, `treasury`, `salesReturn`, `purchaseReturn`, `stockMovement`, `salesInvoiceDetail`

## 📂 `/api/restaurant` (4 مسار)

### `/api/restaurant/pos/resolve`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/restaurant/pos/status`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/restaurant/table/call`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/restaurant/table/info`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/salaries` (1 مسار)

### `/api/salaries`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salary`

## 📂 `/api/sales` (21 مسار)

### `/api/sales/atp/check`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **جداول مستخدمة:** `atpRule`, `atpCheck`

### `/api/sales/commissions/calculate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **جداول مستخدمة:** `commissionRule`, `salesInvoice`, `salesmanCommission`

### `/api/sales/commissions`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/sales/commissions/rules`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `commissionRule`

### `/api/sales/commissions/run`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/sales/delivery-notes`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `deliveryNote`

### `/api/sales/forecast`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/sales/invoices`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `salesInvoice`, `documentStateLog`

### `/api/sales/pricing/calculate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `product`, `customer`, `priceList`

### `/api/sales/pricing`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `priceList`

### `/api/sales/quotes/[id]/accept`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/sales/quotes/[id]/convert-to-so`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/sales/quotes/[id]/revise`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/sales/returns`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `salesReturn`, `documentStateLog`

### `/api/sales/returns/[id]/[action]`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **جداول مستخدمة:** `salesReturn`

### `/api/sales/rma`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/sales/rma/[id]/approve`
- **Methods:** PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`

### `/api/sales`
- **Methods:** GET, POST, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `user`, `salesInvoice`, `customer`

### `/api/sales/routes`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `route`

### `/api/sales/statements/bulk`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **التحقق:** Zod Schema ✅

### `/api/sales/targets`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `salesTarget`, `salesInvoice`

## 📂 `/api/sales-orders` (2 مسار)

### `/api/sales-orders`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `salesOrder`, `purchaseOrder`

### `/api/sales-orders/[id]/process`
- **Methods:** PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesOrder`, `deliveryNote`, `salesInvoice`

## 📂 `/api/sales-returns` (1 مسار)

### `/api/sales-returns`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `salesReturn`

## 📂 `/api/saudi` (5 مسار)

### `/api/saudi/mudad/compliance`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/saudi/nitaqat/projection`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/saudi/qiwa/contracts/[employeeId]`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/saudi/qiwa/sync`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/saudi/saudization/snapshot`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/school` (1 مسار)

### `/api/school`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/search` (1 مسار)

### `/api/search/semantic`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/service` (1 مسار)

### `/api/service/sla`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/settings` (23 مسار)

### `/api/settings/api-keys`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `apiKey`

### `/api/settings/api-keys/[id]`
- **Methods:** PATCH, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `apiKey`

### `/api/settings/approvals`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `approvalRule`

### `/api/settings/approvals/[id]`
- **Methods:** PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `approvalRule`

### `/api/settings/bpm`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/settings/currencies`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `currency`

### `/api/settings/currencies/[id]`
- **Methods:** PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `currency`

### `/api/settings/email-templates`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/settings/exchange-rates`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `exchangeRate`, `currency`

### `/api/settings/exchange-rates/[id]`
- **Methods:** DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `exchangeRate`

### `/api/settings/generate-barcode`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `setting`

### `/api/settings/generate-keys`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `setting`

### `/api/settings/number-sequences`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/settings/numbering`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `numberingSequence`

### `/api/settings/permissions/fields`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `roleFieldPermission`

### `/api/settings/roles`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `user`

### `/api/settings`
- **Methods:** GET, POST, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `setting`

### `/api/settings/scheduled-actions`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/settings/state-machine`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/settings/upload-logo`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `UPLOAD`
- **جداول مستخدمة:** `setting`

### `/api/settings/whatsapp`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `setting`

### `/api/settings/zatca-onboard`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `setting`

### `/api/settings/[key]`
- **Methods:** GET, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `setting`

## 📂 `/api/shifts` (1 مسار)

### `/api/shifts`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `shift`

## 📂 `/api/shipments` (2 مسار)

### `/api/shipments/delivery-notes`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/shipments`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `shipment`

## 📂 `/api/shipping` (1 مسار)

### `/api/shipping`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/shl` (2 مسار)

### `/api/shl/classes`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `academicClass`

### `/api/shl/students`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `student`

## 📂 `/api/smart-transfers` (1 مسار)

### `/api/smart-transfers`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `stockMovement`, `stock`, `productStock`, `product`

## 📂 `/api/stock` (3 مسار)

### `/api/stock/adjustments`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `stockMovement`

### `/api/stock/movements`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `stockMovement`

### `/api/stock`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `productStock`

## 📂 `/api/stock-movements` (1 مسار)

### `/api/stock-movements`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `stockMovement`, `product`

## 📂 `/api/stock-transfers` (1 مسار)

### `/api/stock-transfers`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `stockTransfer`, `productStock`

## 📂 `/api/stocktake` (2 مسار)

### `/api/stocktake`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `stocktake`, `product`

### `/api/stocktake/vision`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `setting`, `product`

## 📂 `/api/subscription-status` (1 مسار)

### `/api/subscription-status`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `user`, `branch`, `subscription`

## 📂 `/api/subscriptions` (5 مسار)

### `/api/subscriptions/cancel`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/subscriptions/plans`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/subscriptions/process-renewals`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/subscriptions`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `tenantAccount`

### `/api/subscriptions/subscribe`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/supply-chain` (2 مسار)

### `/api/supply-chain/rfx-auction`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/supply-chain/vendor-onboarding`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/sys` (3 مسار)

### `/api/sys/alerts`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `systemAlert`

### `/api/sys/desktop-crash`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `desktopCrashReport`

### `/api/sys/health`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/system` (12 مسار)

### `/api/system/comments`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/system/dashboard-builder`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/system/dms`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/system/import-export`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/system/kanban`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/system/notifications`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/system/numbering`
- **Methods:** GET, POST, PATCH, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `numberingSequence`

### `/api/system/pivot`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/system/print-templates`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/system/reset`
- **Methods:** GET, POST, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/system/search`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/system/workflow`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/tax` (1 مسار)

### `/api/tax/wht`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/telegram` (2 مسار)

### `/api/telegram/process`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/telegram/webhook`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `setting`

## 📂 `/api/tenant` (7 مسار)

### `/api/tenant/check-status`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/tenant/create`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `tenantAccount`

### `/api/tenant/hidden-modules`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `setting`

### `/api/tenant/provision`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `user`, `company`, `branch`, `stock`, `customer`, `unit`

### `/api/tenant/seed-company`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/tenant/status`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `tenantAccount`

### `/api/tenant/trial-status`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/test` (1 مسار)

### `/api/test`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `PUBLIC`

## 📂 `/api/test-tenant` (1 مسار)

### `/api/test-tenant`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** لا (عام)
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `product`

## 📂 `/api/test-translation` (1 مسار)

### `/api/test-translation`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/translate` (1 مسار)

### `/api/translate`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/transliterate` (1 مسار)

### `/api/transliterate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/treasury` (12 مسار)

### `/api/treasury/balance`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `treasury`

### `/api/treasury/bank-import`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/treasury/bank-recon`
- **Methods:** GET, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/treasury/bank-statement`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/treasury/bank-statements`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `bankStatement`, `bankStatementLine`

### `/api/treasury/cash-position`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `cashPositionSnapshot`

### `/api/treasury/cash-position/snapshot`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **جداول مستخدمة:** `bankAccount`, `cashPositionSnapshot`

### `/api/treasury/dashboard`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `treasury`

### `/api/treasury/liquidity/forecast/generate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **جداول مستخدمة:** `liquidityScenario`, `liquidityForecast`

### `/api/treasury/liquidity/forecast`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `liquidityScenario`, `liquidityForecast`

### `/api/treasury/recon-exceptions`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/treasury`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `user`, `treasury`

## 📂 `/api/units` (1 مسار)

### `/api/units`
- **Methods:** GET, POST, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `unit`

## 📂 `/api/upload` (1 مسار)

### `/api/upload`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `UPLOAD`

## 📂 `/api/users` (1 مسار)

### `/api/users`
- **Methods:** GET, POST, PUT, PATCH, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `user`, `userPermission`

## 📂 `/api/v2` (1 مسار)

### `/api/v2/sales/invoices`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `FINANCIAL`
- **جداول مستخدمة:** `user`

## 📂 `/api/v3` (17 مسار)

### `/api/v3/clinic/appointments`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/v3/clinic/emr`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `clinicPatientRecord`

### `/api/v3/clinic/erx`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/v3/clinic/lab`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/v3/construction/boq`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `constructionBOQ`

### `/api/v3/construction/progress-billing`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/v3/construction/variations`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/v3/distribution/picking/wave`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/v3/distribution/routes`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/v3/distribution/wms`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `distributionRoute`

### `/api/v3/manufacturing/mrp`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `manufacturingBOM`

### `/api/v3/manufacturing/shopfloor`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/v3/realestate/leases`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `realEstateLease`

### `/api/v3/restaurant/kds`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `restaurantKDSTicket`

### `/api/v3/retail/pos`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `retailPOSOrder`

### `/api/v3/school/sis`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `schoolStudent`

### `/api/v3/services/timesheet`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `serviceTimesheet`

## 📂 `/api/vacations` (1 مسار)

### `/api/vacations`
- **Methods:** GET, POST, PUT
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `vacation`

## 📂 `/api/vat` (1 مسار)

### `/api/vat/categories`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/vendor-portal` (1 مسار)

### `/api/vendor-portal`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/vendor-ratings` (1 مسار)

### `/api/vendor-ratings`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/vendors` (2 مسار)

### `/api/vendors/scorecard`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/vendors/[id]/statement`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/version` (1 مسار)

### `/api/version`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/warehouse` (2 مسار)

### `/api/warehouse/cross-dock`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/warehouse/slotting`
- **Methods:** GET, POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/warehouses` (4 مسار)

### `/api/warehouses/analytics`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `productStock`

### `/api/warehouses`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `stock`

### `/api/warehouses/wms`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `warehouseZone`, `productStock`, `warehouseRack`, `warehouseBin`

### `/api/warehouses/[id]`
- **Methods:** GET, PUT, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `stock`

## 📂 `/api/warranty` (1 مسار)

### `/api/warranty/check`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

## 📂 `/api/webhooks` (5 مسار)

### `/api/webhooks`
- **Methods:** POST
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/webhooks/salla`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `setting`, `salesInvoice`, `stock`

### `/api/webhooks/zid`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `setting`, `salesInvoice`, `product`, `customer`, `treasury`

### `/api/webhooks/[id]/rotate-secret`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/webhooks/[id]`
- **Methods:** PATCH, DELETE
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/whatsapp` (1 مسار)

### `/api/whatsapp/interactive`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `user`, `approvalStep`, `approvalRequest`

## 📂 `/api/wht` (2 مسار)

### `/api/wht/calculate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/wht/form14/generate`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/wms` (1 مسار)

### `/api/wms/waves`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/work-shifts` (1 مسار)

### `/api/work-shifts`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

## 📂 `/api/zakat` (5 مسار)

### `/api/zakat/assessments`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `zakatAssessment`

### `/api/zakat/assessments/[id]/adjustments`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/zakat/assessments/[id]/file`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/zakat/assessments/[id]/finalize`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/zakat/assessments/[id]`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `zakatAssessment`

## 📂 `/api/zatca` (8 مسار)

### `/api/zatca/generate-request`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/zatca/late-submissions`
- **Methods:** GET
- **حماية:** ⚠️ بدون حماية
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **جداول مستخدمة:** `salesInvoice`

### `/api/zatca/onboard`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `setting`

### `/api/zatca/qr`
- **Methods:** POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `salesInvoice`, `setting`

### `/api/zatca/reverse-charge`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅

### `/api/zatca`
- **Methods:** GET, POST
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `setting`

### `/api/zatca/test`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`

### `/api/zatca/xml`
- **Methods:** GET
- **حماية:** `withRoute` ✅
- **مصادقة مطلوبة:** نعم
- **Rate Limit:** `DEFAULT`
- **التحقق:** Zod Schema ✅
- **جداول مستخدمة:** `salesInvoice`

