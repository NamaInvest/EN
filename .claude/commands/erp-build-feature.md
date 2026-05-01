---
description: بناء ميزة ERP جديدة باتباع المنهجية الكاملة (Flow → Validation → Schema → API → Tests → Code)
argument-hint: [feature-name]
---

# بناء ميزة ERP جديدة: $ARGUMENTS

اتبع المنهجية الكاملة الموثقة في `CLAUDE.md`:

## المرحلة 1: التخطيط
1. اقرأ `GLOBAL_ERP_GAP_ANALYSIS.md` وابحث عن الميزة `$ARGUMENTS`
2. حدد القسم/المرحلة (Foundation/Phase 1-11)
3. اقرأ الـ Prompt المتعلق
4. اقرأ `BUSINESS_FLOWS_GUIDE.md` للفلو ذي الصلة

## المرحلة 2: التحقق
5. **استدع وكيل `accounting-validator`** للتحقق من المنطق المحاسبي (إن كان مالياً)
6. **استدع وكيل `saudi-compliance`** للتحقق من الامتثال السعودي (إن كان متعلقاً بالعملاء أو الموظفين)
7. **استدع وكيل `erp-architect`** للقرارات المعمارية الكبيرة

## المرحلة 3: التصميم
8. اقترح Prisma schema changes (إن وجدت)
9. اقترح API endpoints (RESTful)
10. اقترح UI flows (إن وجدت)
11. اعرض الخطة على المستخدم لـ **الموافقة قبل البرمجة**

## المرحلة 4: التنفيذ (بعد الموافقة)
12. اكتب unit tests أولاً (TDD)
13. أنشئ Prisma migration
14. اكتب الـ business logic في `src/lib/`
15. اكتب الـ API routes في `src/app/api/`
16. اكتب الـ UI في `src/app/(dashboard)/`
17. اكتب integration tests

## المرحلة 5: المراجعة
18. شغّل `npm run lint`
19. شغّل `npm run typecheck`
20. شغّل `npm test`
21. اعرض diff للمستخدم
22. اقترح rollback plan إن لزم

## المرحلة 6: التوثيق
23. حدّث الـ README للموديول
24. أضف تعليقات للمنطق المعقد
25. سجّل التغيير في git commit بصيغة `feat(module): description`

---

**مهم:** لا تخرج عن هذه المنهجية. كل خطوة ضرورية. إذا لم تتمكن من إكمال خطوة، اسأل المستخدم.
