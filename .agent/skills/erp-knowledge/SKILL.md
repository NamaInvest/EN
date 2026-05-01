# Namasoft ERP — Knowledge Skill

> **هذا الـ Skill يحتوي على كل المعرفة المرجعية لتطوير نظام Namasoft ERP.**
> **استخدمه قبل البدء بأي ميزة أو إصلاح.**

## الاستخدام

عند بدء العمل على المشروع، اقرأ بهذا الترتيب:

1. **CLAUDE.md** (في الجذر) — القواعد الإلزامية
2. **GLOBAL_ERP_GAP_ANALYSIS.md** — تحليل الفجوة والبرومنت الكامل
3. **BUSINESS_FLOWS_GUIDE.md** — 18 فلو رسومي للأعمال
4. **WHAT_YOU_STILL_NEED.md** — متطلبات الفريق والميزانية
5. **COMPLETE_ARTIFACTS_CHECKLIST.md** — كل الوثائق المطلوبة
6. **104_modules_checklist.md** — قائمة الـ 104 موديول
7. **prisma/schema.prisma** — قاعدة البيانات الحالية

## الوكلاء المتخصصون

في `.claude/agents/`:
- **erp-architect** — للقرارات المعمارية
- **accounting-validator** — للتحقق المحاسبي
- **saudi-compliance** — للامتثال السعودي

## أوامر السلاش الجاهزة

في `.claude/commands/`:
- `/erp-build-feature [name]` — بناء ميزة كاملة
- `/erp-check-gap [module]` — فحص الفجوة
- `/erp-validate-je [code]` — التحقق المحاسبي
- `/erp-saudi-check [feature]` — التحقق السعودي
- `/erp-flow [name]` — عرض فلو
- `/erp-status` — حالة المشروع

## الإجابة على أسئلة العمل

عند سؤال:
- **"ما الخطوة التالية؟"** → استخدم `/erp-status`
- **"ابني ميزة X"** → استخدم `/erp-build-feature X`
- **"هل هذا صحيح محاسبياً؟"** → استخدم `/erp-validate-je`
- **"هل متوافق مع ZATCA؟"** → استخدم `/erp-saudi-check`
- **"ما مدى اكتمال موديول X؟"** → استخدم `/erp-check-gap X`
- **"كيف يعمل فلو X؟"** → استخدم `/erp-flow X`

## الأولويات الإلزامية

1. **الامتثال أولاً** — ZATCA, GOSI, WPS, PDPL
2. **الصحة المحاسبية** — توازن، control accounts
3. **الأمان** — multi-tenant isolation
4. **الأداء** — pagination، indexing
5. **التوثيق** — قبل وبعد البرمجة

## المنهجية المختصرة

```
متطلب → فلو → CPA review → Schema → API → Tests → Code → Docs → Deploy
```

**لا تكتب كود قبل إكمال أول 5 خطوات.**
