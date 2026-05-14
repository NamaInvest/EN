# 06 - Accounting Lock Rules

## الهدف
حماية النظام المالي ومنع التعديلات التي قد تسبب:
- فساد مالي
- اختلاف التقارير
- مشاكل ضريبية
- أخطاء محاسبية
- مشاكل تدقيق ومراجعة

هذا الملف يعتبر من أعلى ملفات الحوكمة خطورة داخل النظام.

---

# 1. القاعدة الأساسية

أي مستند أو قيد مالي بعد الترحيل (POSTED):
- لا يتم تعديله مباشرة
- لا يتم حذفه
- لا يتم تغيير تأثيره المالي

التصحيح يتم فقط عبر:
- Reversal
- Adjustment Entry
- Credit Note
- Debit Note
- Reopen process رسمي

---

# 2. المستندات المقفلة

المستندات التالية تعتبر مقفلة بعد POSTED:

## المبيعات
- Sales Invoice
- Credit Note
- Debit Note
- POS Invoice

## المشتريات
- Purchase Invoice
- Vendor Credit Note
- GRN المرتبط ماليًا

## المحاسبة
- Journal Entry
- Recurring Journal
- Allocation Entries
- FX Revaluation

## الخزينة
- Payment
- Receipt
- Bank Transfer
- Bank Reconciliation

## الرواتب
- Payroll Run
- EOS Settlement
- WPS Batch

## المخزون
- Inventory Adjustment له أثر مالي
- Stock Valuation
- Manufacturing Cost Posting

---

# 3. قواعد POSTED

أي مستند POSTED:

ممنوع:
- UPDATE مباشر
- DELETE
- تغيير الحسابات
- تغيير الضريبة
- تغيير المبالغ
- تغيير العملة
- تغيير tenantId
- تغيير الرقم التسلسلي

---

# 4. طريقة التصحيح الصحيحة

## الفواتير

إذا يوجد خطأ:

### استخدم:
- Credit Note
- Debit Note
- Cancellation Invoice

### لا تستخدم:
- تعديل مباشر
- حذف
- تغيير total

---

## القيود

إذا القيد خاطئ:

### استخدم:
- Reverse Entry
- Adjustment Entry

### ممنوع:
- تعديل JournalLine
- حذف القيد
- تغيير الرصيد

---

# 5. ZATCA Locks

أي فاتورة:
- CLEARED
أو
- REPORTED

تصبح Immutable.

---

## ممنوع:

- تعديل XML
- تعديل QR
- تعديل UUID
- تعديل ICV
- تعديل PIH
- تعديل tax amount
- حذف response

---

## التصحيح يتم عبر:

- Credit Note
- Debit Note
- Cancellation حسب متطلبات ZATCA

---

# 6. Period Lock

## عند إغلاق الفترة المالية:

يتم منع:
- إنشاء قيود
- تعديل قيود
- حذف قيود
- إنشاء فواتير
- تعديل VAT
- تعديل Inventory Valuation
- Payroll posting
- FX revaluation

---

## إعادة فتح الفترة

تحتاج:

- صلاحية عالية
- سبب مكتوب
- Audit log
- Approval إذا policy يتطلب

---

# 7. Payroll Lock

أي Payroll POSTED:

ممنوع:
- تعديل payslip
- تعديل deductions
- تعديل allowances
- تعديل tax
- تعديل GOSI
- تعديل WPS

---

## التصحيح يتم عبر:

- Adjustment payroll run
- Reversal payroll batch

---

# 8. Inventory Financial Lock

أي حركة مخزون لها أثر مالي بعد POSTED:

ممنوع:
- تعديل quantity
- تعديل cost
- تعديل warehouse
- حذف movement

---

## التصحيح يتم عبر:

- inventory adjustment
- return
- correction document

---

# 9. Reconciliation Lock

أي Bank Reconciliation مكتملة:

ممنوع:
- حذف transaction
- تعديل amount
- فك الربط بدون صلاحية

---

## فك reconciliation

يحتاج:
- manager approval
- audit log
- reason

---

# 10. Approval Lock

أي مستند APPROVED أو POSTED:

لا يمكن إرجاعه إلى:
- DRAFT
- EDITABLE

إلا عبر:
- reopen workflow
- reversal process

---

# 11. Audit Lock

أي عملية مالية يجب أن تسجل:

- old value
- new value
- user
- tenant
- timestamp
- reason
- source module

---

## ممنوع:

- حذف audit logs
- تعديل audit logs
- overwrite logs

---

# 12. Soft Delete Rules

المستندات المالية:
- لا تحذف hard delete
- تستخدم soft delete فقط إذا policy تسمح

لكن:
- POSTED financial docs لا soft delete أيضًا غالبًا

---

# 13. Numbering Lock

الأرقام الرسمية:
- invoices
- vouchers
- receipts
- journals

ممنوع:
- إعادة الترقيم
- تغيير الرقم
- reuse number

---

# 14. Currency Lock

أي مستند POSTED:

ممنوع:
- تغيير exchange rate
- تغيير base amount
- تغيير foreign amount

---

# 15. Exchange Difference

أي فرق عملة بعد POSTED:

يعالج عبر:
- FX Gain/Loss entry

وليس تعديل المستند الأصلي.

---

# 16. Tenant Financial Isolation

ممنوع:
- نقل قيد بين tenants
- مشاركة sequence
- مشاركة control accounts
- cross-tenant reconciliation

---

# 17. API Lock Rules

أي API مالية يجب أن تتحقق من:

- auth
- tenant
- permissions
- period status
- document status
- lock status

---

## ممنوع:

API bypass:
```text
?force=true
?ignoreLocks=true
```
