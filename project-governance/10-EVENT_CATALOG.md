# 10 - Event Catalog

## الهدف
توحيد الأحداث داخل النظام ومنع التكرار والفوضى.

كل Event يجب أن يكون:
- واضح
- موثق
- يحتوي tenantId
- idempotent
- قابل لإعادة التشغيل Replay-safe

---

## 1. صيغة الحدث

كل Event يجب أن يحتوي:

```json
{
  "eventId": "uuid",
  "eventType": "SALES_INVOICE_POSTED",
  "tenantId": "tenant",
  "sourceModule": "sales",
  "sourceId": "123",
  "occurredAt": "datetime",
  "payload": {},
  "version": 1
}
```

---

## 2. Sales Events
- `SALES_INVOICE_CREATED`: عند إنشاء فاتورة. المستهلكون: Notification, Audit, BI
- `SALES_INVOICE_POSTED`: عند ترحيل فاتورة. المستهلكون: Accounting, Inventory, ZATCA, BI, Notification
- `SALES_INVOICE_PAID`: عند سداد فاتورة. المستهلكون: AR, Treasury, Customer Statement, Notification
- `SALES_RETURN_POSTED`: عند اعتماد مرتجع. المستهلكون: Accounting, Inventory, ZATCA Credit Note, BI

---

## 3. Purchase Events
- `PURCHASE_REQUISITION_SUBMITTED`
- `PURCHASE_ORDER_APPROVED`
- `GRN_RECEIVED`
- `PURCHASE_INVOICE_POSTED`
- `PAYMENT_MADE`

المستهلكون: Accounting, Inventory, Treasury, Vendor Statement, Approval

---

## 4. Inventory Events
- `STOCK_LOW`
- `STOCK_OUT`
- `STOCK_MOVEMENT_POSTED`
- `STOCK_TRANSFER_COMPLETED`
- `STOCKTAKE_VARIANCE_POSTED`
- `BATCH_EXPIRY_SOON`

المستهلكون: Notification, Purchasing, BI, Accounting عند وجود أثر مالي

---

## 5. Accounting Events
- `JOURNAL_POSTED`
- `JOURNAL_REVERSED`
- `PERIOD_CLOSED`
- `PERIOD_REOPENED`
- `BANK_RECONCILIATION_COMPLETED`

المستهلكون: Reports, Audit, CFO Dashboard, Compliance

---

## 6. HR Events
- `EMPLOYEE_CREATED`
- `LEAVE_REQUESTED`
- `LEAVE_APPROVED`
- `PAYROLL_CALCULATED`
- `PAYROLL_POSTED`
- `WPS_FILE_GENERATED`
- `EOS_SETTLEMENT_POSTED`

المستهلكون: Payroll, Accounting, Notification, Compliance

---

## 7. ZATCA Events
- `ZATCA_INVOICE_GENERATED`
- `ZATCA_CLEARED`
- `ZATCA_REPORTED`
- `ZATCA_REJECTED`
- `ZATCA_RETRY_REQUIRED`

المستهلكون: Compliance, Notification, Audit, Support

---

## 8. Subscription Events
- `TENANT_TRIAL_STARTED`
- `SUBSCRIPTION_ACTIVATED`
- `SUBSCRIPTION_RENEWED`
- `SUBSCRIPTION_EXPIRED`
- `TENANT_SUSPENDED`
- `TENANT_REACTIVATED`

المستهلكون: ICE, Billing, Notification, License Service

---

## 9. Desktop Events
- `DESKTOP_LICENSE_ACTIVATED`
- `DESKTOP_HEARTBEAT_RECEIVED`
- `DESKTOP_SYNC_STARTED`
- `DESKTOP_SYNC_FAILED`
- `DESKTOP_LICENSE_EXPIRED`
- `DESKTOP_DEVICE_REVOKED`

المستهلكون: ICE, Support, License Service, Monitoring

---

## 10. AI Events
- `AI_COPILOT_REQUESTED`
- `AI_CFO_REPORT_GENERATED`
- `AI_AUDIT_ALERT_CREATED`
- `AI_FRAUD_SIGNAL_DETECTED`
- `AI_OCR_EXTRACTION_COMPLETED`

المستهلكون: Audit, Notification, AI Cost Tracking, Governance

---

## 11. Webhook Delivery

أي Event يمكن إرساله خارجيًا فقط إذا:

- tenant فعّل webhook
- event مسموح
- payload لا يحتوي secrets
- التوقيع HMAC موجود
- idempotency key موجود

---

## 12. Retry Rules

عند فشل event consumer:

- retry 3 مرات
- exponential backoff
- بعد الفشل يتم وضعه FAILED
- يمكن replay يدوي من ICE

---

## 13. Idempotency

أي consumer يجب أن يتعامل مع تكرار الحدث.

ممنوع افتراض أن event سيصل مرة واحدة فقط.

---

## 14. قاعدة ذهبية

أي عملية مهمة بدون Event موثق تعتبر ناقصة.
