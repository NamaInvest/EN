# Development Lifecycle

## الهدف
أي تعديل داخل النظام يجب أن يمر بمراحل ثابتة وآمنة.

---

# مراحل التطوير

## 1. فهم الطلب

قبل كتابة أي كود:

- فهم المشكلة
- تحديد الدومين
- تحديد التأثير
- قراءة ملفات الـ Brain
- تحديد المخاطر

---

## 2. التحليل

يجب تحديد:

- ما الذي سيتغير؟
- ما الأقسام المتأثرة؟
- هل يوجد تأثير مالي؟
- هل يوجد تأثير على:
  - tenant isolation
  - ZATCA
  - Desktop sync
  - subscriptions
  - permissions

---

## 3. التصميم

قبل التنفيذ:

- تحديد architecture
- تحديد APIs
- تحديد events
- تحديد migrations
- تحديد tests المطلوبة

---

## 4. التنفيذ

القواعد:

- لا تعديل خارج نطاق الطلب
- لا placeholder code
- لا bypass للـ permissions
- لا تجاوز للـ accounting engine
- لا direct DB manipulation

---

## 5. الاختبارات

إجباري:

- typecheck
- lint
- unit tests
- integration tests

إذا التعديل مالي:

- financial tests
- reconciliation tests
- VAT tests
- ZATCA tests

---

## 6. مراجعة الكود

يجب مراجعة:

- architecture consistency
- performance
- security
- tenant isolation
- financial safety

---

## 7. التوثيق

إذا تغير:
- workflow
- API
- schema
- business rule

يجب تحديث:
- Brain files
- governance files
- API docs

---

## 8. النشر

النشر لا يتم إلا بعد:

- نجاح الاختبارات
- مراجعة المخاطر
- backup
- staging verification

---

## 9. المراقبة

بعد النشر:

- مراقبة logs
- مراقبة errors
- مراقبة performance
- مراقبة queues
- مراقبة sync

---

## 10. التقييم بعد النشر

يجب تسجيل:

- ما الذي نجح؟
- ما المشاكل؟
- هل يوجد technical debt جديد؟
- هل يحتاج refactor؟
