# مصفوفة ربط الواجهات بالمسارات الخلفية (Next Business Phase UI-API Matrix)

توضح هذه المصفوفة العلاقة والترابط بين عناصر واجهات العميل والـ API الخلفي المصاحب لها مع التحقق من تطبيق أمان وعزل المستأجرين.

| المسار البرمجي للواجهة (Page) | عنصر التحكم / الحدث (Event) | نقطة النهاية للـ API الخلفي | طريقة الطلب (Method) | عزل المستأجرين (Tenant) | أمان الصلاحيات (RBAC) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/pos` | تحميل أولي للصفحة وتصاريح البيع | `/api/pos/session` | GET | `requireTenant: true` | `cashier` OR `admin` |
| `/restaurant-pos` | إرسال وحفظ فاتورة مطعم | `/api/sales/invoice/pos` | POST | `requireTenant: true` | `cashier` OR `admin` |
| `/sales/terminal` | استعلام وتحديث بيانات الطابعات | `/api/settings/printer` | GET / PUT | `requireTenant: true` | `admin` |
| `/onboarding` | تهيئة مستأجر جديد (شركة جديدة) | `/api/admin/tenants/provision` | POST | معزول بالكامل | `super-admin` |
