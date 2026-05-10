# نما إنفست ERP — نظام المحاسبة وإدارة الأعمال
# NamaInvest ERP — Production-Ready Business Management System

[![CI/CD](https://github.com/namasoft/namasoft-erp/actions/workflows/ci.yml/badge.svg)](https://github.com/namasoft/namasoft-erp/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black?logo=nextdotjs)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io/)
[![ZATCA Phase 2](https://img.shields.io/badge/ZATCA-Phase%202-green)](https://zatca.gov.sa/)

نظام ERP سعودي متكامل مبني بـ **Next.js 15** يشمل أكثر من **30 وحدة** لإدارة الأعمال: محاسبة، مخزون، رواتب، مبيعات، مشتريات، ZATCA، وأكثر.

---

## 🏗️ المتطلبات | Requirements

| المكون | الإصدار |
|--------|---------|
| Node.js | **20+** (LTS) |
| PostgreSQL | **16+** (pgvector extension) |
| npm | 9+ |
| OpenSSL | (لشهادات ZATCA) |

---

## 🚀 التثبيت السريع | Quick Start

```bash
# 1. استنساخ المشروع
git clone https://github.com/namasoft/namasoft-erp.git
cd namasoft-erp

# 2. تثبيت المكتبات
npm ci

# 3. إعداد ملف البيئة
cp .env.example .env
# عدّل .env بمعلومات قاعدة البيانات والـ JWT_SECRET

# 4. إنشاء قاعدة البيانات
npm run db:migrate      # ترحيل الجداول (production)
# أو:
npm run db:push         # دفع مباشر (development)
npm run db:seed         # بيانات أساسية

# 5. تشغيل للتطوير
npm run dev             # http://localhost:3000

# 6. بناء الإنتاج
npm run build
npm start
```

---

## 📋 متغيرات البيئة | Environment Variables

انسخ `.env.example` وعدّله:

```bash
cp .env.example .env
```

**المتغيرات الإلزامية:**
| المتغير | الوصف |
|---------|-------|
| `DATABASE_URL` | رابط PostgreSQL |
| `JWT_SECRET` | مفتاح سري (32+ حرف) |
| `NEXTAUTH_SECRET` | مفتاح NextAuth |
| `NEXTAUTH_URL` | رابط التطبيق (`http://localhost:3000`) |

---

## 🗂️ هيكل المشروع | Project Structure

```
src/
├── app/
│   ├── api/           # API routes (300+ endpoints)
│   └── (dashboard)/   # Next.js App Router pages
├── lib/
│   ├── auto-journal.ts      # محرك القيود التلقائية
│   ├── api/with-route.ts    # HOF موحد للـ API
│   ├── logger.ts            # Structured logging (Pino)
│   ├── sentry.ts            # Error tracking
│   ├── rate-limit.ts        # Rate limiting
│   └── prisma.ts            # Multi-tenant Prisma client
├── services/          # Business logic engines
└── workers/           # Background jobs (BullMQ)

tests/
├── e2e/golden-paths/  # Playwright E2E (4 golden paths)
├── integration/       # Integration tests
├── unit/              # Unit tests per domain
└── *.test.ts          # Domain tests (19 files)
```

---

## 🧪 الاختبارات | Testing

```bash
npm test                # كل الاختبارات
npm run test:unit       # وحدات src/ فقط
npm run test:domain     # اختبارات /tests (GOSI, WPS, IFRS...)
npm run test:cov        # مع تقرير التغطية
npm run test:e2e        # E2E (يحتاج سيرفر شغال)
npm run typecheck       # TypeScript (0 errors)
npm run validate        # TSC + ESLint + Jest
```

**حالة الاختبارات:**
- ✅ **309 / 309** وحدة تجتاز
- ✅ **0** خطأ TypeScript
- ✅ **0** `console.log` في API routes
- ✅ **4** golden path E2E specs

---

## 🏭 الوحدات | Modules

| الوحدة | الحالة |
|--------|--------|
| 📊 المحاسبة العامة (GL) + SOCPA | ✅ |
| 🧾 المبيعات + فوتيرة ZATCA Phase 2 | ✅ |
| 🛒 المشتريات + 3-Way Match | ✅ |
| 📦 المخزون + تحويلات + FEFO | ✅ |
| 👥 الموارد البشرية + رواتب WPS | ✅ |
| 🏗️ الأصول الثابتة + IFRS 16 | ✅ |
| 🏭 التصنيع + Shop Floor | ✅ |
| 💳 المصارف + تسوية بنكية | ✅ |
| 📈 تقارير IFRS + تحليلات | ✅ |
| 🤖 AI Copilot (Gemini/Langchain) | ✅ |
| 📱 Telegram Bot | ✅ |
| 🌐 Salla / ZID Integration | ✅ |

---

## 🛠️ أوامر مفيدة | Useful Commands

```bash
# التطوير
npm run dev             # تشغيل التطوير
npm run db:studio       # واجهة قاعدة البيانات
npm run health          # فحص حالة السيرفر

# الصيانة
npm run typecheck       # فحص TypeScript
npm run validate        # فحص شامل
npm run clean           # تنظيف .next cache
npm run analyze         # تحليل حجم Bundle

# الإنتاج
npm run build           # بناء Next.js
npm start               # تشغيل الإنتاج
npm run db:migrate      # ترحيل قاعدة البيانات
```

---

## 🚢 النشر على السيرفر | Production Deployment

### 1. تثبيت المتطلبات (Ubuntu 22.04+)
```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs postgresql postgresql-contrib nginx

# pgvector extension
apt install -y postgresql-16-pgvector

# PM2
npm install -g pm2
```

### 2. إعداد PostgreSQL
```bash
sudo -u postgres psql <<EOF
CREATE USER namasoft WITH PASSWORD 'كلمة_سر_قوية_جداً';
CREATE DATABASE n1_db OWNER namasoft;
GRANT ALL PRIVILEGES ON DATABASE n1_db TO namasoft;
\c n1_db
CREATE EXTENSION IF NOT EXISTS vector;
EOF
```

### 3. نشر التطبيق
```bash
cd /www/wwwroot/namainvist.com
git clone <repo> .
cp .env.example .env   # عدّل المتغيرات
npm ci --production
npx prisma generate
npm run db:migrate
npm run build
pm2 start npm --name "namasoft" -- start
pm2 save && pm2 startup
```

### 4. Health Check
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"healthy","checks":{"database":"ok","memory":"ok"}}
```

### 5. Nginx Config
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔒 الأمان | Security

- ✅ JWT مشفر (HS256) لكل طلب
- ✅ Rate Limiting: DEFAULT(100/min), FINANCIAL(30/min), STRICT(10/min)
- ✅ Zod validation لكل POST/PUT/PATCH
- ✅ Multi-tenant عزل كامل بـ AsyncLocalStorage
- ✅ 9 Security headers + CSP
- ✅ PDPL compliance (مسح بيانات شخصية)
- ✅ Field Audit Trail لكل عملية مالية

---

## 📞 الدعم | Support

- 🌐 [namainvist.com](https://namainvist.com)
- 📱 Telegram Bot مضمّن للإشعارات والتقارير

---

## 🔐 بيانات الدخول الافتراضية

> ⚠️ **غيّر كلمة المرور فور التثبيت!**

- المستخدم: `admin`
- كلمة المرور: `admin`
