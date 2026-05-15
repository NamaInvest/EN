# تقرير فحص وتخطيط - Phase 2.5.6: Financial Domain Enforcement Scan

## 1. الهدف (Objective)
اكتشاف وتوثيق جميع المسارات التي لا تزال تعتمد على `prisma.$transaction` أو تُنشئ قيوداً محاسبية (`prisma.journalEntry.create`) وحركات خزينة (`prisma.treasury.create`) بشكل مباشر، بهدف تحويلها إلى `FinancialTxClient` والـ `Service Contracts` المعتمدة.

## 2. نتائج الفحص (Scan Results)
بناءً على عملية البحث العميقة في مجلد `src/app/api/` وجدنا أكثر من 75 حالة اختراق معمارية (Direct Writes) تتوزع على النطاقات التالية:

### أ. نطاق المبيعات ونقاط البيع (Sales & POS)
- `src/app/api/sales/route.ts` (يستخدم `$transaction` بكثرة)
- `src/app/api/sales-returns/route.ts`
- `src/app/api/pos/route.ts` و `checkout/route.ts`
- `src/app/api/sales/delivery-notes/route.ts`

### ب. نطاق المشتريات (Purchases & GRN)
- `src/app/api/purchases/route.ts`
- `src/app/api/purchases/[id]/receive/route.ts`
- `src/app/api/purchases/grn/route.ts`
- `src/app/api/purchase-returns/route.ts`
- `src/app/api/purchases/letters-of-credit/landed-costs/route.ts` (يقوم بـ `prisma.journalEntry.create` مباشرة)

### ج. نطاق المخزون والتصنيع (Inventory & Manufacturing)
- `src/app/api/stock-transfers/route.ts`
- `src/app/api/stock-movements/route.ts`
- `src/app/api/stock/adjustments/route.ts`
- `src/app/api/manufacturing/work-orders/route.ts` و `orders/route.ts`

### د. النطاقات الأخرى (HR, Pharmacy, Maintenance, Webhooks)
- **الصيانة:** `src/app/api/maintenance/route.ts` يستخدم `prisma.treasury.create` بشكل مباشر لتسجيل إيرادات الصيانة!
- **الرواتب:** `src/app/api/hr/payroll/run/route.ts` وغيرها.
- **التأمينات (GOSI):** `src/app/api/hr/gosi/route.ts` يستخدم `prisma.journalEntry.create`.
- **الربط (Webhooks):** Zid يقوم بعمل `prisma.treasury.create` بشكل مباشر عند استلام طلب.

## 3. خطة التنفيذ المقترحة (Execution Plan)
العملية ضخمة ويجب تقسيمها إلى مهام فرعية (Sub-phases) لضمان عدم كسر النظام:

1. **Phase 2.5.6.1:** إصلاح `Maintenance` و `Webhooks` و `HR/GOSI` لأنها تمتلك اختراقات واضحة عبر `prisma.treasury.create` و `prisma.journalEntry.create`.
2. **Phase 2.5.6.2:** نقل مسارات `Sales` و `POS` لتعمل حصرياً داخل `runFinancialTx` أو عبر `SalesService`.
3. **Phase 2.5.6.3:** نقل مسارات `Purchases` و `GRN`.
4. **Phase 2.5.6.4:** نقل مسارات `Inventory` لتعمل تحت `runInventoryTx`.

## 4. المخاطر (Risks)
- يجب إجراء التعديلات تدريجياً لاختبار كل نطاق (Domain) على حدة.
- الـ `Refactor` يحتاج للحفاظ على نفس هيكل البيانات الراجعة (`Response Shape`) حتى لا تتعطل واجهات المستخدم (`Frontend`).
