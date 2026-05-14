# 16 - استكشاف المشاكل وحلولها (Troubleshooting Guide)

> دليل عملي للمشاكل الشائعة في Namasoft ERP

---

## 🔥 المشاكل الأكثر شيوعاً

### 1. "Cannot connect to database"

**الأعراض:**
- 500 Internal Server Error في كل المسارات
- `PrismaClientInitializationError: P1001`

**الأسباب:**
1. PostgreSQL متوقف
2. `DATABASE_URL` خاطئ أو فارغ
3. Connection pool ممتلئ
4. الـ Firewall يحجب

**الحلول:**
```bash
# 1. تحقق من PostgreSQL
sudo systemctl status postgresql

# 2. اختبر الاتصال
psql "$DATABASE_URL" -c "SELECT 1"

# 3. تحقق من DATABASE_URL في الـ env
node -e "console.log(process.env.DATABASE_URL)"

# 4. أعد تشغيل PM2
node deploy.js --restart-only
```

---

### 2. "Cross-tenant data leak" (حُل في 2026-05-14)

**الأعراض:**
- المستأجر `aljassim` يرى بيانات `n1`
- مشكلة أمنية حرجة

**السبب القديم:**
```typescript
const poolKey = 'SHARED_DB_INSTANCE'; // ❌ نفس Client لكل المستأجرين
```

**الحل (مطبق):**
```typescript
// src/lib/prisma.ts سطر 132
const dbUrl = getDbUrl(tenant, isRead);
const poolKey = isRead ? `READ_${dbUrl}` : `WRITE_${dbUrl}`;
// ✅ لكل قاعدة pool مستقل
```

---

### 3. "ZATCA invoice rejected"

**الأعراض:**
- `zatcaStatus: 'rejected'`
- لا QR، لا clearance UUID

**الأسباب الشائعة:**

| الخطأ | السبب | الحل |
|---|---|---|
| `Invalid VAT number` | tax_number خطأ | 15 رقم، يبدأ وينتهي بـ 3 |
| `Invalid signature` | CSID خطأ أو منتهي | جدد عبر `/api/zatca/onboard` |
| `Hash mismatch` | PIH غير متسلسل | افحص `zatca_last_pih` |
| `Invalid ICV` | ICV غير متسلسل | افحص `zatca_invoice_counter` |
| `Missing customer VAT` | B2B بدون VAT للعميل | أضف VAT أو حول لـ B2C |
| `Date in future` | issueDate > الآن | استخدم timestamp الحالي |

**Debug:**
```typescript
const invoice = await prisma.salesInvoice.findUnique({...});
console.log({
    zatcaStatus, zatcaResponse, zatcaXml,
    zatcaIcv, zatcaPih
});
```

---

### 4. "Journal Entry doesn't balance"

**الأعراض:**
- `Error: Total Debit != Total Credit`

**السبب:**
- خطأ تقريب في الحسابات

**الحل:**
```typescript
// ❌ خطأ:
const vat = total * 0.15; // 15.000000000001

// ✅ صحيح:
const vat = Math.round(total * 0.15 * 100) / 100;

// auto-journal.ts tolerance:
if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Imbalance: ${totalDebit - totalCredit}`);
}
```

---

### 5. "Login: Authentication failed"

**الأسباب:**
1. **bcrypt mismatch** — إعادة تعيين بـ cost 10
2. **JWT_SECRET غُيّر** — كل JWTs قديمة باطلة
3. **sessionToken في DB لا يطابق** — `update user set sessionToken = null`
4. **MFA مفعّل** — يحتاج `/api/auth/mfa/verify`

---

### 6. "Provisioning failed: database exists"

**الحل:**
```typescript
// النظام يولّد رقم تلقائياً:
let subdomain = 'aljassim';
let counter = 0;
while (await dbExists(`${subdomain}_db`)) {
    subdomain = `aljassim${++counter}`;
}
// → aljassim, aljassim2, aljassim3
```

**أو احذف القديم:**
```bash
ssh root@46.4.188.170
psql -U postgres -c "DROP DATABASE IF EXISTS aljassim_db;"
```

---

### 7. "Prisma version mismatch"

**الحل (مطبق):**
```bash
# في provision/route.ts:
npx prisma@5.22.0 db push
npx prisma@5.22.0 generate
```

---

### 8. "PM2 service crashed"

```bash
ssh root@46.4.188.170
pm2 logs main-site --err
pm2 restart main-site
pm2 reload main-site --update-env

# لو ما زال:
NODE_OPTIONS=--max-old-space-size=4096 pm2 restart main-site
```

---

### 9. "Rate limit exceeded (429)"

**الحلول:**
```javascript
// في الـ frontend:
const debouncedSearch = debounce(searchProducts, 300);

// في الـ scripts:
for (const item of items) {
    await processItem(item);
    await new Promise(r => setTimeout(r, 100));
}
```

---

### 10. "Migration failed in production"

**خطوات الإصلاح:**
```bash
ssh root@46.4.188.170
cd /www/wwwroot/namainvist.com

# اكتشف الفاشلة:
grep "db push failed" *.log

# لكل مستأجر فاشل:
psql "postgresql://.../{tenant}_db"
\# افحص البيانات
\# اصلحها
\# ثم
npx prisma@5.22.0 db push --schema=... --accept-data-loss
```

---

### 11. "Soft-deleted records appear"

**التحقق:**
```typescript
// prisma.ts: applySoftDeleteMiddleware يجب أن يأتي قبل applyAuditMiddleware
// prisma-soft-delete.ts: النموذج في SOFT_DELETE_MODELS؟
```

**الحل:**
```typescript
// أضف للقائمة:
const SOFT_DELETE_MODELS = [
    'SalesInvoice', 'Customer',
    'YourNewModel' // ← هنا
];
```

---

### 12. "POS session won't close"

**الحل:**
```typescript
// عالج الـ ZATCA pending أولاً:
const pending = await prisma.salesInvoice.findMany({
    where: { posSessionId, zatcaStatus: 'pending' }
});

for (const inv of pending) {
    await retryZatcaSubmit(inv);
}

// أو إجبارياً:
await closeSessionForce(sessionId, { skipZatcaCheck: true });
```

---

### 13. "Telegram bot لا يرد"

```bash
# تحقق webhook:
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"

# سجّل من جديد:
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://namainvist.com/api/telegram/webhook"

# تحقق master_telegram_chat_id موجود في Settings
```

---

### 14. "WhatsApp QR لا يظهر"

```bash
# ابدأ الـ worker:
pm2 start "npm run start:whatsapp" --name whatsapp-worker

# مشاكل شائعة:
# Puppeteer deps:
apt-get install -y libnss3 libatk-bridge2.0-0 libxcomposite1

# session corrupt:
rm -rf .wwebjs_auth/
pm2 restart whatsapp-worker
```

---

### 15. "Email لا يُرسل"

```bash
# 1. اختبر SMTP:
node -e "
const t = require('nodemailer').createTransport({...});
t.verify().then(console.log).catch(console.error);
"

# 2. تأكد worker شغّال:
pm2 list

# 3. افحص queue:
# emailQueue في src/lib/queue/index.ts
```

---

### 16. "Image upload fails (413)"

```typescript
// next.config.ts:
experimental: {
    serverActions: { bodySizeLimit: '10mb' }
}
```

```nginx
# /etc/nginx/sites-available/...
client_max_body_size 50M;
```

---

### 17. "Audit log huge"

```sql
-- Archive القديم:
INSERT INTO audit_log_archive SELECT * FROM audit_log 
WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '1 year';

-- إنشاء Indexes:
CREATE INDEX idx_audit_tenant_date ON audit_log (tenant_id, created_at);
```

---

### 18. "Build out of memory"

```json
// package.json (مطبق):
"build": "cross-env NODE_OPTIONS=--max-old-space-size=4096 next build"
```

```bash
# لو احتجت أكثر:
NODE_OPTIONS=--max-old-space-size=8192 npm run build

# أضف swap على السيرفر:
sudo fallocate -l 4G /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
```

---

### 19. "Multiple Prisma Client warning"

**السبب:** Hot reload في dev يخلق clients جدد

**الحل (مطبق):**
```typescript
// prisma.ts:
const pool = (globalThis as any).__prismaPool ?? new Map();
(globalThis as any).__prismaPool = pool;
```

---

### 20. "Approval workflow stuck"

```typescript
// تحقق:
const stuck = await prisma.approvalRequest.findMany({
    where: { status: 'PENDING', requestedAt: { lt: thirtyDaysAgo } }
});

// أعد توجيه أو تصعيد:
await prisma.approvalRequest.updateMany({
    where: { id: { in: stuck.map(s => s.id) } },
    data: { status: 'ESCALATED' }
});
```

---

## 🛠 أدوات Debug

### الـ Logs:
```bash
ssh root@46.4.188.170
pm2 logs main-site --lines 200
tail -f /www/wwwroot/namainvist.com/logs/*.log
```

### Sentry:
- https://sentry.io/organizations/nama-invest/projects/namaweb

### Prometheus:
```bash
curl http://localhost:3000/api/metrics
```

### Database:
```bash
psql "$DATABASE_URL"
\dt           # list tables
\d sales_invoice  # describe
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50;
```

### Prisma Studio:
```bash
npx prisma studio
# → http://localhost:5555
```

### Telegram Notifications:
- أحياناً تنبيهات الـ AI Auditor تظهر في تيليجرام
- chat_id في `master_telegram_chat_id` setting

---

## 📞 جهات الاتصال

- **مالك المشروع:** ialqrashi62@gmail.com
- **Sentry:** sentry.io/nama-invest
- **Hetzner Support:** للسيرفر 46.4.188.170
- **Cloudflare Support:** للـ DNS/SSL
- **ZATCA Support:** dev-portal.zatca.gov.sa
