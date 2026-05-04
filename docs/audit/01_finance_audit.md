# تقرير فحص الموديولات المالية — Namasoft ERP

**تاريخ الفحص:** 2026-05-04
**الطريقة:** قراءة فعلية لكود route.ts و engine.ts (وليس بالاعتماد على أسماء الملفات)

---

## 1. القيود اليومية (Journal Entries)
**API:** `src/app/api/accounting/journal/route.ts` | **Engine:** `src/lib/auto-journal.ts`
**الحالة:** ✅ FULL

**الجاهز فعلاً:**
- GET مع تصفية حسب التاريخ والحالة (DRAFT, POSTED, REVERSED)
- POST لإنشاء قيود يدوية مع التحقق من التوازن المزدوج
- منع الإدخال اليدوي على حسابات الرقابة (عملاء، موردين، مخزون)
- Auto-journal يدعم 13 سيناريو
- Governance Guard مع تسجيل الانتهاكات

**الفجوات:**
- لا multi-currency revaluation inline
- لا approval workflow متقدم
- لا Mass Reverse / Mass Post

---

## 2. شجرة الحسابات (Chart of Accounts)
**API:** `src/app/api/accounting/accounts/route.ts`
**الحالة:** ✅ FULL

**الجاهز:**
- CRUD كامل مع فحص التكرار
- Hierarchical (parent-child)
- منع حذف حساب له حركات

**الفجوات:**
- لا normal-balance side validation
- لا segment/dimension support
- لا account templates per country (IFRS/SOCPA presets)

---

## 3. الميزانية العمومية (Balance Sheet)
**API:** `src/app/api/accounting/balance-sheet/route.ts`
**الحالة:** ✅ FULL

**الجاهز:**
- حساب الأصول والخصوم والحقوق
- Retained Earnings تلقائي
- فحص التوازن

**الفجوات:**
- لا comparative (PY vs CY)
- لا Statement of Changes in Equity
- لا Notes to FS

---

## 4. قائمة الدخل (Income Statement)
**API:** `src/app/api/accounting/income-statement/route.ts`
**الحالة:** ✅ FULL

**الفجوات:**
- لا تفاصيل بالقسم/خط المنتج
- لا margin analysis
- لا comparative reporting

---

## 5. دفتر الأستاذ (General Ledger)
**API:** `src/app/api/accounting/ledger/route.ts`
**الحالة:** ✅ FULL

**الفجوات:**
- لا reconciliation details
- لا PDF export

---

## 6. ميزان المراجعة (Trial Balance)
**API:** `src/app/api/accounting/trial-balance/route.ts`
**الحالة:** ✅ FULL

**الفجوات:**
- لا comparative trial balance

---

## 7. إغلاق الفترة (Period Close)
**API:** `src/app/api/accounting/closing/route.ts` | **Engine:** `src/lib/period-close.ts`
**الحالة:** 🟡 PARTIAL

**الجاهز:** Soft Close + Checklist + Lock
**الفجوات:**
- لا Reversals of Opening Balances تلقائياً
- لا حساب Retained Earnings تلقائياً
- لا sub-ledger reconciliation step

---

## 8. عكس القيود (Journal Reversal)
**API:** `src/app/api/accounting/reversal/route.ts`
**الحالة:** ✅ FULL

---

## 9. التوحيد (Consolidation)
**API:** `src/app/api/accounting/consolidation/run/route.ts` | **Engine:** `src/lib/consolidation-engine.ts`
**الحالة:** 🟡 PARTIAL (Engine stub جزئي)

**الفجوات:**
- لا CTA الفعلي (IAS 21)
- لا NCI الفعلي (IFRS 10)
- لا inter-company eliminations متقدمة
- لا 3-level hierarchies

---

## 10. إعادة تقييم العملات (FX Revaluation)
**API:** `src/app/api/accounting/fx-revaluation/run/route.ts` | **Engine:** `src/lib/fx-revaluation.ts`
**الحالة:** 🟡 PARTIAL

**الفجوات الحرجة:**
- الأسعار **hardcoded** (3.75 / 3.78)
- لا تطبيق فعلي على AR/AP المفتوحة
- لا auto-reverse next period

---

## 11. الاعتراف بالإيراد (Revenue Recognition)
**API:** `src/app/api/accounting/revenue-recognition/route.ts` | **Engine:** `src/lib/revenue-recognition.ts`
**الحالة:** 🟡 PARTIAL

**الفجوات:**
- لا IFRS 15 / ASC 606 كامل
- لا performance obligations متقدمة
- لا milestone-based recognition

---

## 12. التخصيص (Cost Allocation)
**API:** `src/app/api/accounting/allocations/run/route.ts` | **Engine:** `src/lib/allocation-engine.ts`
**الحالة:** 🟡 PARTIAL

**الفجوات:**
- لا Step-down / Reciprocal allocations
- لا Cost Driver selection
- Engine = skeleton

---

## 13. ضبط الموازنة (Budget Control)
**API:** `src/app/api/accounting/budget/check/route.ts` | **Engine:** `src/lib/budget-control.ts`
**الحالة:** 🟡 PARTIAL

**الفجوات:**
- لا enforcement فعلي عند الترحيل
- لا budget versions
- لا multi-year budgeting

---

## 14. تحليل الفروقات (Variance Analysis)
**Engine:** `src/lib/variance-engine.ts` | **API:** ⚪ غير موجود | **Page:** ⚪ غير موجودة
**الحالة:** 🟡 PARTIAL

**الفجوات:**
- لا API route
- لا Page UI
- لا Volume/Efficiency Variance
- لا Flexible Budget

---

## 15. التنبؤ بالتدفق النقدي (Cash Flow Forecasting)
**API:** `src/app/api/finance/cash-flow/route.ts` + `accounting/cashflow/forecast/route.ts`
**Engine:** `src/lib/cash-flow-forecasting.ts` + `src/lib/cashflow-engine.ts`
**الحالة:** 🟡 PARTIAL

**الفجوات:**
- لا تحديثات يومية تلقائية
- لا sensitivity analysis
- لا integration مع موازنة المصروفات

---

## 16. الأصول الثابتة (Fixed Assets)
**API:** `src/app/api/fixed-assets/route.ts` + `src/app/api/assets/route.ts`
**Engine:** `src/lib/fixed-assets-engine.ts`
**الحالة:** 🟡 PARTIAL

**الجاهز:** CRUD + Depreciation scheduling + CWIP capitalization
**الفجوات:**
- لا revaluation model (IAS 16)
- لا component depreciation
- لا impairment testing (IAS 36)
- لا Multi-Book depreciation (Tax/Book/IFRS منفصلة)
- لا Asset Tagging / RFID

---

## 17. عقود الإيجار (Lease Accounting)
**API:** `src/app/api/accounting/leases/route.ts` | **Engine:** `src/lib/lease-accounting-engine.ts`
**الحالة:** 🟡 PARTIAL

**الفجوات:**
- لا Short-term Lease exemption
- لا Low-value Asset exemption
- لا Lease Modification accounting
- لا Lessor side / Sub-lease

---

## 18. مخصص خسائر الائتمان (IFRS 9 ECL)
**API:** `src/app/api/accounting/ecl/run/route.ts` | **Engine:** `src/lib/ifrs9-ecl.ts`
**الحالة:** 🔴 STUB

**الفجوات الحرجة:**
- لا PD/LGD/EAD calculations
- لا Forward-looking information
- لا Time-value of money adjustment

---

## 19. ضريبة الاستقطاع (WHT)
**API:** `src/app/api/finance/wht/route.ts` | **Engine:** `src/lib/wht-engine.ts`
**الحالة:** 🟡 PARTIAL

**الفجوات:**
- لا قواعد سعودية كاملة
- لا integration مع Payment Run
- لا WHT Certificate PDF
- لا monthly XML return لـ ZATCA

---

## 20. الكتب المتعددة (Multi-Book)
**Engine:** `src/lib/multi-book-engine.ts` | **API:** ⚪ | **Page:** ⚪
**الحالة:** 🟡 PARTIAL (Engine موجود فقط)

---

## 21. البنوك (Bank Accounts)
**API:** `src/app/api/banks/route.ts` + `[id]/transactions/route.ts`
**الحالة:** ✅ FULL

**الفجوات:**
- لا Bank Statement Import (MT940/CAMT.053/OFX)
- لا Outstanding Checks tracking

---

## 22. المطابقة البنكية (Bank Reconciliation)
**API:** `src/app/api/finance/reconciliations/route.ts` | **Engine:** `src/lib/bank-recon-engine.ts`
**الحالة:** 🟡 PARTIAL

**الفجوات:**
- لا 3-way auto-match
- لا Unmatched lines workbench
- لا Reconciliation Report PDF

---

## 23. الشيكات (Checks)
**API:** `src/app/api/finance/checks/route.ts`
**الحالة:** 🟡 PARTIAL

**الفجوات:**
- لا Check Printing template
- لا Stop Payment
- لا Check Register/Book Management

---

## 24. العهد النقدية (Petty Cash)
**API:** `src/app/api/finance/petty-cash/route.ts`
**الحالة:** 🟡 PARTIAL

**الفجوات:**
- لا Imprest auto top-up
- لا Receipt OCR
- لا Mobile expense capture

---

## 25. المصروفات (Expenses)
**API:** `src/app/api/expenses/route.ts`
**الحالة:** ✅ FULL

**الفجوات:**
- لا Receipt scanning/OCR
- لا Policy enforcement
- لا Reimbursement workflow

---

## 26. الخزينة (Treasury)
**API:** `src/app/api/treasury/route.ts`
**الحالة:** ✅ FULL

**الفجوات:**
- لا Liquidity Planning
- لا Multi-bank cash position dashboard

---

## 27. تشغيل الدفعات (Payment Run)
**Engine:** `src/lib/payment-run-engine.ts` | **API:** ⚪ | **Page:** ⚪
**الحالة:** 🔴 STUB

**الفجوات الحرجة:**
- لا API endpoint
- لا UI
- لا Bank File generation (ACH/SWIFT/SEPA/WPS)
- لا early payment discount

---

## 28. Dunning (مطالبات التأخير)
**Engine:** `src/lib/dunning-engine.ts` | **API:** ⚪ | **Page:** ⚪
**الحالة:** 🔴 STUB

**الفجوات:**
- لا API/UI
- لا Email/SMS/WhatsApp integration
- لا Multi-level dunning workflow

---

## 29. مراكز التكلفة (Cost Centers)
**API:** `src/app/api/accounting/cost-centers/route.ts`
**الحالة:** ✅ FULL

**الفجوات:**
- لا Hierarchical structure
- لا Profit Center distinction

---

## 30. تقرير الأعمار (Aging Report)
**API:** `src/app/api/reports/aging/route.ts`
**الحالة:** ✅ FULL

**الفجوات:**
- لا Supplier Aging منفصل
- لا Drill-down

---

## 31. كشف حساب العميل (Customer Statement)
**API:** `src/app/api/reports/customer-statement/route.ts`
**الحالة:** ✅ FULL

**الفجوات:**
- لا PDF export محسن
- لا Email scheduling

---

## 32. ZATCA E-Invoicing
**API:** `src/app/api/zatca/*` (multiple routes)
**الحالة:** ✅ FULL

**الفجوات:**
- لا Production Invoice Submission متكامل
- لا Batch optimization
- لا Reverse Charge / Excise / Group VAT

---

## 33. سجل التدقيق (Audit Log)
**API:** `src/app/api/audit-logs/route.ts`
**الحالة:** ✅ FULL

**الفجوات:**
- لا Advanced filtering UI
- لا Export functionality

---

## 34. سير الموافقات (Approvals)
**API:** `src/app/api/approvals/route.ts` + `[id]`
**الحالة:** 🟡 PARTIAL

**الفجوات:**
- لا Multi-level approval matrices
- لا Delegation logic
- لا SLA tracking

---

## 35. التقارير المخصصة
**API:** `src/app/api/reports/[type]/route.ts`
**الحالة:** 🟡 PARTIAL

**الفجوات:**
- لا Report Builder حقيقي
- لا Scheduling/Distribution
- لا Drill-down

---

## ملخص

| الحالة | العدد |
|------|------|
| ✅ FULL | 14 |
| 🟡 PARTIAL | 17 |
| 🔴 STUB | 4 |

**FULL:** Journal, Accounts, Balance Sheet, Income Statement, GL, Trial Balance, Reversal, Banks, Expenses, Treasury, Cost Centers, Audit Log, Customer Statement, ZATCA, Aging Report
**STUB حرجة:** Payment Run، Dunning، GOSI، BPM Engine
