# خطة أتمتة الاختبارات الشاملة للمنصة (E2E Automation Plan)

تحدد هذه الوثيقة الاستراتيجية التقنية لتصميم وتنفيذ اختبارات الواجهة البرمجية الشاملة (E2E) لمنصة **نما إنفست ERP**، مع تشديد حمايات الأمان وحوكمة البيانات لتفادي التعارض مع بيئة الإنتاج.

---

## 1. الأداة المختارة وقرار البناء (Testing Tool Selection)
تم اختيار **Playwright** كأداة أساسية لتشغيل اختبارات الـ E2E للمستويات الأمامية للمشروع للأسباب التالية:
- توفر تكوين مسبق متوافق بالكامل في جذر المشروع (`playwright.config.ts`).
- دعم التشغيل المتوازي المتكامل (Fully Parallel).
- دعم فحص السلوك باللغتين العربية والإنجليزية وسيناريوهات الفروع والتحقق الصامت من الـ Viewports.
- توفر بنية خادم الاختبارات المحلي المدمج (`npm run dev`) للتحقق الذاتي قبل الدمج والترحيل.

---

## 2. قواعد الأمان وحارس البيئة (E2E Safety Guard)
تم تطبيق حارس بيئة الاختبارات [environment-guard.ts](file:///d:/namasoft9-3-main/e2e/helpers/environment-guard.ts) الذي يقرأ قيمة الـ `baseURL` قبل بدء تشغيل أي اختبار، ويحظر التشغيل فوراً برسالة خطأ صريحة `E2E_PRODUCTION_TARGET_BLOCKED` في حال محاولة استهداف نطاقات الإنتاج التالية:
- `namainvist.com`
- `n1.namainvist.com`
- `n11.namainvist.com`
- `saas-app.namainvist.com`
- `ahmedalyamicompany.namainvist.com`

---


## 3. تصنيف وتوزيع الاختبارات (Scenario Safety Classifications)
تنقسم الاختبارات إلى فئتين:

### أ. اختبارات آمنة (Safe E2E Specs)
يتم أتمتتها بالكامل وتغطيتها بملفات الاختبارات النشطة:
- **التصفح العام للموقع:** [public-home.spec.ts](file:///d:/namasoft9-3-main/e2e/public-home.spec.ts) (يغطي `SCN-PUBLIC-001`).
- **المصادقة والمسارات المحمية:** [auth-protected-routes.spec.ts](file:///d:/namasoft9-3-main/e2e/auth-protected-routes.spec.ts) (يغطي `SCN-AUTH-001`).
- **صلاحيات الإدارة العامة:** [settings-rbac.spec.ts](file:///d:/namasoft9-3-main/e2e/settings-rbac.spec.ts) (يغطي `SCN-TENANTADMIN-001`).
- **حظر العمليات غير المصرحة:** [dangerous-actions-visibility.spec.ts](file:///d:/namasoft9-3-main/e2e/dangerous-actions-visibility.spec.ts) (يغطي `SCN-ACCOUNTING-001` و `SCN-SALES-001`).

### أ-1. توسعة الاختبارات الآمنة القرائية (Safe Read-only Expansion - Phase 7A)
تمت إضافة وتفعيل مجموعة الاختبارات القرائية المعزولة التالية:
- **تصفح الصفحات العامة القرائي:** [public-readonly-navigation.spec.ts](file:///d:/namasoft9-3-main/e2e/public-readonly-navigation.spec.ts) (روابط الواجهة العامة والتحميل الخالي من البيانات).
- **الاختبارات السلبية للمصادقة:** [auth-negative-and-protection.spec.ts](file:///d:/namasoft9-3-main/e2e/auth-negative-and-protection.spec.ts) (مدخلات غير صالحة ورسائل الخطأ).
- **إعادة توجيه المسارات المحمية:** [protected-routes-readonly.spec.ts](file:///d:/namasoft9-3-main/e2e/protected-routes-readonly.spec.ts) (حظر الضيوف وإجبار تحويلهم إلى تسجيل الدخول).
- **حماية التقارير الحساسة:** [reports-readonly-protection.spec.ts](file:///d:/namasoft9-3-main/e2e/reports-readonly-protection.spec.ts) (منع الوصول إلى موازين المراجعة والتدفقات النقدية).
- **بوابات رفض تعديل البيانات:** [api-mutation-rejection.spec.ts](file:///d:/namasoft9-3-main/e2e/api-mutation-rejection.spec.ts) (التأكد من أن الـ APIs التعديلية ترفض فوراً بـ 401/403 عند غياب الجلسة).
- **حراسة الـ AI والـ RAG:** [ai-rag-protection.spec.ts](file:///d:/namasoft9-3-main/e2e/ai-rag-protection.spec.ts) (منع استدعاء محادثات واستخلاص الاحتيال للجهات المجهولة).
- **حراسة تأسيس المستأجرين:** [tenant-provisioning-protection.spec.ts](file:///d:/namasoft9-3-main/e2e/tenant-provisioning-protection.spec.ts) (تصفير ورفض طلبات الـ Provisioning غير المصادقة).

### ب. اختبارات مؤجلة أو خطيرة (Deferred & Dangerous Scenarios)
تتم محاكاتها فقط بالـ API أو مراجعتها يدوياً لتفادي الكتابة الفعلية غير المحمية في البيئات الحية:
- التأسيس الحقيقي للمستأجرين (`provision tenant`) - يتم اختباره برمجياً بالرفض والـ mock فقط.
- الترحيل المحاسبي الحقيقي والزكوي للإنتاج.

---

## 4. طريقة التشغيل والاستدعاء (Execution commands)

### عرض قائمة الاختبارات المكتشفة:
```bash
npx playwright test --list
```

### تشغيل كافة اختبارات الـ E2E محلياً:
```bash
npx playwright test
```

### تشغيل الدفعة الموسعة لـ Phase 7A فقط:
```bash
npx playwright test e2e/public-readonly-navigation.spec.ts e2e/auth-negative-and-protection.spec.ts e2e/protected-routes-readonly.spec.ts e2e/reports-readonly-protection.spec.ts e2e/api-mutation-rejection.spec.ts e2e/ai-rag-protection.spec.ts e2e/tenant-provisioning-protection.spec.ts
```

