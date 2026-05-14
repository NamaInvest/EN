# 01 - هيكلية النظام كاملة (System Architecture)

> مستخرج بالفعل من قراءة سطر-بسطر للملفات المعدلة في 2026-05-14: `middleware.ts` (206 سطر) و `prisma.ts` (306 سطر) و `with-route.ts` (211 سطر) و `provision/route.ts` (477 سطر) و `proxy.ts` (205 سطر)

---

## 🏗 التقنيات الفعلية (من `package.json`)

| الطبقة | التقنية | الإصدار |
|---|---|---|
| **Framework** | Next.js | 16.2.6 (App Router + Turbopack) |
| **Runtime** | Node.js | عبر PM2 |
| **Language** | TypeScript | 6.x (strict mode) |
| **React** | React + ReactDOM | 19.2.6 |
| **ORM** | Prisma | 5.22.0 |
| **Database** | PostgreSQL | 18.3.0-beta.17 |
| **Auth (Identity)** | Clerk | 7.3.3 |
| **Auth (Session)** | JWT (jsonwebtoken + jose) | 9.0.3 |
| **Password Hash** | bcryptjs + bcrypt | 3.0.3 / 6.0.0 |
| **Styling** | TailwindCSS | 4 |
| **Validation** | Zod | 4.4.3 |
| **Forms** | react-hook-form | 7.75.0 |
| **Tables** | tanstack/react-table | 8.21.3 |
| **Charts** | Recharts | 3.8.1 |
| **Queries** | tanstack/react-query | 5.100.9 |
| **AI** | Google Gemini + LangChain | 0.24.1 / 1.4.0 |
| **Email** | nodemailer | 8.0.7 |
| **PDF** | jspdf + puppeteer | 4.2.1 / 24.43.1 |
| **Excel** | exceljs + xlsx | 4.4.0 / 0.18.5 |
| **OCR** | tesseract.js | 7.0.0 |
| **WhatsApp** | whatsapp-web.js | 1.34.7 |
| **Queue** | BullMQ + Redis | 5.76.6 / 5.10.1 |
| **Telemetry** | Sentry | 10.52.0 |
| **Errors** | Custom logger (pino-style) | - |
| **Metrics** | Custom Prometheus (no deps) | - |
| **SSH (Provisioning)** | ssh2 + ssh2-sftp-client | 1.17.0 / 12.1.1 |
| **Desktop** | Electron + electron-builder + electron-updater | 42.0.1 / 26.8.1 |
| **Embedded DB** | embedded-postgres | للديسكتوب |
| **ZATCA** | zatca-xml-js + Custom | 0.1.9 |
| **MFA** | otplib + speakeasy | 13.4.0 / 2.0.0 |

---

## 📁 هيكل المشروع الفعلي

```
d:\namasoft9-3-main\
├── CLAUDE.md                    ← قواعد إلزامية للـ AI
├── GLOBAL_ERP_GAP_ANALYSIS.md   ← نسب اكتمال الموديولات
├── BUSINESS_FLOWS_GUIDE.md      ← 18 فلو أعمال موثقة
├── SYSTEM_MASTER_GUIDE.md       ← دليل التشغيل
├── middleware.ts                ← Edge Middleware (206 سطر)
├── deploy.js                    ← أداة النشر عبر SSH (267 سطر)
├── next.config.ts               ← إعداد Next + CSP + Sentry
├── package.json                 ← 76 dep + 46 devDep
├── prisma/
│   └── schema.prisma            ← 11,922 سطر | 607 جدول | 1 enum
├── public/
├── scripts/                     ← سكريبتات Electron build
├── src/
│   ├── proxy.ts                 ← Clerk Middleware (205 سطر)
│   ├── app/
│   │   ├── (auth)/              ← صفحات SSO وتسجيل الدخول
│   │   ├── (dashboard)/         ← 109 موديول مستخدم
│   │   ├── api/                 ← 167 قسم API، 848 route.ts
│   │   ├── ice/                 ← لوحة ICE Super Admin
│   │   ├── master-panel/        ← لوحة المالك المركزية
│   │   ├── login/page.tsx       ← صفحة دخول موحدة (581 سطر)
│   │   ├── sign-up/             ← Clerk Sign-up
│   │   └── sso-callback/        ← Callback من Clerk SSO
│   ├── lib/                     ← 536 ملف
│   │   ├── prisma.ts            ← Smart Proxy + RLS + Pool (306 سطر)
│   │   ├── prisma-soft-delete.ts ← Soft Delete Middleware
│   │   ├── prisma-audit.ts      ← Audit Middleware
│   │   ├── auth.ts              ← JWT + bcrypt + Permission (234 سطر)
│   │   ├── auto-journal.ts      ← محرك القيود التلقائية (53KB)
│   │   ├── costing.ts           ← FIFO/LIFO/Average (156 سطر)
│   │   ├── numbering.ts         ← الترقيم التسلسلي (163 سطر)
│   │   ├── hijri.ts             ← التقويم الهجري (98 سطر)
│   │   ├── zatca.ts             ← QR + XML للزكاة
│   │   ├── period-close.ts      ← إقفال الفترات المحاسبية
│   │   ├── depreciation-engine.ts ← الإهلاك (490 سطر)
│   │   ├── financial-statements-engine.ts ← الميزانية + P&L (27KB)
│   │   ├── cash-flow-forecasting.ts ← التدفق النقدي (17KB)
│   │   ├── bank-reconciliation.ts ← المطابقة البنكية
│   │   ├── payroll-reconciliation-engine.ts ← الرواتب
│   │   ├── approval-engine.ts   ← workflow الاعتمادات
│   │   ├── event-bus.ts         ← Pub/Sub للأحداث
│   │   ├── webhooks.ts          ← Outbound + retries
│   │   ├── backup-engine.ts     ← النسخ الاحتياطي
│   │   ├── api/with-route.ts    ← HOF أمني (211 سطر)
│   │   ├── api/rate-limit.ts    ← Sliding Window في الذاكرة
│   │   └── instrumentation/metrics.ts ← Prometheus (225 سطر)
│   ├── components/              ← 63 مكون UI
│   ├── workers/                 ← Worker للـ WhatsApp وغيره
│   └── scripts/                 ← start_workers.ts
├── electron/                    ← كود Electron
├── .ai-brain/                   ← ذاكرة AI (هذا المجلد)
└── tests/                       ← Jest + Playwright
```

---

## 🔄 دورة حياة الطلب الكاملة

### 🌐 الطلب من المتصفح → الاستجابة

```
المتصفح
   │
   ▼
Cloudflare (proxy + DDoS protection)
   │
   ▼
Nginx (على VPS)
   │
   ▼
Next.js Edge Middleware (middleware.ts) ─── أو ── Clerk Middleware (proxy.ts)
   │
   ├── يستخرج subdomain من Host header
   ├── يحقن `x-tenant-subdomain` header
   ├── يفحص نوع المسار:
   │   ├── معطّل → 410 Gone
   │   ├── Cron → فحص x-cron-secret
   │   ├── Public (36 مسار) → يمرر بدون auth
   │   ├── API Key (nma_*) → يمرر ويحقن x-api-key
   │   ├── ICE Admin (/ice/*) → فحص ice_session cookie
   │   └── JWT → فك التوكن بـ jose.jwtVerify
   ▼
Route Handler (withRoute HOF)
   │
   ├── resolveTenant(req) — يحدد القاعدة
   ├── checkRateLimit() — sliding window
   ├── getUserFromRequest() — JWT verify
   ├── Role Guard — إذا roles مُحددة
   ├── getPrisma(req) — عميل معزول
   ├── handler(ctx) — الكود الفعلي
   └── Metrics + Tracing
   ▼
Prisma Client (per tenant)
   │
   ├── Soft Delete Middleware
   ├── Audit Middleware
   └── RLS Extension (للـ Legacy فقط)
   ▼
PostgreSQL DB
```

### المسارات العامة في `middleware.ts` (سطر 19-52):
```ts
PUBLIC_ROUTES = [
    '/api/auth/login', '/api/auth/register', '/api/auth/refresh',
    '/api/auth/logout', '/api/auth/mfa/verify', '/api/auth/sso-redirect',
    '/api/auth/sso', '/api/auth/auto-login', '/api/auth/find-tenant-by-email',
    '/api/auth/login-by-email', '/api/auth/sync',
    '/api/health', '/api/sys/health',
    '/api/b2b/auth/login', '/api/b2b/auth/register',
    '/api/zatca/callback', '/api/webhook', '/api/webhooks/events',
    '/api/public', '/api/pos/session/open',
    '/api/docs', '/api/metrics',
    // ── Master Panel (2026-05-14 جديد) ──
    '/api/master-panel/auth',
    '/api/master-panel-data',
    '/api/master-panel/servers',
    '/api/master-panel/licenses',
    // ── Tenant ──
    '/api/tenant/provision', '/api/tenant/check-status',
    '/api/tenant/status', '/api/translate',
]

DISABLED_ROUTES = [
    '/api/system/reset', '/api/check-env'  // → 410 Gone
]
```

---

## 🔒 نظام العزل الهجين — Phase 2 Active

> **⚠️ تغيير حرج في 2026-05-14:** انتقل النظام فعلياً من Phase 1 (RLS فقط) إلى Phase 2 (Physical DB per Tenant).

### الفرق بين Legacy و Phase 2:

| المعيار | Legacy (`n11`, `default`) | Phase 2 (الباقي) |
|---|---|---|
| **آلية العزل** | RLS داخل قاعدة واحدة | قاعدة بيانات مستقلة |
| **DB URL** | `DATABASE_URL` كما هو | `{tenant}_db` (بدل اسم القاعدة) |
| **Pool Key** | `WRITE_{DATABASE_URL}` | `WRITE_{tenant}_db_url` |
| **tenantId Injected** | `tenantId={tenant}` | `tenantId='default'` (لأن العزل فيزيائي) |
| **مثال** | `aljassim` (إذا n11) → `SELECT WHERE tenant_id='n11'` | `aljassim` → يتصل بـ `aljassim_db` |

### الكود الفعلي (`prisma.ts` سطر 39-81):
```ts
export function getDbUrl(tenant: string, isRead = false): string {
    const base = process.env.DATABASE_URL || '';
    
    // Desktop mode → ignore tenant
    if (process.env.DESKTOP_MODE === 'true') return base;
    
    // Legacy tenants → master DB with RLS
    const legacyTenants = ['n11', 'default'];
    if (legacyTenants.includes(tenant)) return base;
    
    // Phase 2: Physical DB per Tenant
    return base.replace(/\/([^/?]+)(\?|$)/, `/${tenant}_db$1`);
}
```

### تأمين Pool (`prisma.ts` سطر 127-154):
```ts
// قبل (مشكلة أمان):
// const poolKey = isRead ? 'SHARED_DB_INSTANCE_READ' : 'SHARED_DB_INSTANCE';
// ↑ كل المستأجرين يستخدمون نفس الـ Client → تسريب بيانات!

// بعد التصحيح:
const dbUrl = getDbUrl(tenant, isRead);
const poolKey = isRead ? `READ_${dbUrl}` : `WRITE_${dbUrl}`;
// ↑ كل قاعدة لها Client مستقل
```

---

## 🛡 الـ Middleware الثنائي

النظام يحتوي على Middleware في موقعين (يعملان معاً):

### 1. Next.js Edge Middleware (`middleware.ts` — جذر المشروع):
- يعمل في Edge Runtime (لا يدعم Node APIs)
- يستخدم `jose` للـ JWT
- مسؤول عن: subdomain extraction, JWT verification, API key check, public routes

### 2. Clerk Middleware (`src/proxy.ts` — يبدو غير مفعّل حالياً):
- يستخدم `clerkMiddleware` من `@clerk/nextjs`
- يحدد المسارات العامة للـ Clerk:
  ```ts
  PublicRoutes = ['/', '/sign-in', '/sign-up', '/sso-callback', 
                  '/api/ice', '/api/master-panel/*', 
                  '/api/tenant/provision', ...]
  ```
- يبدو أنه احتياطي أو للاندماج المستقبلي مع Clerk

---

## 🚀 دورة النشر (Deployment)

**السيرفر:** `46.4.188.170` (Hetzner VPS, German DC)
**SSH:** root / `_ee4SWbxLVfH9b` (في `provision/route.ts` كـ default — يفضّل ENV)
**Master App Path:** `/www/wwwroot/namainvist.com`

### خدمات PM2:
| اسم PM2 | الوظيفة |
|---|---|
| `main-site` | الموقع الرئيسي |
| `n1-main` | نسخة n1 (Legacy) |
| `saas-app` | تطبيق SaaS |

### أوامر النشر (من `deploy.js`):
```bash
# نشر كامل (file + build + restart)
node deploy.js src/lib/prisma.ts --build

# نشر سريع (file + restart فقط، لـ API/lib changes)
node deploy.js --files-only src/app/api/x/route.ts

# إعادة تشغيل فقط
node deploy.js --restart-only

# تحديث Schema (لكل المستأجرين أو واحد)
node deploy.js --db-push
```

### قواعد متى Build ومتى Restart:
- **يتطلب Build:** `src/app/*page.*`, `src/components/`, `next.config.ts`
- **Restart فقط:** `src/app/api/`, `src/lib/`
- **القاعدة الذهبية:** لا تمسح `.next` أبداً — يُبنى فوقه

### حماية إصدار Prisma:
في `provision/route.ts` سطر 84، يستخدم `npx prisma@5.22.0` صراحة (وليس `npx prisma`) لمنع تباين الإصدارات بين Master و Tenant.

---

## 🌐 الكشف عن نوع البيئة

| البيئة | الدليل في الكود |
|---|---|
| **Web SaaS** | الافتراضي |
| **Desktop (Electron)** | `process.env.DESKTOP_MODE === 'true'` أو `NEXT_PUBLIC_IS_DESKTOP === '1'` |
| **Development** | `process.env.NODE_ENV === 'development'` |
| **ELECTRON_BUILD** | `process.env.ELECTRON_BUILD === '1'` |

### في `next.config.ts`:
- `distDir`: `.next` (Web) أو `.next-electron` (Electron)
- `NEXT_PUBLIC_APP_VERSION`: من `package.json`
- Webpack alias: `ssh2`, `nodemailer`, `bcryptjs` → `false` على Client

---

## 📡 الـ Observability

### Prometheus Metrics (`src/lib/instrumentation/metrics.ts`):
| المقياس | النوع | الموسوم |
|---|---|---|
| `http_requests_total` | Counter | method, status, route |
| `http_request_duration_seconds` | Histogram | method, route (buckets: 0.01-5s) |
| `journal_entries_posted_total` | Counter | tenant, type |
| `webhook_deliveries_total` | Counter | event, status |
| `llm_tokens_consumed_total` | Counter | model, operation |
| `api_key_requests_total` | Counter | key_id, tenant |
| `approval_requests_total` | Counter | status, document_type |
| `active_webhook_subscriptions` | Gauge | tenant |
| `nodejs_heap_used_bytes` | Gauge | - |
| `process_uptime_seconds` | Gauge | - |

### الـ Endpoint:
- `GET /api/metrics` → Prometheus text format 0.0.4

### Sentry:
- مفعّل عبر `@sentry/nextjs`
- `tunnelRoute: "/monitoring"` (لتجاوز ad-blockers)
- Org: `nama-invest`, Project: `namaweb`

### Logger:
- Pino-style structured JSON
- Levels: debug(10), info(20), warn(30), error(40), fatal(50)
- متحكم عبر `LOG_LEVEL` env

---

## 🎯 خلاصة للـ AI

عند العمل على هذا المشروع تذكّر:
1. **الـ Multi-Tenancy نشط فيزيائياً** — لا تفترض RLS فقط
2. **Pool Key لكل URL** — لا تشارك Clients بين المستأجرين
3. **3 طبقات Middleware** — Edge → withRoute → Prisma middleware
4. **Master Owner من ENV** — `ICE_OWNER_EMAIL` / `MASTER_OWNER_EMAIL` / `MASTER_ADMIN_EMAIL`
5. **Prisma 5.22.0 مُثبت** — لا تستخدم `prisma` بدون إصدار في scripts
