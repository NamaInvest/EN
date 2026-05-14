# Financial Change Policy

## أي تعديل مالي يعتبر عالي الخطورة.

---

# يشمل:

- accounting
- VAT
- ZATCA
- payroll
- treasury
- reconciliation
- period close
- currency conversion

---

# قبل أي تعديل

يجب:

1. تحديد التأثير المالي
2. تحديد التقارير المتأثرة
3. تحديد الجداول المتأثرة
4. كتابة tests
5. تجهيز rollback plan

---

# ممنوع

- تعديل posted journals
- حذف financial records
- تعديل closed periods
- bypass accounting engine

---

# أي تعديل مالي يجب أن يختبر:

- ledger balance
- trial balance
- VAT reports
- reconciliation
- audit logs
