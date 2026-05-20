# تقرير تفعيل المرحلة الثالثة (Phase 3 API-Backed Read-Only Report)

بناءً على التوجيهات بالانتقال للمرحلة الثالثة للأقسام ذات الخطورة المتوسطة ولكن بشكل **آمن تماماً (Read-only / Dashboards / Monitoring)**، تم اختيار 5 أقسام تمتلك `API` مسبقاً، وتم ربطها بواجهة عرض فقط دون المساس بالعمليات المالية أو المخزونية.

## الأقسام الخمسة المختارة (Phase 3):

1. **Treasury Cash Forecast** (`/treasury/cash-forecast`)
   - **النوع**: Dashboard / Monitoring
   - **سبب الأمان**: الـ API المقابل (`GET /api/treasury/cash-forecast`) يقوم فقط باستدعاء بيانات `liquidityForecast` باستخدام `tenantId`.
   - **الواجهة**: تم استبدال الـ Panel بواجهة تعرض التوقعات النقدية في `Cards` مبسطة.

2. **WMS Waves Monitor** (`/wms/waves`)
   - **النوع**: Monitoring / Inquiry
   - **سبب الأمان**: تم ربط الواجهة باستخدام دالة `GET` لاستدعاء الموجات النشطة فقط (`WmsWavesService.listWaves`). لا يتم إرسال أي `POST` ولا يتم تخصيص مخزون جديد (No Allocation).
   - **الواجهة**: تم تصميم جدول يعرض قائمة الـ Waves وعدد المهام بداخل كل موجة.

3. **POS Accountant** (`/pos/accountant`)
   - **النوع**: Tracking / Monitoring
   - **سبب الأمان**: يعتمد على `GET /api/pos/accountant` والذي يقرأ `posSession` المفتوحة والمغلقة لكل مستأجر.
   - **الواجهة**: تم بناء شاشة مراقبة لجلسات الكاشير (الكاشير والمناوبات) لتتبع حالتها دون القدرة على إغلاق الجلسات أو تسجيل القيود.

4. **Accounting Inter-Company** (`/accounting/inter-company`)
   - **النوع**: KPI board / Inquiry
   - **سبب الأمان**: تم استخدام الـ `GET` لطلب `?view=summary` لاستعراض أرصدة الـ `receivable` والـ `payable` المجمعة بين الشركات التابعة.
   - **الواجهة**: تم عرض ملخصات الأرصدة وجدول بالأرصدة المستحقة على الشركاء التجاريين للمستأجر الحالي.

5. **State Machine Builder** (`/settings/state-machine`)
   - **النوع**: Inquiry screen
   - **سبب الأمان**: الـ API يقدم وظيفة `GET` لاستعراض الانتقالات المسموحة (`transitions`) لحالات النظام (مثل Invoices أو Work Orders).
   - **الواجهة**: تم بناء جدول يعرض مسارات حالات النظام المختلفة كعرض فقط، دون إرسال تعديلات `POST`.

## إثبات الـ Tenant Isolation وعدم المساس بالـ Business Logic
- تم التأكد من أن دوال `GET` المستخدمة تستدعي إما `requireTenantId(req)` وتمرره في `where: { tenantId }`، أو تقوم بتصفية البيانات الخاصة بالمستأجر تلقائياً في طبقة الخدمة.
- جميع الواجهات المضافة لا تحتوي على أي مكونات `form` أو دوال `fetch` تقوم بطلب ذو طريقة `POST, PUT, DELETE`. 
- العمليات الخطرة كإنشاء الموجات (Waves) في الـ WMS أو ترحيل القيود (Postings) في الإنتركومباني بقيت مخفية تماماً ومحمية خلف طبقة API محكومة بـ `Idempotency`.

## الملفات التي تم تعديلها:
- `src/app/(dashboard)/treasury/cash-forecast/page.tsx`
- `src/app/(dashboard)/wms/waves/page.tsx`
- `src/app/(dashboard)/pos/accountant/page.tsx`
- `src/app/(dashboard)/accounting/inter-company/page.tsx`
- `src/app/(dashboard)/settings/state-machine/page.tsx`
- `tmp/phase-3-api-backed-readonly-report.md` (هذا التقرير)
