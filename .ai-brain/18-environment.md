# 18 - البيئة والنشر والتشغيل (Environment, Deployment & Operations)

> ENV vars + النشر + السيرفر + CRON jobs + Workers

---

## 🌐 معلومات السيرفر

### Production:
| المعلومة | القيمة |
|---|---|
| **Provider** | Hetzner |
| **IP** | `46.4.188.170` |
| **Location** | German Datacenter |
| **OS** | Linux (Ubuntu/Debian) |
| **Web Server** | Nginx |
| **Process Manager** | PM2 |
| **Database** | PostgreSQL (latest) |
| **SSL** | Let's Encrypt (auto-renew) |
| **CDN** | Cloudflare |
| **Domain** | `namainvist.com` + `*.namainvist.com` |

### SSH:
- **Host:** `46.4.188.170:22`
- **User:** `root`
- **Password:** `_ee4SWbxLVfH9b` (في `provision/route.ts` كـ default — يفضّل ENV)
- **Path:** `/www/wwwroot/namainvist.com`

---

## 🔐 متغيرات البيئة الكاملة (.env)

### قاعدة البيانات (Multi-Tenant):
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/n11_db?schema=public"
DATABASE_URL_N1="postgresql://postgres:password@localhost:5432/n1_db?schema=public"
DATABASE_URL_DEFAULT="postgresql://postgres:password@localhost:5432/n11_db?schema=public"
MASTER_DB_URL="postgresql://postgres:password@localhost:5432/n11_db?schema=public"
```

### الأمان:
```bash
# 64-char hex (تولّد بـ openssl rand -hex 64)
JWT_SECRET="..."

# 32-byte hex AES-256-GCM (openssl rand -hex 32)
ENCRYPTION_KEY="..."

# لحماية /api/cron/*
CRON_SECRET="..."
```

### التطبيق:
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://namainvist.com
NEXT_PUBLIC_IS_DESKTOP=0
NEXT_PUBLIC_APP_VERSION=2.4.8
ELECTRON_BUILD=0
DESKTOP_MODE=false
TENANT=n11    # tenant افتراضي
```

### Clerk (Auth):
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/sso-callback
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### Master Owners:
```bash
# مالك المنصة (NamaInvest)
ICE_OWNER_EMAIL=ialqrashi62@gmail.com
MASTER_OWNER_EMAIL=ialqrashi62@gmail.com
MASTER_ADMIN_EMAIL=admin@namainvist.com
```

### Gemini AI:
```bash
GEMINI_API_KEY=AIzaSy...
# Models used:
#   gemini-2.0-flash (default)
#   gemini-2.5-flash (CFO, Auditor)
```

### ZATCA:
```bash
ZATCA_ENV=production       # أو simulation
ZATCA_API_URL=https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal
ZATCA_API_KEY=...
ZATCA_API_SECRET=...
ZATCA_CCSID=...
ZATCA_CERT_PATH=/etc/namasoft/zatca/cert.pem
ZATCA_PRIVATE_KEY_PATH=/etc/namasoft/zatca/private.pem
```

### Email (SMTP):
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=app-password    # Gmail App Password
SMTP_FROM="NamaSoft ERP <noreply@namainvist.com>"
```

### Sentry:
```bash
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...
```

### Telegram Bot:
```bash
TELEGRAM_BOT_TOKEN=123456:...
TELEGRAM_CHAT_ID=...
TELEGRAM_ADMIN_CHAT_ID=...
```

### WhatsApp Business (Meta Cloud):
```bash
WHATSAPP_ACCESS_TOKEN=EAAG...
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=mySecretToken123
```

### Redis (BullMQ Queue):
```bash
REDIS_URL=redis://localhost:6379
# أو Upstash:
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### السعودية:
```bash
GOSI_API_KEY=...
GOSI_API_URL=https://api.gosi.gov.sa
WPS_BANK_CODE=RJHI
MUDAD_API_URL=https://api.mudad.com.sa
MUDAD_CLIENT_ID=...
MUDAD_CLIENT_SECRET=...
QIWA_API_URL=https://api.qiwa.sa
QIWA_API_KEY=...
```

### تجارة إلكترونية:
```bash
SALLA_ACCESS_TOKEN=...
SALLA_CLIENT_SECRET=...
ZID_WEBHOOK_SECRET=...
TABBY_API_KEY=...
TAMARA_API_KEY=...
```

### النسخ الاحتياطية:
```bash
BACKUP_STORAGE_PATH=/var/backups/namasoft
BACKUP_S3_BUCKET=namasoft-backups
BACKUP_S3_ACCESS_KEY=...
BACKUP_S3_SECRET_KEY=...
```

### Provisioning SSH:
```bash
PROVISION_SSH_HOST=46.4.188.170
PROVISION_SSH_USER=root
PROVISION_SSH_PASS=...
```

### Translation:
```bash
GOOGLE_TRANSLATE_API_KEY=AIzaSy...
```

---

## 🚀 سكربت النشر (`deploy.js`)

### الأوامر الرئيسية:

```bash
# 1. نشر ذكي (الـ default)
node deploy.js <files>
# يكتشف تلقائياً:
# - lib/ أو api/ → restart فقط
# - components/ أو page.tsx → build كامل

# 2. ملفات فقط (سريع)
node deploy.js --files-only <files>

# 3. مع Build كامل
node deploy.js <files> --build

# 4. Restart فقط
node deploy.js --restart-only

# 5. تحديث Schema للجميع
node deploy.js --db-push

# 6. متوازي (Faster build)
node deploy.js --build --parallel
```

### قواعد الـ Build:
- ✅ **يحتاج Build:** `src/app/*page.*`, `src/components/`, `next.config.ts`
- ✅ **Restart كافي:** `src/app/api/`, `src/lib/`
- ❌ **لا تمسح `.next`** — يُبنى فوقه (lazy build)

### عناصر `deploy.js` (267 سطر):
```javascript
const TARGETS = [
    {
        name: 'main-site',
        pm2Name: 'main-site',
        path: '/www/wwwroot/namainvist.com',
    },
    {
        name: 'n1-main',
        pm2Name: 'n1-main',
        path: '/www/wwwroot/namainvist.com',
    },
    {
        name: 'saas-app',
        pm2Name: 'saas-app',
        path: '/www/wwwroot/namainvist.com',
    },
];

const BUILD_REQUIRED_PATTERNS = [
    /src\/app\/.*page\./,
    /src\/app\/.*layout\./,
    /src\/components\//,
    /next\.config\./,
    /tailwind\.config\./,
];
```

---

## 🔄 خدمات PM2

```bash
# عرض الكل:
pm2 list

# الـ services الأساسية:
┌─────┬──────────────┬──────┬───────────┬───────┐
│ id  │ name         │ pid  │ status    │ cpu   │
├─────┼──────────────┼──────┼───────────┼───────┤
│ 0   │ main-site    │ ...  │ online    │ 5%    │
│ 1   │ n1-main      │ ...  │ online    │ 3%    │
│ 2   │ saas-app     │ ...  │ online    │ 8%    │
│ 3   │ worker       │ ...  │ online    │ 2%    │
│ 4   │ whatsapp     │ ...  │ online    │ 4%    │
└─────┴──────────────┴──────┴───────────┴───────┘

# أوامر:
pm2 logs main-site
pm2 logs main-site --err
pm2 restart main-site
pm2 reload main-site --update-env  # مع تحديث ENV
pm2 stop main-site
pm2 monit                          # شاشة real-time
pm2 save                           # احفظ القائمة
pm2 startup                        # auto-start on reboot
```

### ecosystem.config.js (مثال):
```javascript
module.exports = {
    apps: [
        {
            name: 'main-site',
            script: 'npm',
            args: 'start',
            cwd: '/www/wwwroot/namainvist.com',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            max_memory_restart: '1G',
            error_file: 'logs/error.log',
            out_file: 'logs/out.log',
            time: true,
        },
        // ...
    ]
};
```

---

## ⏰ CRON Jobs (29 مهمة)

> كل المسارات تستخدم `Authorization: Bearer ${CRON_SECRET}` أو `x-cron-secret: ${CRON_SECRET}`

### يوميات (Daily):
| المسار | الوقت المقترح | الوصف |
|---|---|---|
| `/api/cron/daily-audit` | 3:00 AM | تقرير تدقيق يومي → Telegram |
| `/api/cron/debts` | 6:00 AM | تتبع الديون المتأخرة |
| `/api/cron/ar-collection-dunning` | 8:00 AM | إرسال رسائل التحصيل |
| `/api/cron/payment-reminders` | 9:00 AM | تذكير بالفواتير المتأخرة |
| `/api/cron/backup` | 2:00 AM | نسخة احتياطية |
| `/api/cron/zatca-batch-submit` | 11:00 PM | إرسال ZATCA المعلق |
| `/api/cron/self-healer` | 4:00 AM | إصلاح الفواتير العالقة |
| `/api/cron/reorder-alerts` | 10:00 AM | تنبيه نقص المخزون |
| `/api/cron/document-expiry` | 7:00 AM | انتهاء الوثائق |
| `/api/cron/contract-expiry` | 7:00 AM | انتهاء العقود |
| `/api/cron/trigger-invoices` | 12:00 AM | فواتير متكررة (عقود) |
| `/api/cron/recurring-billing` | 1:00 AM | فواتير اشتراكات |
| `/api/cron/shifts` | 11:00 PM | تسوية الورديات |

### شهريات (Monthly):
| المسار | الوقت | الوصف |
|---|---|---|
| `/api/cron/hr` | 28th, 3:00 AM | احتساب الرواتب |
| `/api/cron/payroll-monthly` | 28th, 4:00 AM | ترحيل الرواتب |
| `/api/cron/depreciation-monthly` | Last day, 11 PM | إهلاك الأصول |
| `/api/cron/fx-revaluation` | Last day, 10 PM | إعادة تقييم العملات |
| `/api/cron/ecl` | Last day | Expected Credit Loss |
| `/api/cron/ifrs16-monthly` | Last day | تسوية الإيجارات IFRS 16 |
| `/api/cron/rem-leases` | Last day | تحديث ROU assets |
| `/api/cron/prepayments-amortization` | Last day | استهلاك المدفوعات المقدمة |
| `/api/cron/vendor-scoring` | 1st | تقييم الموردين |
| `/api/cron/predictive-po` | 5th | توقع PO تلقائياً |

### دورية أخرى:
| المسار | الوقت | الوصف |
|---|---|---|
| `/api/cron/approval-sla` | كل ساعة | تنبيه SLA الموافقات |
| `/api/cron/zatca-worker` | كل 5 دقائق | معالج قائمة ZATCA |
| `/api/cron/cycle-count` | شهرياً | جرد دوري |
| `/api/cron/vat-return-reminder` | ربعياً | تذكير VAT |
| `/api/cron/contracts` | حسب الإعداد | إدارة العقود |
| `/api/cron/scheduled-reports` | حسب الإعداد | تقارير مجدولة |

### إعداد crontab (مثال):
```cron
# /etc/cron.d/namainvist
0 3 * * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://namainvist.com/api/cron/daily-audit
0 6 * * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://namainvist.com/api/cron/debts
0 4 28 * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://namainvist.com/api/cron/payroll-monthly
*/5 * * * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://namainvist.com/api/cron/zatca-worker
```

---

## 🔧 Background Workers (BullMQ + Custom)

### Worker Startup:
```bash
npm run worker
# = tsx src/scripts/start_workers.ts
```

### Queues (`src/lib/queue/index.ts`):
| Queue | Worker | المسؤولية | Concurrency |
|---|---|---|---|
| `emailQueue` | sendEmail | إرسال SMTP | 5 |
| `pdfQueue` | CustomerStatementPdfEngine | توليد PDFs | 2 |
| `syncQueue` (event) | EventBus dispatcher | معالجة الأحداث | 3 |
| `syncQueue` (zatca) | reportInvoice | إرسال ZATCA | 3 |
| `syncQueue` (webhook) | webhook delivery | إرسال webhooks | 3 |
| `reportQueue` | CustomReportEngine | تقارير ثقيلة | 2 |
| `aiAuditQueue` | dailyAuditWorker | تدقيق آلي | 2 |
| `cfoReportWorker` | AI CFO | تقرير مالي ذكي | 1 |

### WhatsApp Worker (`src/workers/whatsapp.ts`):
```bash
npm run start:whatsapp
# = tsx src/workers/whatsapp.ts
```

**ما يفعل:**
- يبدأ WhatsApp Web client (whatsapp-web.js + Puppeteer)
- يحفظ الـ QR في `Setting.whatsapp_qr` للمسح
- يستقبل الرسائل من العملاء
- يستخدم Gemini للرد التلقائي

---

## 📊 Monitoring

### Sentry:
- **URL:** https://sentry.io/nama-invest/namaweb
- **Captures:** كل uncaught exception
- **Tunnel:** `/monitoring` (لتجاوز ad-blockers)

### Prometheus:
- **Endpoint:** `GET /api/metrics`
- **Format:** Prometheus text 0.0.4
- **Metrics:**
  - `http_requests_total` (counter)
  - `http_request_duration_seconds` (histogram)
  - `journal_entries_posted_total` (counter)
  - `webhook_deliveries_total` (counter)
  - `llm_tokens_consumed_total` (counter)
  - `api_key_requests_total` (counter)
  - `approval_requests_total` (counter)
  - `active_webhook_subscriptions` (gauge)
  - `nodejs_heap_used_bytes` (gauge)
  - `process_uptime_seconds` (gauge)

### Telegram Notifications:
- AI Auditor يرسل تقرير يومي
- Webhook failures
- Backup status
- System alerts

### Logs:
```bash
# PM2 logs
pm2 logs main-site

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-*.log

# Custom logs
tail -f /www/wwwroot/namainvist.com/logs/*.log
```

---

## 💾 النسخ الاحتياطية

### الإستراتيجية:
1. **يومي:** `/api/cron/backup` يأخذ snapshot لكل قاعدة
2. **الموقع:** `/var/backups/namasoft/{tenant}/{date}.sql.gz`
3. **الاحتفاظ:** آخر 30 يوم محلياً
4. **Off-site (مقترح):** نسخ يومي لـ S3/B2

### الاستعادة:
```bash
# استعادة قاعدة محددة:
gunzip < /var/backups/namasoft/aljassim/2026-05-14.sql.gz | psql aljassim_db

# استعادة كاملة:
sudo -u postgres pg_restore -d aljassim_db /var/backups/.../backup.dump
```

---

## 🔐 Security Hardening

### Server:
```bash
# Firewall (ufw):
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw enable

# Fail2ban (anti brute-force):
apt install fail2ban
# config in /etc/fail2ban/jail.d/sshd.conf

# Disable root SSH (after creating sudo user):
# /etc/ssh/sshd_config:
# PermitRootLogin no
# PasswordAuthentication no  # use SSH keys only
```

### Application:
- ✅ HTTPS enforced (HSTS)
- ✅ CSP headers (في next.config.ts)
- ✅ XSS Protection
- ✅ CSRF tokens
- ✅ Rate limiting
- ✅ MFA for admins
- ✅ Audit log immutable

### Database:
```bash
# Only listen locally:
# postgresql.conf: listen_addresses = 'localhost'

# Use strong passwords
# Connection encryption (SSL)
# Regular updates
apt-get update && apt-get upgrade postgresql -y
```

---

## 🎯 Health Checks

### Endpoints:
- `GET /api/health` — basic health
- `GET /api/sys/health` — detailed health (DB, Redis, ZATCA)
- `GET /api/metrics` — Prometheus

### مثال response:
```json
{
    "status": "ok",
    "timestamp": "2026-05-14T10:30:00Z",
    "checks": {
        "database": "ok",
        "redis": "ok",
        "zatca": "ok",
        "diskSpace": "ok (45%)",
        "memory": "ok (60%)"
    }
}
```

### مراقبة خارجية:
- استخدم UptimeRobot أو Pingdom
- ينبه إذا الموقع down

---

## 📋 Checklist قبل النشر

- [ ] `npm run lint` بدون أخطاء
- [ ] `npm run typecheck` بدون أخطاء
- [ ] `npm run test` يمر
- [ ] الـ ENV vars محدّثة في الـ production
- [ ] الـ migrations جاهزة (إذا فيه schema changes)
- [ ] Backup قاعدة البيانات أخذ
- [ ] الـ deploy.js يحدد الـ targets الصحيحة
- [ ] رسالة commit واضحة
- [ ] الـ Sentry monitoring مفعّل
