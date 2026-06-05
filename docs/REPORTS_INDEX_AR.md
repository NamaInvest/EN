# الفهرس الشامل لتقارير الفحص والتحقق والأرشفة (Reports Index)

يربط هذا الفهرس كافة التقارير الفنية والأمنية المنتجة خلال مسارات العمل والأتمتة في نظام Nama Invest ERP.

| اسم التقرير | المسار والروابط | المرحلة | الغرض والوصف | الحالة | التقرير السابق | التقرير التالي | الملفات المرتبطة | يحتاج متابعة |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| تقرير خط الأساس | [Baseline Report](file:///d:/namasoft9-3-main/tmp/full-system-autopilot-archive-baseline-report.md) | Phase 0 | جرد حالة Git والتحقق الأمني | **PASS** | لا يوجد | Discovery | git status | لا |
| تقرير الاكتشاف | [Discovery Report](file:///d:/namasoft9-3-main/tmp/next-business-phase-discovery-report.md) | Phase 1 | اكتشاف واختيار المرحلة التشغيلية القادمة | **PASS** | Baseline | Scan & Plan | AI_PROJECT_MEMORY | لا |
| تقرير جرد الصفحات | [Full Page Inventory](file:///d:/namasoft9-3-main/tmp/full-page-inventory-report.md) | Phase 1 | ملخص جرد 526 صفحة وتوزيعها | **PASS** | Discovery | UI Button Inv | src/app | لا |
| تقرير الفحص والتخطيط | [Scan & Plan Report](file:///d:/namasoft9-3-main/tmp/next-business-phase-scan-plan-report.md) | Phase 2 | فحص الأقسام التحليلية وحراس عزل المستأجرين | **PASS** | Discovery | Impact | route.ts, page.tsx | لا |
| تقرير تحليل الأثر | [Impact Analysis](file:///d:/namasoft9-3-main/tmp/next-business-phase-impact-analysis-report.md) | Phase 3 | قياس الأثر الأمني والمالي وخطة التراجع | **PASS** | Scan & Plan | Testing | prisma/schema | لا |
| تقرير الاختبارات الآمنة | [Safe Testing Report](file:///d:/namasoft9-3-main/tmp/full-system-safe-testing-report.md) | Phase 9 | نتائج تشغيل Typecheck و Build والـ Playwright list | **PASS** | Impact | Coverage | playwright.config | لا |
| تقرير التحقق النهائي | [Coverage & Verification](file:///d:/namasoft9-3-main/tmp/full-system-coverage-and-archive-verification-report.md) | Phase 10 | التحقق الرقمي من خلو النظام من النواقص | **PASS** | Testing | Commit Gate | docs/scenarios | لا |
| تقرير بوابة الالتزام | [Commit Gate Report](file:///d:/namasoft9-3-main/tmp/full-system-archive-autopilot-commit-gate-report.md) | Phase 12 | مراجعة جودة الكود وخلوه من الأسرار والملفات المؤقتة | **PASS** | Coverage | Commit | git diff | لا |
| تقرير الالتزام المحلي | [Local Commit Report](file:///d:/namasoft9-3-main/tmp/full-system-archive-autopilot-local-commit-report.md) | Phase 13 | تسجيل الالتزام المحلي في Git | **PASS** | Commit Gate | Push Gate | git commit | لا |
| تقرير بوابة الدفع | [Push Gate Report](file:///d:/namasoft9-3-main/tmp/full-system-archive-autopilot-push-gate-report.md) | Phase 14 | إعادة التحقق الشامل قبل الدفع | **PASS** | Commit | Push | git status | لا |
| تقرير الدفع للمستودع | [Push Report](file:///d:/namasoft9-3-main/tmp/full-system-archive-autopilot-push-report.md) | Phase 15 | دفع التغييرات للمستودع البعيد | **PASS** | Push Gate | Deploy Decision | git push | لا |
| تقرير قرار النشر | [No Deploy Required Report](file:///d:/namasoft9-3-main/tmp/full-system-archive-no-deploy-required-report.md) | Phase 16 | تحديد عدم الحاجة لنشر الإنتاج | **PASS** | Push | Final Closeout | next.config | لا |
| تقرير الإغلاق النهائي | [Final Closeout](file:///d:/namasoft9-3-main/tmp/full-system-page-button-scenario-archive-final-closeout-report.md) | Phase 18 | ملخص كامل للمسار والنتائج والأرقام | **PASS** | Deploy | لا يوجد | docs/INDEX.md | لا |
