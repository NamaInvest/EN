# خارطة موجات Harness التالية (NEXT_HARNESS_WAVES_ROADMAP_AR)

يهدف هذا المستند إلى رسم خريطة طريق متكاملة للموجات القادمة لأتمتة واختبار السيناريوهات المتبقية في نظام Nama Invest ERP في بيئة اختبار معزولة بالكامل دون لمس الإنتاج.

---

## 🛒 Sales/POS Harness Wave (حزمة مبيعات ونقاط البيع)
- **السيناريوهات:** 
  - `SCN-POS-001`: Cashier Checkout & Printing
  - `SCN-SAL-002`: Sales Returns
  - `SCN-POS-002`: Restaurant POS & Tables
- **Seed Requirements (متطلبات التهيأة):**
  - مستأجر مبيعات وهمي (Clean POS Tenant)
  - دليل أصناف مخزنية بأسعار بيع معرفة (POS Products with active prices)
  - وردية كاشير نشطة ومفتوحة (Open Active Cash Shift)
  - فروع وصالات وطاولات مطعم وهمية (Restaurant Tables and Kitchen display config)
- **Rollback Requirements (متطلبات التراجع):**
  - تفعيل معاملة Prisma والتراجع عنها تلقائياً `Prisma transaction rollback`.
  - تفريغ سجلات المبيعات وسندات الدفع فور انتهاء الاختبار.
- **No Live Checkout (منع البيع الحقيقي):**
  - حظر استدعاء أي بوابة دفع حقيقية (No real stripe/paytabs APIs).
  - استخدام استجابات API محاكاة بالكامل (API Contract Mocks).
- **No Real Payment (منع الدفع الحقيقي):**
  - محاكاة استلام النقدية أو الشبكة بقيم وهمية.
- **Suggested Tests (الاختبارات المقترحة):**
  - `tests/pos-isolated-checkout.test.ts` (التحقق من صحة الفاتورة وخصوماتها وحساب الضريبة)
  - `tests/pos-restaurant-table-flow.test.ts` (محاكاة وردية المطعم وربط الفواتير بالطاولات)

---

## 📦 Inventory/Warehouse Harness Wave (حزمة المستودعات والمخزون)
- **السيناريوهات:**
  - `SCN-INV-001`: Stock Transfers (تحويل البضائع بين الفروع)
  - `SCN-INV-002`: Stocktake & Adjustment (تسوية الجرد الفعلي وعجز الجرد)
- **Seed Requirements (متطلبات التهيأة):**
  - مستودع مصدر (Source Warehouse) ومستودع هدف (Destination Warehouse).
  - أصناف مخزنية بأرصدة أولية كافية وتحديد متوسط التكلفة (Unit Average Cost).
  - ورقة جرد وهمية مفتوحة (Open Stocktake Sheet).
- **Stock Movement Isolation (عزل الحركات المخزنية):**
  - إجراء تحركات البضائع وحركات الشحن (In-Transit) داخل معاملة معزولة.
  - التحقق من توازن خطوط الحركات المخزنية ومطابقتها لحساب الأستاذ العام المساعد للمخازن.
- **No Real Stock Mutation (منع تعديل المخزون الحقيقي):**
  - منع الكتابة على المخازن الحقيقية وعمل تراجع كامل بعد الفحص.
- **Suggested Tests (الاختبارات المقترحة):**
  - `tests/inventory-stock-transfer.test.ts` (فحص تحويل الأصناف وتفادي الجرد السالب)
  - `tests/inventory-stocktake-adjust.test.ts` (تسوية الجرد وحساب أثر فروقات متوسط التكلفة)

---

## 🤝 Purchases/Approvals Harness Wave (حزمة المشتريات والاعتمادات)
- **السيناريوهات:**
  - `SCN-PUR-002`: Purchase Returns (مرتجع المشتريات)
- **Approval Mock/Seed (تهيئة الموافقات والموردين):**
  - موردين وهميين (Clean Mock Suppliers).
  - سند استلام مخزني (GRN) مرحل مسبقاً في بيئة الاختبار.
  - تحديد سلسلة الموافقات والاعتمادات المطلوبة ودور المدير المالي/المستودع.
- **GRN Isolation (عزل سندات الاستلام):**
  - عزل حركات الاستلام ومطابقة الكميات المرتجعة للكميات المستلمة أصلاً.
- **No Real Posting (منع الترحيل الحقيقي):**
  - منع ترحيل قيود الاستلام أو فواتير المشتريات خارج قاعدة الاختبار.
- **Suggested Tests (الاختبارات المقترحة):**
  - `tests/purchases-returns-validation.test.ts` (فحص سند المرتجع ومنع إرجاع كميات أكبر من المستلمة)

---

## ⚖️ Compliance Manual/Mock Wave (حزمة الامتثال والربط الزكوي الموثق)
- **ZATCA/WPS Real Submission remains Manual (الربط الفعلي يظل يدوياً):**
  - يمنع تماماً إرسال أي فاتورة حقيقية لبيئات هيئة الزكاة والضريبة والجمارك (ZATCA Production API) لتجنب الغرامات والمخالفات المحاسبية.
  - إرسال ملفات حماية الأجور (WPS) للبنوك يظل يدوياً بالكامل.
- **Mock-only Validation Allowed (المحاكاة المسموحة فقط):**
  - فحص توليد البنية البرمجية لملف XML والرمز المرجعي (Cryptographic Stamp / QR code) محلياً دون إرسال.
