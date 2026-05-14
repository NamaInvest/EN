# 05 - Tenant Isolation Rules

## الهدف
ضمان عزل كامل وآمن بين الشركات داخل نظام Nama Invest ERP.

أي خرق لعزل الـ Tenants يعتبر:
# حادث أمني حرج (Critical Security Incident)

---

# 1. القاعدة الأساسية

كل عملية داخل النظام يجب أن تعمل داخل Tenant Context واضح وصحيح.

ممنوع:
- Query بدون tenant
- Cache بدون tenant
- Event بدون tenant
- File بدون tenant
- Session بدون tenant

---

# 2. تعريف Tenant Context

الـ Tenant Context يحتوي:

```json
{
  "tenantId": "uuid",
  "tenantCode": "company123",
  "subdomain": "company123",
  "subscriptionStatus": "ACTIVE",
  "enabledModules": [],
  "environment": "production"
}
```

---

# 3. مصادر تحديد Tenant

يمكن تحديد Tenant من:
- subdomain
- JWT claim
- session
- API key
- desktop license
- x-tenant-id header
- ICE impersonation context

يجب التحقق من التطابق

مثال:
`JWT tenantId == subdomain tenantId`

إذا يوجد اختلاف:
- يتم رفض الطلب
- تسجيل audit log
- اعتبار العملية suspicious

---

# 4. قواعد الـ Database

كل Query يجب أن يحتوي tenant filter

ممنوع:
```ts
prisma.salesInvoice.findMany()
```

الصحيح:
```ts
prisma.salesInvoice.findMany({
  where: {
    tenantId
  }
})
```

---

# 5. قواعد الـ Prisma

ممنوع:
```ts
new PrismaClient()
```
داخل أي Module مباشرة.

يجب استخدام:
- tenant-aware prisma
- scoped prisma
- request context prisma

---

# 6. قواعد الـ Master Database

Master DB يستخدم فقط لـ:
- tenants
- subscriptions
- licenses
- feature flags
- ICE
- provisioning
- billing
- audit المركزي

ممنوع:
Tenant modules لا تكتب في Master DB مباشرة بدون سبب واضح ومعتمد.

---

# 7. قواعد الـ APIs

كل API يجب أن يمر عبر:

Authentication
↓
Tenant Resolution
↓
Tenant Validation
↓
Subscription Check
↓
Permission Check
↓
Module Access Check
↓
Request Validation
↓
Business Logic

---

# 8. قواعد الـ Auth

أي Session يجب أن تحتوي:

```json
{
  "userId": "",
  "tenantId": "",
  "role": "",
  "permissions": []
}
```

ممنوع:
- Session بدون tenantId
- مشاركة session بين tenants
- استخدام token لشركة أخرى

---

# 9. قواعد الـ ICE

لوحة ICE منفصلة بالكامل عن tenants.

ممنوع:
- استخدام tenant auth للوصول إلى ICE
- استخدام ICE APIs داخل tenant apps
- تجاوز impersonation الرسمي

---

# 10. قواعد الـ Impersonation

أي دخول كعميل يجب أن يسجل:

```json
{
  "adminId": "",
  "tenantId": "",
  "reason": "",
  "startedAt": "",
  "endedAt": ""
}
```

يجب إظهار Banner واضح:
`You are impersonating tenant XYZ`

ممنوع:
- impersonation صامت
- impersonation بدون audit log
- impersonation بدون سبب

---

# 11. قواعد الـ Desktop EXE

Desktop يجب أن يرسل:
- tenantId
- subdomain
- hardwareId
- licenseKey
- appVersion

يجب التحقق أن:
`license.tenantId == request.tenantId`

ممنوع:
- استخدام ترخيص شركة لشركة أخرى
- نقل offline DB بين الشركات
- sync cross-tenant

---

# 12. قواعد الـ Offline Storage

كل بيانات Offline تحفظ داخل:
`/tenant-data/{tenantId}`

ممنوع:
- shared local database
- shared sync queue
- shared cache

---

# 13. قواعد الـ Files

كل ملفات العملاء تحفظ داخل:
`/uploads/{tenantId}/`

ممنوع:
- ملفات مشتركة بين الشركات
- public URL بدون authorization
- قراءة ملف Tenant آخر

---

# 14. قواعد الـ Cache

أي Cache Key يجب أن تحتوي tenantId.

أمثلة صحيحة:
- `tenant:{tenantId}:settings`
- `tenant:{tenantId}:products`
- `tenant:{tenantId}:dashboard`

ممنوع:
- `products`
- `dashboard-cache`
- `settings-global`

---

# 15. قواعد الـ Events

كل Event يجب أن يحتوي:

```json
{
  "tenantId": ""
}
```

Exceptions:
يسمح بعدم وجود tenant فقط في:
- system events
- infrastructure events
- global monitoring

---

# 16. قواعد الـ Queues

كل Queue Job يجب أن تحتوي:
- tenantId
- correlationId
- idempotencyKey

قبل التنفيذ:
يجب إعادة تحميل tenant context.

---

# 17. قواعد الـ Reports

أي Report يجب أن:
- يستخدم tenant filters
- يمنع cross-tenant joins
- يمنع global aggregation غير المصرح

ممنوع:
```sql
SELECT * FROM invoices
```
بدون tenant restriction.

---

# 18. قواعد الـ Search

أي Search يجب أن:
- يفلتر بالـ tenant
- يمنع global indexing
- يمنع نتائج tenants أخرى

---

# 19. قواعد الـ AI & RAG

أي AI retrieval يجب أن:
- يعمل داخل tenant scope
- يستخدم tenant vector namespace
- يمنع embedding مشترك

ممنوع:
- AI context cross-tenant
- semantic leakage
- shared embeddings بدون isolation

---

# 20. قواعد الـ Vector DB

كل Tenant يجب أن يملك:
`namespace = tenantId`

ممنوع:
- global embeddings بدون isolation
- shared vector retrieval

---

# 21. قواعد الـ Notifications

الإشعارات يجب أن تحتوي:
- tenantId
- userId

ممنوع:
- إرسال إشعار لشركة أخرى
- broadcast غير مقيد

---

# 22. قواعد الـ Logs

الـ logs يجب أن تحتوي:
- tenantId
- requestId
- userId

ممنوع تسجيل:
- passwords
- tokens
- secrets
- full credit card data

---

# 23. قواعد الـ Backups

كل Tenant backup يجب أن يكون:
- معزول
- مشفر
- قابل للاسترجاع منفصلًا

ممنوع:
- restore لشركة فوق شركة أخرى
- mixing backups

---

# 24. قواعد الـ Testing

يجب وجود اختبارات تثبت:
- tenant A لا يرى tenant B
- tenant A لا يعدل tenant B
- API keys معزولة
- desktop sync معزول
- cache معزول
- vector search معزول

---

# 25. قواعد الـ Monitoring

أي محاولة:
- access cross-tenant
- token mismatch
- invalid tenant context

يجب:
- تسجيلها
- رفع alert
- اعتبارها suspicious

---

# 26. قواعد الـ Migrations

أي migration يجب أن:
- تحافظ على isolation
- لا تكسر tenant indexes
- لا تنشئ global leakage

---

# 27. قواعد الـ Admin Scripts

أي script إداري يجب أن:
- يحدد tenant بوضوح
- يطبع tenant قبل التنفيذ
- يمنع التشغيل global افتراضيًا

---

# 28. قواعد الـ Exports

أي export يجب أن:
- يحتوي tenant data فقط
- يتحقق من permission
- يسجل audit log

---

# 29. قواعد الـ Audit

أي عملية حساسة يجب أن تسجل:
- tenantId
- actor
- action
- affected records
- timestamp

---

# 30. قاعدة ذهبية

إذا كان هناك احتمال ولو بسيط أن:
`Tenant A`
قد يرى
`Tenant B`

فيجب اعتبار ذلك:
`Critical Security Failure`

وإيقاف العملية فورًا.
