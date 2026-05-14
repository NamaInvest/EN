# 31 - المهام المجدولة والـ Workers (CRON Jobs & Workers)

> 29 cron jobs + BullMQ workers + Cron-guard + Scheduling strategy

---

## 🔐 حماية الـ CRON

### كل المسارات `/api/cron/*` تتطلب:
```http
Authorization: Bearer ${CRON_SECRET}
أو
x-cron-secret: ${CRON_SECRET}
```

### الكود (`src/lib/cron-guard.ts`):
```typescript
export function requireCronSecret(req: Request) {
    const auth = req.headers.get('authorization');
    const cronHeader = req.headers.get('x-cron-secret');
    
    const expected = process.env.CRON_SECRET;
    
    if (auth === `Bearer ${expected}` || cronHeader === expected) {
        return true;
    }
    
    throw new Error('Unauthorized cron call');
}
```

---

## 📅 الـ 29 CRON Endpoints

### 🌅 يومية (Daily):

| المسار | الوقت المقترح | الوصف | JE Posted |
|---|---|---|---|
| `/api/cron/daily-audit` | 3:00 AM | AI Auditor report → Telegram | ❌ |
| `/api/cron/debts` | 6:00 AM | تتبع الديون المتأخرة | ❌ |
| `/api/cron/ar-collection-dunning` | 8:00 AM | إرسال رسائل التحصيل | ❌ |
| `/api/cron/payment-reminders` | 9:00 AM | تذكير بفواتير متأخرة | ❌ |
| `/api/cron/backup` | 2:00 AM | نسخة احتياطية | ❌ |
| `/api/cron/zatca-batch-submit` | 11:00 PM | ZATCA المعلق | ❌ |
| `/api/cron/self-healer` | 4:00 AM | إصلاح فواتير عالقة | ❌ |
| `/api/cron/reorder-alerts` | 10:00 AM | تنبيه نقص المخزون | ❌ |
| `/api/cron/document-expiry` | 7:00 AM | انتهاء الوثائق | ❌ |
| `/api/cron/contract-expiry` | 7:00 AM | انتهاء العقود | ❌ |
| `/api/cron/trigger-invoices` | 12:00 AM | فواتير عقود متكررة | ✅ |
| `/api/cron/recurring-billing` | 1:00 AM | اشتراكات | ✅ |
| `/api/cron/shifts` | 11:00 PM | تسوية الورديات | ✅ |

### 📅 شهرية (Monthly):

| المسار | الوقت | الوصف | JE Posted |
|---|---|---|---|
| `/api/cron/hr` | 28th, 3:00 AM | احتساب الرواتب | ❌ |
| `/api/cron/payroll-monthly` | 28th, 4:00 AM | ترحيل الرواتب | ✅ |
| `/api/cron/depreciation-monthly` | Last day, 11 PM | إهلاك الأصول | ✅ |
| `/api/cron/fx-revaluation` | Last day, 10 PM | إعادة تقييم العملات | ✅ |
| `/api/cron/ecl` | Last day | Expected Credit Loss | ✅ |
| `/api/cron/ifrs16-monthly` | Last day | تسوية IFRS 16 | ✅ |
| `/api/cron/rem-leases` | Last day | تحديث ROU assets | ✅ |
| `/api/cron/prepayments-amortization` | Last day | استهلاك المقدمات | ✅ |
| `/api/cron/vendor-scoring` | 1st | تقييم الموردين | ❌ |
| `/api/cron/predictive-po` | 5th | توقع PO تلقائي | ❌ |

### ⏱ دورية أخرى:

| المسار | الوقت | الوصف |
|---|---|---|
| `/api/cron/approval-sla` | كل ساعة | تنبيه SLA الموافقات |
| `/api/cron/zatca-worker` | كل 5 دقائق | معالج قائمة ZATCA |
| `/api/cron/cycle-count` | شهرياً | جرد دوري |
| `/api/cron/vat-return-reminder` | ربعياً | تذكير VAT |
| `/api/cron/contracts` | حسب الإعداد | إدارة العقود |
| `/api/cron/scheduled-reports` | حسب الإعداد | تقارير مجدولة |

---

## 📊 تفاصيل المهام الأكثر أهمية

### 1. AI Daily Audit (`/api/cron/daily-audit`)
**الوقت:** 3:00 AM يومياً

```typescript
// السيناريو:
1. تجميع AuditLog آخر 24 ساعة
2. فحص High-Risk Tables:
   - SalesInvoice (deletes)
   - JournalEntry (manual > 100K)
   - User (role changes)
   - Settings (security changes)
3. حساب Risk Score (0-10)
4. إذا >= 7:
   - Build prompt for Gemini
   - استقبال التحليل
   - Format للـ Telegram
   - Send via Bot
5. حفظ AIAuditReport
```

### 2. Payroll Monthly (`/api/cron/payroll-monthly`)
**الوقت:** 28th, 4:00 AM

```typescript
// السيناريو:
1. للمستأجرين النشطين:
   a. جلب الـ PayrollRun بحالة APPROVED
   b. لكل PayrollInvoice:
      - JE: Dr Salary Expense / Cr Salary Payable + GOSI + ...
   c. تحديث run.status = POSTED
   d. توليد WPS SIF
   e. إرسال للـ HR
```

### 3. ZATCA Worker (`/api/cron/zatca-worker`)
**الوقت:** كل 5 دقائق

```typescript
// السيناريو:
1. جلب الفواتير في حالة 'pending':
   const pending = await prisma.salesInvoice.findMany({
       where: { zatcaStatus: 'pending', zatcaRetries: { lt: 3 } }
   });
2. لكل فاتورة:
   try {
       await zatcaSubmit(invoice);
       invoice.zatcaStatus = 'cleared' | 'reported';
   } catch (e) {
       invoice.zatcaRetries++;
       invoice.zatcaLastError = e.message;
   }
3. إذا retries >= 3 → علم للمراجعة اليدوية
```

### 4. Backup (`/api/cron/backup`)
**الوقت:** 2:00 AM يومياً

```typescript
// السيناريو:
1. لكل tenant active:
   a. pg_dump {tenant}_db → snapshot.sql.gz
   b. حفظ في /var/backups/namasoft/{tenant}/{date}.sql.gz
   c. إنشاء BackupManifest في DB:
      - tenantId, date, size, hash
2. تنظيف backups أقدم من 30 يوم
3. (اختياري) رفع لـ S3/B2
4. تنبيه إذا فشل
```

### 5. Depreciation Monthly (`/api/cron/depreciation-monthly`)
**الوقت:** آخر يوم، 11:00 PM

```typescript
// السيناريو:
1. لكل tenant active:
   a. جلب الأصول النشطة
   b. لكل أصل:
      - حساب monthlyDepreciation
      - JE: Dr Dep Exp / Cr Accum Dep
      - تحديث Asset.netBookValue
      - إنشاء AssetDepreciationLog
   c. تسجيل التقرير الشهري
```

### 6. AR Dunning (`/api/cron/ar-collection-dunning`)
**الوقت:** 8:00 AM يومياً

```typescript
// السيناريو:
1. جلب الفواتير المتأخرة:
   - > 30 يوم: Level 1 (تذكير ودي)
   - > 60 يوم: Level 2 (تحذير)
   - > 90 يوم: Level 3 (إنذار قانوني)
2. لكل عميل:
   - Email + SMS + WhatsApp
   - تحديث dunningCurrentLevel
   - إذا > 90: ضع creditHold = true
3. للعملاء في creditHold:
   - منع البيع الآجل
   - تنبيه الـ Sales
```

### 7. Reorder Alerts (`/api/cron/reorder-alerts`)
**الوقت:** 10:00 AM يومياً

```typescript
1. جلب المنتجات:
   currentStock < minQuantity
2. لكل منتج:
   - حساب reorderQty
   - تنبيه الـ Purchaser (Email + WhatsApp)
   - (اختياري) إنشاء PR تلقائي
```

### 8. FX Revaluation (`/api/cron/fx-revaluation`)
**الوقت:** آخر يوم، 10:00 PM

```typescript
1. للحسابات بعملات أجنبية:
   - حساب القيمة بـ معدل اليوم
   - مقارنة مع القيمة المحفوظة
   - الفرق = FX Gain/Loss
2. JE:
   Dr/Cr FX Asset Adjustment
       Cr/Dr FX Gain/Loss
```

### 9. ECL (`/api/cron/ecl`)
**الوقت:** آخر يوم في الشهر

```typescript
// IFRS 9 — Expected Credit Loss
1. لكل عميل:
   - حساب probability of default
   - بناءً على aging + history
2. حساب ECL = Outstanding × PD × LGD
3. JE:
   Dr Bad Debt Expense
       Cr Allowance for Doubtful Debts
```

### 10. Approval SLA (`/api/cron/approval-sla`)
**الوقت:** كل ساعة

```typescript
1. جلب ApprovalRequests:
   - status = PENDING
   - requested أكثر من SLA (24 ساعة عادة)
2. تنبيه المعتمدين
3. إذا تجاوز 48 ساعة:
   - escalate للمستوى الأعلى
```

---

## 🔧 BullMQ Workers

### الإطار:
- **Library:** BullMQ + Redis
- **Fallback:** in-process إذا Redis غير متاح
- **Worker Startup:** `npm run worker` = `tsx src/scripts/start_workers.ts`

### الـ Queues:

| Queue | Worker | المسؤولية | Concurrency |
|---|---|---|---|
| `emailQueue` | sendEmail | SMTP delivery | 5 |
| `pdfQueue` | CustomerStatementPdfEngine | توليد PDFs | 2 |
| `syncQueue` (event) | EventBus dispatcher | معالجة الأحداث | 3 |
| `syncQueue` (zatca) | reportInvoice | إرسال ZATCA | 3 |
| `syncQueue` (webhook) | webhook delivery | webhooks خارجية | 3 |
| `reportQueue` | CustomReportEngine | تقارير ثقيلة | 2 |
| `aiAuditQueue` | dailyAuditWorker | تدقيق آلي | 2 |
| `cfoReportQueue` | cfoReportWorker | AI CFO | 1 |

### الـ Queue Setup:
```typescript
// src/lib/queue/index.ts
import { Queue, Worker } from 'bullmq';

export const emailQueue = new Queue('email', {
    connection: { url: process.env.REDIS_URL },
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
    }
});

new Worker('email', async (job) => {
    await sendEmail(job.data);
}, { connection: { url: process.env.REDIS_URL }, concurrency: 5 });
```

### الفائدة:
- لا blocking للـ API
- Retry تلقائي
- Failure tracking
- يمكن scale (multiple workers)

---

## 🔄 WhatsApp Worker

### المسار: `src/workers/whatsapp.ts`

```bash
npm run start:whatsapp
# = tsx src/workers/whatsapp.ts
```

### الـ Setup:
```typescript
import { Client, LocalAuth } from 'whatsapp-web.js';

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async (qr) => {
    await prisma.setting.upsert({
        where: { key: 'whatsapp_qr' },
        create: { value: qr },
        update: { value: qr }
    });
});

client.on('ready', async () => {
    await prisma.setting.upsert({
        where: { key: 'whatsapp_status' },
        create: { value: 'connected' },
        update: { value: 'connected' }
    });
});

client.on('message', async (msg) => {
    // معالجة الرسالة
    const customer = await findCustomerByPhone(msg.from);
    if (!customer) return;
    
    const geminiKey = await getSetting('gemini_api_key');
    const response = await askGemini(geminiKey, {
        prompt: buildCustomerPrompt(customer, msg.body),
        temperature: 0.1
    });
    
    await msg.reply(response);
});

client.initialize();
```

---

## 📈 PM2 Scheduling (الاقتراح)

### `ecosystem.config.js`:
```javascript
module.exports = {
    apps: [
        {
            name: 'main-site',
            script: 'npm',
            args: 'start',
            // ...
        },
        {
            name: 'worker',
            script: 'npm',
            args: 'run worker',
            // ...
        },
        {
            name: 'whatsapp',
            script: 'npm',
            args: 'run start:whatsapp',
            // ...
        },
        // CRON via curl:
        {
            name: 'cron-daily-audit',
            script: 'curl',
            args: '-X POST -H "Authorization: Bearer $CRON_SECRET" https://namainvist.com/api/cron/daily-audit',
            cron_restart: '0 3 * * *',  // كل يوم 3 AM
            autorestart: false
        },
        // ... المزيد من cron jobs
    ]
};
```

### بديل: Linux Crontab
```cron
# /etc/cron.d/namainvist
0 3 * * * www-data curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://namainvist.com/api/cron/daily-audit
0 4 28 * * www-data curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://namainvist.com/api/cron/payroll-monthly
*/5 * * * * www-data curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://namainvist.com/api/cron/zatca-worker
0 2 * * * www-data curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://namainvist.com/api/cron/backup
# ...
```

---

## 📊 Monitoring

### الـ Metrics:
- كل CRON يسجل في Prometheus:
  - Duration
  - Success/Failure count
  - Records processed

### الـ Alerts:
- إذا cron فشل > 3 مرات → Telegram
- إذا cron لم يعمل في موعده → Telegram
- إذا duration > threshold → Investigation

---

## 🛡 الحماية والـ Idempotency

### Idempotency:
- كل cron يجب أن يكون idempotent (التشغيل مرتين = نفس النتيجة)
- مثال: payroll-monthly لا يكرر JE لو شُغّل مرتين

### الـ Lock:
```typescript
const lockKey = `cron:${name}:${date}`;
const acquired = await acquireLock(lockKey, 60 * 60); // 1 hour
if (!acquired) {
    return { status: 'already-running' };
}
```

---

## 🎯 Best Practices

1. ✅ **CRON_SECRET صعب** (32+ char hex)
2. ✅ **Idempotent operations** دائماً
3. ✅ **Lock للـ critical crons** (payroll, depreciation)
4. ✅ **Logging مفصل** لكل cron
5. ✅ **Retry policy واضح** (3 attempts عادة)
6. ✅ **Failure notifications** فورية
7. ✅ **Health endpoint** لكل cron
8. ❌ **لا cron طويل** (> 5 دقائق → workers)
9. ❌ **لا cron يكتب JE** بدون checks
10. ✅ **Per-tenant isolation** (cron يجب أن يحدد tenantId)
