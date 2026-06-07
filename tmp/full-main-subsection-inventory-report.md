# تقرير جرد أقسام النظام الشامل - مسار تغطية السيناريوهات الشامل
**المشروع:** Nama Invest ERP
**المسار الشامل:** FULL_MAIN_AND_SUBSECTION_SCENARIO_COVERAGE_REPAIR_AUTOPILOT
**المرحلة:** PHASE 2 — COMPLETE_SYSTEM_SECTION_INVENTORY
**التاريخ:** 2026-06-07

---

## 1. إحصائيات الجرد الكلية (System Inventory Metrics)

```txt
TOTAL_PAGES:
531

TOTAL_API_ROUTES:
897

TOTAL_MAIN_SECTIONS:
24 (Top-level directories under src/app)

TOTAL_SUBSECTIONS:
124 (Subdirectories under (dashboard))
```

---

## 2. أقسام النظام وجرد الموديولات (MAIN_SECTIONS & Subsections)

يتم توزيع موديولات النظام وقائمة الصفحات و APIs على الهياكل الرئيسية التالية:

### أ. لوحة القيادة المركزية والأقسام المشتركة `(dashboard)`
يحتوي على كافة الموديولات والأنشطة التشغيلية لـ ERP:
* **المحاسبة والحسابات العامة (Accounting & AP/AR):**
  * Subsections: `accounting`, `ap`, `copa`, `fiscal-periods`, `receipt-vouchers`, `recurring-invoices`, `tax`, `vat`, `zakat`, `wht`.
  * الغرض: إدارة شجرة الحسابات، قيود اليومية، الفترات المالية، المدفوعات والضرائب.
* **المبيعات ونقاط البيع (Sales & POS):**
  * Subsections: `sales`, `sales-returns`, `pos`, `pos-dashboard`, `pos-demo`, `restaurant-pos`, `restaurant-tables`, `gift-cards`, `loyalty`, `price-quotes`, `promotions`, `coupons`.
  * الغرض: الفواتير، مرتجعات المبيعات، ورديات نقاط البيع الفورية والمطاعم والتخفيضات.
* **المشتريات والتموين (Purchases & SCM):**
  * Subsections: `purchases`, `purchase-orders`, `purchase-returns`, `procurement`, `rebates`.
  * الغرض: طلبات وعقود الشراء، الموردين، وإرجاع المشتريات.
* **المخازن واللوجستيات (Inventory & WMS):**
  * Subsections: `inventory`, `warehouses`, `wms`, `stock`, `stock-transfers`, `stocktake`, `batches`, `barcode`, `shipping`, `logistics`, `smart-transfers`.
  * الغرض: مستودعات، الجرد الفوري، تحركات الأصناف، الباركود واللوجستيات.
* **إدارة الموارد البشرية والرواتب (HR & Payroll):**
  * Subsections: `hr`, `employees`, `salaries`, `payroll`, `attendance`, `vacations`, `shifts`, `contracts`.
  * الغرض: الموظفون، الرواتب، نظام الحضور والانصراف، عقود الموظفين والامتثال.
* **الامتثال والأنظمة الحكومية (Compliance & Saudi):**
  * Subsections: `compliance`, `zatca`, `pdpl`.
  * الغرض: الفوترة الإلكترونية زكاة ودخل المرحلة الثانية، نظام حماية البيانات الشخصية.
* **الخزائن والبنوك (Treasury & Banks):**
  * Subsections: `treasury`, `banks`, `payments`, `fx`.
  * الغرض: حركة الصناديق والمقاصة والتحويلات البنكية ومبادلات العملات.
* **إدارة الإنتاج والتصنيع (Manufacturing & Planning):**
  * Subsections: `manufacturing`, `planning`, `shopfloor`.
  * الغرض: أوامر الإنتاج، تخطيط الاحتياجات، عمليات المصنع.
* **الذكاء الاصطناعي ووكلاء التحليل (AI Agents):**
  * Subsections: `ai`, `ai-auditor`, `ai-bank`, `ai-cfo`, `ai-copilot`, `ai-scm`.
  * الغرض: وكلاء التحليل المالي، التدقيق التلقائي، تخطيط التموين بالذكاء الاصطناعي.
* **إدارة الأصول والصيانة (Assets & Maintenance):**
  * Subsections: `assets`, `fixed-assets`, `maintenance`, `cmms`.
  * الغرض: إهلاك الأصول، الصيانة الوقائية والطارئة.
* **حوكمة الموافقات والتحقيق (Governance & SIEM):**
  * Subsections: `approvals`, `audit`, `audit-logs`.
  * الغرض: مسارات الموافقة، سجل الحركات للمستأجر.

### ب. أقسام الوصول والمطابقة والتوثيق المباشرة (Root Folders)
* `auth`, `login`, `sign-in`, `sign-up`, `sso-callback`, `auto-login` (إدارة الحسابات والدخول)
* `api-docs` (توثيق المطورين)
* `portals`, `vendor-portal` (بوابات الموردين والعملاء)
* `pricing`, `pricing-expired` (الاشتراكات والدفع)

---

## 3. الأقسام الحساسة وعالية المخاطر (HIGH_RISK_SECTIONS)

تتطلب هذه الأقسام معايير أمان محاسبية وتكاملية صارمة في كافة سيناريوهات الفحص:

1. **المالية والمحاسبة (`accounting`, `finance`, `fiscal-periods`):**
   * المخاطر: حظر ترحيل القيود غير المتوازنة، حماية السجلات المرحلة من الحذف، حظر الكتابة في فترات مغلقة.
2. **الامتثال والفوترة زكاة (`zatca`, `compliance`):**
   * المخاطر: سلامة بيانات فواتير ZATCA للمرحلة الثانية، وحظر تعديل فواتير معتمدة ومطهرة.
3. **أمن الجلسات وعزل المستأجرين (`auth`, `api`):**
   * المخاطر: التحقق التام من عزل المستأجرين برمجياً بنظام `tenantId` ومنع تسريبات البيانات.
4. **حوكمة الأجور والمدفوعات (`payroll`, `wps`, `banks`):**
   * المخاطر: سلامة ملفات مدد WPS المولد والتحقق من حسابات الموظفين الحساسة.
5. **التحكم وحركات المخزون وقيم الأصول (`inventory`, `assets`, `wms`):**
   * المخاطر: حركات المخازن المزدوجة وضمان مطابقة تسويات الجرد.

```txt
PHASE_RESULT:
PASS_CONTINUE
```
