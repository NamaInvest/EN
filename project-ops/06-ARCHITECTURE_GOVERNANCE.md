# Architecture Governance

## الهدف
الحفاظ على استقرار وهيكلية النظام مع التوسع.

---

# قواعد أساسية

## ممنوع

- لا يسمح لـ domain بكسر domain آخر.
- لا business logic داخل UI.
- لا business logic داخل controllers.
- لا direct DB writes خارج services.
- لا circular dependencies.
- لا duplicated business rules.

---

# الدومينات الرسمية

## Accounting
مسؤول عن:
- journals
- ledger
- VAT
- financial statements

## Sales
مسؤول عن:
- quotations
- sales orders
- invoices

## Inventory
مسؤول عن:
- stock
- warehouses
- costing

## HR
مسؤول عن:
- employees
- payroll
- attendance

## Treasury
مسؤول عن:
- payments
- banks
- reconciliation

## AI
مسؤول عن:
- copilots
- RAG
- AI workflows

---

# قواعد التواصل

أي domain يتواصل عبر:

- services
- events
- contracts

وليس direct manipulation.

---

# قواعد المحاسبة

أي domain يريد إنشاء أثر مالي:
يجب أن يستخدم:
- accounting engine
- auto-journal service

ولا يكتب قيود مباشرة.

---

# قواعد APIs

- كل API يجب أن يمر عبر:
  - auth
  - tenant validation
  - permission validation
  - zod validation

---

# قواعد الـ Events

كل event يجب أن يكون:

- واضح الاسم
- موثق
- idempotent
- قابل للإعادة replay-safe

---

# قواعد الـ Refactor

أي refactor كبير:

- يحتاج خطة
- يحتاج rollback plan
- يحتاج tests
- يحتاج migration strategy
