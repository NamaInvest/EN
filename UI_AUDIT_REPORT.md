# 🛡️ التقرير الشامل لفحص واجهات النظام (UI Audit Report)

هذا التقرير يعرض حالة جميع الأقسام وفروع الأقسام في النظام للتأكد من ربط الأزرار والتعريب:

| القسم / الملف (Module) | 🖱️ الأزرار | 🔄 الأزرار المفعلة | 🌐 التعريب (i18n) | ⚠️ نصوص غير معربة |
|---|---|---|---|---|
| `layout.tsx` | 0 | ✅ 0 (مكتمل) | ❌ غير مدعوم | 🔴 1 سطر |
| `accounting/page.tsx` | 18 | ✅ 18 (مكتمل) | ✅ مدعوم | 🔴 39 سطر |
| `accounting/banks/page.tsx` | 6 | ✅ 6 (مكتمل) | ✅ مدعوم | 🔴 2 سطر |
| `accounting/banks/[id]/page.tsx` | 6 | ✅ 6 (مكتمل) | ✅ مدعوم | 🔴 1 سطر |
| `accounting/dunning/page.tsx` | 6 | ✅ 6 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `accounting/lc/page.tsx` | 3 | ✅ 3 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `accounting/leases/page.tsx` | 4 | 🔴 0 (نقص) | ❌ غير مدعوم | ✅ 0 |
| `accounting/revenue-recognition/page.tsx` | 1 | 🔴 0 (نقص) | ❌ غير مدعوم | ✅ 0 |
| `accounting/trial-balance/page.tsx` | 1 | ✅ 1 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `affiliates/page.tsx` | 2 | ✅ 2 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `ai-bank/page.tsx` | 1 | ✅ 1 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `ai-cfo/page.tsx` | 1 | ✅ 1 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `ai-scm/page.tsx` | 1 | ✅ 1 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `approvals/page.tsx` | 3 | ✅ 3 (مكتمل) | ✅ مدعوم | 🔴 8 سطر |
| `assets/page.tsx` | 4 | ✅ 4 (مكتمل) | ✅ مدعوم | 🔴 1 سطر |
| `attendance/page.tsx` | 2 | ✅ 2 (مكتمل) | ✅ مدعوم | 🔴 2 سطر |
| `audit-logs/page.tsx` | 1 | ✅ 1 (مكتمل) | ✅ مدعوم | 🔴 1 سطر |
| `barcode/page.tsx` | 4 | ✅ 4 (مكتمل) | ✅ مدعوم | 🔴 3 سطر |
| `batches/page.tsx` | 6 | ✅ 6 (مكتمل) | ✅ مدعوم | 🔴 3 سطر |
| `bookings/page.tsx` | 8 | ✅ 8 (مكتمل) | ✅ مدعوم | 🔴 3 سطر |
| `bookings/calendar/page.tsx` | 4 | ✅ 4 (مكتمل) | ✅ مدعوم | 🔴 2 سطر |
| `branches/page.tsx` | 6 | ✅ 6 (مكتمل) | ✅ مدعوم | 🔴 2 سطر |
| `com/rules/page.tsx` | 1 | 🔴 0 (نقص) | ❌ غير مدعوم | 🔴 6 سطر |
| `coupons/page.tsx` | 9 | ✅ 9 (مكتمل) | ✅ مدعوم | 🔴 1 سطر |
| `crm/leads/page.tsx` | 6 | 🔴 5 (نقص) | ✅ مدعوم | 🔴 2 سطر |
| `customers/page.tsx` | 7 | ✅ 7 (مكتمل) | ✅ مدعوم | 🔴 3 سطر |
| `dashboard/page.tsx` | 2 | ✅ 2 (مكتمل) | ✅ مدعوم | 🔴 2 سطر |
| `employees/page.tsx` | 6 | ✅ 6 (مكتمل) | ✅ مدعوم | 🔴 3 سطر |
| `enterprise/fleet/page.tsx` | 4 | ✅ 4 (مكتمل) | ✅ مدعوم | 🔴 2 سطر |
| `enterprise/legal/page.tsx` | 7 | 🔴 6 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `enterprise/mrp/page.tsx` | 7 | 🔴 6 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `enterprise/mrp/recipes/page.tsx` | 7 | 🔴 6 (نقص) | ✅ مدعوم | 🔴 2 سطر |
| `enterprise/projects/page.tsx` | 8 | 🔴 6 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `enterprise/projects/[id]/page.tsx` | 8 | 🔴 7 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `enterprise/property/page.tsx` | 4 | ✅ 4 (مكتمل) | ✅ مدعوم | 🔴 2 سطر |
| `enterprise/quality/page.tsx` | 4 | ✅ 4 (مكتمل) | ✅ مدعوم | 🔴 2 سطر |
| `enterprise/wms/page.tsx` | 9 | 🔴 7 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `expenses/page.tsx` | 7 | ✅ 7 (مكتمل) | ✅ مدعوم | 🔴 7 سطر |
| `finance/assets/page.tsx` | 4 | 🔴 2 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `finance/cfo-ai/page.tsx` | 2 | 🔴 0 (نقص) | ❌ غير مدعوم | 🔴 18 سطر |
| `fixed-assets/page.tsx` | 10 | ✅ 10 (مكتمل) | ✅ مدعوم | 🔴 1 سطر |
| `fleet/fuel/page.tsx` | 1 | 🔴 0 (نقص) | ✅ مدعوم | ✅ 0 |
| `fleet/trips/page.tsx` | 1 | 🔴 0 (نقص) | ✅ مدعوم | ✅ 0 |
| `fng/budgets/page.tsx` | 6 | 🔴 5 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `fng/petty-cash-funds/page.tsx` | 6 | 🔴 5 (نقص) | ✅ مدعوم | 🔴 2 سطر |
| `gift-cards/page.tsx` | 6 | ✅ 6 (مكتمل) | ✅ مدعوم | 🔴 1 سطر |
| `hr/ai-enrollment/page.tsx` | 4 | ✅ 4 (مكتمل) | ✅ مدعوم | 🔴 14 سطر |
| `hr/attendance/page.tsx` | 2 | ✅ 2 (مكتمل) | ❌ غير مدعوم | 🔴 21 سطر |
| `hr/evaluations/page.tsx` | 4 | 🔴 3 (نقص) | ✅ مدعوم | 🔴 9 سطر |
| `hr/gosi/page.tsx` | 3 | ✅ 3 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `hr/jobs/page.tsx` | 3 | ✅ 3 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `hr/loans/page.tsx` | 3 | 🔴 2 (نقص) | ❌ غير مدعوم | 🔴 29 سطر |
| `hr/payroll-process/page.tsx` | 5 | 🔴 4 (نقص) | ❌ غير مدعوم | 🔴 24 سطر |
| `hr/payslip/[id]/page.tsx` | 2 | ✅ 2 (مكتمل) | ❌ غير مدعوم | 🔴 18 سطر |
| `hr/training/page.tsx` | 4 | 🔴 3 (نقص) | ✅ مدعوم | 🔴 2 سطر |
| `hr/wps/page.tsx` | 3 | ✅ 3 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `inv/serials/page.tsx` | 1 | 🔴 0 (نقص) | ✅ مدعوم | ✅ 0 |
| `loyalty/page.tsx` | 7 | ✅ 7 (مكتمل) | ✅ مدعوم | 🔴 2 سطر |
| `maintenance/page.tsx` | 6 | ✅ 6 (مكتمل) | ✅ مدعوم | 🔴 2 سطر |
| `manufacturing/blockchain-trace/page.tsx` | 1 | ✅ 1 (مكتمل) | ❌ غير مدعوم | 🔴 4 سطر |
| `manufacturing/bom/page.tsx` | 3 | 🔴 0 (نقص) | ❌ غير مدعوم | ✅ 0 |
| `manufacturing/digital-twin/page.tsx` | 2 | 🔴 1 (نقص) | ❌ غير مدعوم | 🔴 11 سطر |
| `manufacturing/labor-efficiency/page.tsx` | 0 | ✅ 0 (مكتمل) | ❌ غير مدعوم | 🔴 10 سطر |
| `manufacturing/lean-kanban/page.tsx` | 2 | ✅ 2 (مكتمل) | ❌ غير مدعوم | 🔴 23 سطر |
| `manufacturing/mrp-dashboard/page.tsx` | 1 | 🔴 0 (نقص) | ❌ غير مدعوم | 🔴 29 سطر |
| `manufacturing/mrp-engine/page.tsx` | 3 | 🔴 1 (نقص) | ❌ غير مدعوم | 🔴 21 سطر |
| `manufacturing/qc/page.tsx` | 2 | 🔴 1 (نقص) | ❌ غير مدعوم | 🔴 20 سطر |
| `manufacturing/scheduler/page.tsx` | 0 | ✅ 0 (مكتمل) | ❌ غير مدعوم | 🔴 7 سطر |
| `manufacturing/work-centers/page.tsx` | 2 | 🔴 1 (نقص) | ❌ غير مدعوم | 🔴 16 سطر |
| `manufacturing/work-orders/page.tsx` | 4 | 🔴 3 (نقص) | ❌ غير مدعوم | 🔴 28 سطر |
| `payroll/wps/page.tsx` | 3 | ✅ 3 (مكتمل) | ❌ غير مدعوم | ✅ 0 |
| `price-quotes/page.tsx` | 10 | ✅ 10 (مكتمل) | ✅ مدعوم | 🔴 28 سطر |
| `products/page.tsx` | 22 | 🔴 21 (نقص) | ✅ مدعوم | 🔴 23 سطر |
| `promotions/page.tsx` | 4 | ✅ 4 (مكتمل) | ✅ مدعوم | 🔴 2 سطر |
| `purchase-orders/page.tsx` | 10 | 🔴 9 (نقص) | ✅ مدعوم | 🔴 9 سطر |
| `purchase-orders/[id]/landed-costs/page.tsx` | 3 | 🔴 2 (نقص) | ✅ مدعوم | 🔴 3 سطر |
| `purchase-returns/page.tsx` | 3 | ✅ 3 (مكتمل) | ✅ مدعوم | 🔴 1 سطر |
| `purchases/page.tsx` | 39 | 🔴 25 (نقص) | ✅ مدعوم | 🔴 11 سطر |
| `purchases/grn/page.tsx` | 7 | 🔴 4 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `purchases/letters-of-credit/page.tsx` | 6 | 🔴 5 (نقص) | ✅ مدعوم | 🔴 3 سطر |
| `purchases/matching/page.tsx` | 6 | 🔴 1 (نقص) | ❌ غير مدعوم | ✅ 0 |
| `purchases/options/page.tsx` | 0 | ✅ 0 (مكتمل) | ✅ مدعوم | 🔴 5 سطر |
| `purchases/requisitions/page.tsx` | 8 | 🔴 4 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `purchases/rfq/page.tsx` | 8 | 🔴 4 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `purchases/three-way-match/page.tsx` | 7 | ✅ 7 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `receipt-vouchers/page.tsx` | 2 | ✅ 2 (مكتمل) | ✅ مدعوم | 🔴 2 سطر |
| `recurring-invoices/page.tsx` | 2 | ✅ 2 (مكتمل) | ✅ مدعوم | 🔴 1 سطر |
| `rem/installments/page.tsx` | 1 | ✅ 1 (مكتمل) | ❌ غير مدعوم | 🔴 14 سطر |
| `rem/leases/page.tsx` | 1 | ✅ 1 (مكتمل) | ❌ غير مدعوم | 🔴 13 سطر |
| `rent/page.tsx` | 3 | 🔴 2 (نقص) | ❌ غير مدعوم | 🔴 19 سطر |
| `reports/page.tsx` | 17 | 🔴 16 (نقص) | ✅ مدعوم | 🔴 18 سطر |
| `reports/104-modules/page.tsx` | 3 | ✅ 3 (مكتمل) | ❌ غير مدعوم | 🔴 118 سطر |
| `reports/73-modules/page.tsx` | 3 | ✅ 3 (مكتمل) | ❌ غير مدعوم | 🔴 118 سطر |
| `reports/builder/page.tsx` | 6 | 🔴 0 (نقص) | ❌ غير مدعوم | ✅ 0 |
| `reports/fraud-ai/page.tsx` | 1 | ✅ 1 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `reports/manual-purchases/page.tsx` | 1 | ✅ 1 (مكتمل) | ✅ مدعوم | 🔴 20 سطر |
| `reports/zatca-vat/page.tsx` | 2 | ✅ 2 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `salaries/page.tsx` | 1 | ✅ 1 (مكتمل) | ✅ مدعوم | 🔴 8 سطر |
| `sales/page.tsx` | 41 | ✅ 41 (مكتمل) | ✅ مدعوم | 🔴 28 سطر |
| `sales/cash-application/page.tsx` | 7 | 🔴 1 (نقص) | ❌ غير مدعوم | ✅ 0 |
| `sales/delivery-notes/page.tsx` | 6 | 🔴 4 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `sales/history/page.tsx` | 3 | 🔴 2 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `sales/options/page.tsx` | 5 | ✅ 5 (مكتمل) | ❌ غير مدعوم | 🔴 42 سطر |
| `sales/orders/page.tsx` | 8 | 🔴 7 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `sales/orders/create/page.tsx` | 5 | 🔴 4 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `sales/routes/page.tsx` | 3 | 🔴 2 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `sales/targets/page.tsx` | 3 | 🔴 2 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `sales-returns/page.tsx` | 4 | ✅ 4 (مكتمل) | ✅ مدعوم | 🔴 1 سطر |
| `school/page.tsx` | 3 | 🔴 2 (نقص) | ❌ غير مدعوم | 🔴 18 سطر |
| `settings/page.tsx` | 21 | ✅ 21 (مكتمل) | ✅ مدعوم | 🔴 154 سطر |
| `settings/approvals/page.tsx` | 6 | ✅ 6 (مكتمل) | ✅ مدعوم | 🔴 6 سطر |
| `settings/bpm/page.tsx` | 2 | ✅ 2 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `settings/company/page.tsx` | 6 | 🔴 5 (نقص) | ✅ مدعوم | 🔴 14 سطر |
| `settings/currencies/page.tsx` | 6 | ✅ 6 (مكتمل) | ✅ مدعوم | 🔴 2 سطر |
| `shifts/page.tsx` | 9 | ✅ 9 (مكتمل) | ✅ مدعوم | 🔴 1 سطر |
| `shl/classes/page.tsx` | 1 | 🔴 0 (نقص) | ✅ مدعوم | ✅ 0 |
| `shl/students/page.tsx` | 1 | 🔴 0 (نقص) | ✅ مدعوم | ✅ 0 |
| `smart-transfers/page.tsx` | 5 | 🔴 4 (نقص) | ✅ مدعوم | 🔴 2 سطر |
| `stock/page.tsx` | 2 | ✅ 2 (مكتمل) | ✅ مدعوم | 🔴 1 سطر |
| `stock/adjustments/page.tsx` | 3 | 🔴 2 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `stock/movements/page.tsx` | 1 | ✅ 1 (مكتمل) | ✅ مدعوم | 🔴 1 سطر |
| `stock-transfers/page.tsx` | 0 | ✅ 0 (مكتمل) | ✅ مدعوم | 🔴 2 سطر |
| `stocktake/page.tsx` | 4 | ✅ 4 (مكتمل) | ✅ مدعوم | 🔴 3 سطر |
| `stocktake/vision/page.tsx` | 5 | ✅ 5 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `sys/alerts/page.tsx` | 1 | 🔴 0 (نقص) | ✅ مدعوم | ✅ 0 |
| `sys/health/page.tsx` | 1 | ✅ 1 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `treasury/page.tsx` | 5 | ✅ 5 (مكتمل) | ✅ مدعوم | 🔴 2 سطر |
| `treasury/bank-recon/page.tsx` | 4 | 🔴 0 (نقص) | ❌ غير مدعوم | ✅ 0 |
| `treasury/bank-reconciliation/page.tsx` | 3 | 🔴 2 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `treasury/cash-flow/page.tsx` | 1 | 🔴 0 (نقص) | ❌ غير مدعوم | ✅ 0 |
| `treasury/checks/page.tsx` | 9 | 🔴 8 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `treasury/petty-cash/page.tsx` | 7 | 🔴 6 (نقص) | ✅ مدعوم | 🔴 1 سطر |
| `vacations/page.tsx` | 5 | ✅ 5 (مكتمل) | ✅ مدعوم | 🔴 4 سطر |
| `warehouses/page.tsx` | 5 | 🔴 4 (نقص) | ✅ مدعوم | ✅ 0 |
| `warehouses/alerts/page.tsx` | 2 | ✅ 2 (مكتمل) | ✅ مدعوم | ✅ 0 |
| `warehouses/options/page.tsx` | 4 | ✅ 4 (مكتمل) | ✅ مدعوم | 🔴 11 سطر |
| `whatsapp-hub/page.tsx` | 1 | ✅ 1 (مكتمل) | ✅ مدعوم | 🔴 1 سطر |

## 📊 ملخص الفحص

- **إجمالي الملفات المفحوصة ذات الصلة:** 137
- **إجمالي الأزرار في النظام:** 674
- **الأزرار التفاعلية (المربوطة بـ onClick):** 565
- **نسبة التفاعل:** %83.8