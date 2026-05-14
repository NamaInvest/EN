# 13 - Testing Rules

## الهدف
ضمان أن أي تعديل لا يكسر النظام المالي أو الأمني أو التشغيلي.

---

## 1. أنواع الاختبارات

يجب دعم:

- Unit Tests
- Integration Tests
- E2E Tests
- Financial Tests
- Tenant Isolation Tests
- ZATCA Tests
- Security Tests
- Performance Tests
- Desktop Sync Tests

---

## 2. متى نختبر؟

أي تعديل يجب أن يمر على الأقل بـ:

```bash
npm run typecheck
npm run lint
npm run test:unit
```

إذا التعديل API:

```bash
npm run test:integration
```

إذا التعديل مالي:

```bash
npm run test:financial
```

إذا التعديل واجهة:

```bash
npm run test:e2e
```

---

## 3. اختبارات المحاسبة

يجب اختبار:

- Debit = Credit
- POSTED immutable
- reversal entries
- period lock
- VAT calculation
- trial balance
- financial statements
- customer balance
- supplier balance

---

## 4. اختبارات ZATCA

يجب اختبار:

- XML صحيح
- QR صحيح
- ICV متسلسل
- PIH صحيح
- UUID محفوظ
- رفض تعديل cleared invoice
- retry للفواتير الفاشلة

---

## 5. اختبارات Tenant Isolation

يجب اختبار:

- tenant A لا يرى بيانات tenant B
- API key لا يعمل خارج tenant
- cache لا يخلط tenants
- desktop license لا يعمل لشركة أخرى
- reports لا تسحب بيانات tenants أخرى

---

## 6. اختبارات الصلاحيات

يجب اختبار:

- المستخدم لا يرى موديول غير مفعل
- المستخدم لا ينفذ عملية بدون permission
- ICE منفصل عن tenant users
- impersonation يسجل في audit log

---

## 7. اختبارات المخزون

يجب اختبار:

- كل sale ينقص المخزون
- كل GRN يزيد المخزون
- كل return يحدث المخزون
- stock movement موجود لكل تغيير
- لا quantity سالبة إلا إذا الإعداد يسمح

---

## 8. اختبارات POS

يجب اختبار:

- لا بيع بدون جلسة مفتوحة
- إغلاق الجلسة يحسب الفرق
- المرتجعات تحدث session
- الطباعة لا تكسر البيع
- offline queue لا يكرر الفواتير

---

## 9. اختبارات Desktop Sync

يجب اختبار:

- license validation
- heartbeat
- offline mode
- sync conflict
- duplicate prevention
- expired license يمنع sync

---

## 10. اختبارات الأداء

يجب اختبار:

- pagination
- no N+1 queries
- reports الكبيرة async
- indexes للـ filters المهمة
- P95 response time حسب الهدف

---

## 11. اختبارات الأمن

يجب اختبار:

- auth required
- rate limiting
- CSRF/XSS protections
- no secret leakage
- MFA flows
- API key hashing
- webhook signature

---

## 12. Test Data

استخدم بيانات تجريبية تمثل:

- شركة تجزئة
- مطعم
- صيدلية
- شركة خدمات
- شركة لديها فروع
- شركة تستخدم Desktop

---

## 13. قاعدة ذهبية

أي تعديل Critical بدون اختبار مناسب لا يدمج.
