# Deep Scan Protocol

## الهدف
أي عملية فحص يجب أن تكون شاملة وعميقة.

ممنوع التقارير السطحية.

---

# 1. ممنوع الفحص الجزئي

لا يسمح بقراءة:
- ملف واحد
- أول نتيجة search
- جزء من module

يجب فحص:
- frontend
- backend
- database
- APIs
- events
- tests
- docs
- workflows
- permissions
- tenant logic

---

# 2. Definition of Done

الفحص لا يعتبر مكتملًا إلا إذا:

- تم تحديد جميع الملفات المرتبطة
- تم تحليل العلاقات
- تم تحديد المخاطر
- تم تحديد root cause
- تم تحليل التأثيرات الجانبية
- تم تحديد technical debt
- تم تحديد inconsistencies
- تم تحديد duplicate logic
- تم تحديد missing tests
- تم تحديد architecture violations

---

# 3. Scan Depth Levels

## LEVEL 1
Quick Scan

- ملفات مباشرة فقط
- بدون تحليل معماري

---

## LEVEL 2
Module Scan

- كامل الـ module
- APIs
- DB
- frontend
- tests

---

## LEVEL 3
Architectural Scan

- cross-domain analysis
- event flows
- workflows
- dependencies
- performance
- security
- tenant isolation

---

## LEVEL 4
Enterprise Audit

- كامل النظام
- architecture consistency
- financial safety
- scalability
- operational risks
- AI inconsistencies
- tech debt
- governance gaps

---

# 4. Mandatory Search Strategy

قبل التقرير:

يجب البحث عن:

- route names
- API handlers
- components
- services
- repositories
- models
- events
- hooks
- permissions
- validations
- tests
- migrations
- feature flags

---

# 5. Mandatory Analysis

يجب تحليل:

- data flow
- state transitions
- events
- financial impact
- tenant impact
- security impact
- performance impact
- sync impact
- workflow impact

---

# 6. Root Cause Rule

ممنوع الاكتفاء بالأعراض.

مثال خاطئ:
"الزر لا يعمل"

الصحيح:
- لماذا لا يعمل؟
- أين يبدأ الفشل؟
- هل API؟
- هل state؟
- هل permissions؟
- هل tenant؟
- هل race condition؟
- هل caching؟
- هل workflow broken؟

---

# 7. No Shallow Reports

ممنوع كتابة:

- "يبدو أن المشكلة..."
- "ربما..."
- "غالبًا..."

يجب تقديم:
- evidence
- file references
- exact flow
- affected modules

---

# 8. Required Report Sections

أي تقرير يجب أن يحتوي:

1. Scope
2. Files scanned
3. Related domains
4. Architecture flow
5. Root cause
6. Secondary risks
7. Technical debt
8. Security risks
9. Tenant risks
10. Financial risks
11. Performance risks
12. Suggested fix
13. Safer alternative
14. Required tests
15. Rollback considerations

---

# 9. Large Project Rule

هذا المشروع Enterprise ERP.

ممنوع:
- assumptions
- partial scans
- local fixes بدون impact analysis

---

# 10. Golden Rule

إذا لم يتم فهم:
- architecture
- workflows
- domain boundaries

فالفحص يعتبر غير مكتمل.
