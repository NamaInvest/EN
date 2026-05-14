# 07 - State Machine Rules

## الهدف
تنظيم حالات المستندات ومنع الانتقالات العشوائية.

أي مستند مهم يجب أن يتحرك عبر State Machine واضحة.

---

## 1. القاعدة الأساسية

ممنوع تغيير status مباشرة بدون المرور على State Machine.

ممنوع:

```ts
status = 'POSTED'
```

الصحيح:

```ts
stateMachine.transition(document, 'post')
```

---

## 2. Sales Invoice

الحالات:

- DRAFT
- SUBMITTED
- APPROVED
- POSTED
- CLEARED
- PARTIALLY_PAID
- PAID
- CANCELLED
- REVERSED

الانتقالات المسموحة:

- DRAFT → SUBMITTED
- SUBMITTED → APPROVED
- SUBMITTED → REJECTED
- APPROVED → POSTED
- POSTED → CLEARED
- POSTED → PARTIALLY_PAID
- PARTIALLY_PAID → PAID
- POSTED → REVERSED
- DRAFT → CANCELLED

ممنوع:

- PAID → DRAFT
- CLEARED → DRAFT
- POSTED → DRAFT
- CLEARED → DELETE

---

## 3. Journal Entry

الحالات:

- DRAFT
- PENDING_APPROVAL
- APPROVED
- POSTED
- REVERSED
- REJECTED

القواعد:

- POSTED لا يعدل.
- REVERSED لا يعاد ترحيله.
- أي reversal يجب أن ينشئ قيدًا عكسيًا.

---

## 4. Purchase Order

الحالات:

- DRAFT
- APPROVED
- ISSUED
- ACKNOWLEDGED
- PARTIALLY_RECEIVED
- DELIVERED
- CLOSED
- CANCELLED

ممنوع:

- إغلاق PO قبل استلام الكميات أو إلغائها.
- تعديل PO مغلق.
- حذف PO له GRN.

---

## 5. GRN

الحالات:

- DRAFT
- RECEIVED
- QC_PENDING
- QC_PASSED
- QC_FAILED
- POSTED
- CANCELLED

القواعد:

- GRN posted يزيد المخزون.
- QC failed لا يدخل المخزون القابل للبيع.
- GRN مرتبط بفاتورة لا يحذف.

---

## 6. Payroll Run

الحالات:

- DRAFT
- CALCULATED
- REVIEWED
- APPROVED
- POSTED
- PAID
- CANCELLED

القواعد:

- لا payroll بدون مراجعة.
- POSTED لا يعدل.
- التصحيح يكون عبر adjustment run.

---

## 7. POS Session

الحالات:

- OPEN
- SUSPENDED
- CLOSED
- RECONCILED
- LOCKED

القواعد:

- لا بيع بدون OPEN session.
- CLOSED لا يعدل.
- أي فرق نقدي يسجل قبل RECONCILED.

---

## 8. Manufacturing Order

الحالات:

- PLANNED
- RELEASED
- IN_PROGRESS
- QC
- COMPLETED
- CLOSED
- CANCELLED
- REWORK

القواعد:

- لا إغلاق قبل استهلاك المواد.
- لا إنتاج بدون BOM.
- QC failed ينتقل إلى REWORK أو SCRAP.

---

## 9. Desktop License

الحالات:

- PENDING
- ACTIVE
- EXPIRED
- SUSPENDED
- REVOKED

القواعد:

- REVOKED لا يعاد تفعيله إلا بترخيص جديد.
- EXPIRED يمنع sync.
- SUSPENDED يمنع التشغيل أو يضع Grace محدود.

---

## 10. Subscription

الحالات:

- TRIAL
- ACTIVE
- PAST_DUE
- EXPIRED
- SUSPENDED
- CANCELLED

القواعد:

- الاشتراك لا يتجاوز سنة.
- EXPIRED يمنع العمليات حسب السياسة.
- SUSPENDED يمنع الدخول والمزامنة.

---

## 11. Audit

كل انتقال حالة يجب أن يسجل:

- oldState
- newState
- event
- userId
- tenantId
- reason إذا وجد
- timestamp

---

## 12. قاعدة ذهبية

إذا لم تكن transition موثقة، فهي ممنوعة.
