# 🧠 PROJECT BRAIN — Nama Invest ERP

> **آخر تحديث:** 2026-05-14  
> **الغرض:** مرجع واحد شامل لكل سيناريوهات المشروع — يمنع اللخبطة في الـ deploy والبيئات.

---

## 📐 البنية التحتية

### السيرفر الإنتاجي (Hetzner VPS)

| المفتاح | القيمة |
|---------|--------|
| **IP** | `46.4.188.170` |
| **SSH** | `root@46.4.188.170` |
| **Password** | `_ee4SWbxLVfH9b` |
| **App Path** | `/www/wwwroot/namainvist.com` |
| **Node** | v24.x |
| **PM2** | Process Manager |
| **DB** | PostgreSQL @ localhost:5432 |
| **App Login** | admin / O_O772040030 |

### المنافذ والخدمات

| Node | Domain | PM2 Name | Port | Database |
|------|--------|----------|------|----------|
| **Main Site** | `namainvist.com` | `main-site` | 3000 | n11_db (master) |
| **N1 Tenant** | `n1.namainvist.com` | `n1-main` | 3001 | n1_db |
| **N11 SaaS** | `n11.namainvist.com` | `saas-app` | 3500 | n11_db |
| **Staging** | `dev.namainvist.com` | `staging` | 3600 | n11_db |

> ⚠️ **تحذير PostgreSQL:** يشغّل مثلين: **Port 5432** (الإنتاجي الحقيقي) و **5433** (وهمي). **دائماً** استخدم `-h localhost -p 5432`.

---

## ⚠️ فروقات `.env` — المحلي مقابل الإنتاج

> ⛔ **لا ترفع `.env` المحلي للخادم أبداً!** `.env` المحلي فيه `DESKTOP_MODE=true` و `DATABASE_URL` مختلف. الرفع يُعطّل الموقع بالكامل.

| المتغير | المحلي (Local) | الإنتاج (Production) | ملاحظة |
|---------|---------------|---------------------|--------|
| `DATABASE_URL` | `postgres:root@localhost/namasoft` | `postgres@localhost:5432/n11_db` | ⛔ مختلف تماماً |
| `DESKTOP_MODE` | `true` | **غير موجود** (= false) | ⛔ المحلي = Desktop, الإنتاج = SaaS |
| `MASTER_DB_URL` | `localhost/namasoft` | `localhost:5432/n11_db` | ⛔ مختلف |
| `JWT_SECRET` | غير موجود | موجود (64 hex) | ⚠️ الإنتاج يحتاجه |
| `SSO_SECRET` | `9f0c46...` | **يجب أن يكون نفسه** | ✅ متطابق |
| `CLERK_*` | Live keys | نفسها | ✅ متطابق |
| `CRON_SECRET` | `00eff3...` | يجب أن يتطابق | ✅ |
| `PROVISION_SSH_*` | غير مُعيّن | مُعيّن على الإنتاج | فقط SaaS |

### متى يجوز رفع `.env`؟
- **فقط** عند إضافة متغير جديد (مثل `SSO_SECRET`)
- يجب **التأكد** أن القيم الإنتاجية الأخرى لن تتأثر
- **الأفضل:** SSH مباشرة وأضف السطر يدوياً بدلاً من رفع الملف كاملاً

---

## 🔐 خريطة ملفات المصادقة (SSO/Auth)

### التدفق الكامل

```
┌─────────────────────────────────────────────────────────────────┐
│                    تدفق المصادقة الكامل                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Main Domain: namainvist.com]                                  │
│  ┌──────────┐    ┌────────────┐    ┌──────────────────┐        │
│  │  /login   │───►│ Clerk SignIn│───►│  /sso-callback   │       │
│  │ page.tsx  │    │ (Google)   │    │  page.tsx         │       │
│  └──────────┘    └────────────┘    └────────┬─────────┘        │
│                                              │                  │
│                                    useUser().id                 │
│                                              ▼                  │
│                              ┌──────────────────────┐           │
│                              │/api/auth/sso-redirect │           │
│                              │     route.ts          │           │
│                              └──────────┬───────────┘           │
│                                         │                       │
│                    ┌────────────────────┼────────────────┐      │
│                    ▼                    ▼                ▼      │
│              [Admin?]           [Has Tenant?]     [New User?]  │
│            /master-panel    subdomain/auto-login  /company-info │
│                                                                 │
│  [Subdomain: n1.namainvist.com]                                │
│  ┌──────────┐                                                   │
│  │  /login   │──► Username/Password ──► /api/auth/login ──► JWT│
│  │ page.tsx  │                                                  │
│  └──────────┘                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### الملفات الحرجة

| الملف | الدور | آخر تعديل |
|-------|------|-----------|
| `src/app/login/page.tsx` | نموذج تسجيل الدخول (Clerk + Username/Password) | 2026-05-14 |
| `src/app/sso-callback/page.tsx` | وسيط بين Clerk و sso-redirect | 2026-05-14 |
| `src/app/api/auth/sso-redirect/route.ts` | يوزّع المستخدمين بعد Clerk login | 2026-05-14 |
| `src/app/api/auth/auto-login/route.ts` | دخول تلقائي بـ SSO token على subdomain | 2026-05-14 |
| `src/app/api/auth/login/route.ts` | تسجيل دخول Username/Password (JWT) | — |
| `src/app/auth/routing/page.tsx` | توجيه بعد التحقق من حالة الـ tenant | 2026-05-14 |
| `src/components/GlobalAuthGuard.tsx` | حارس مصادقة عام — يمرر الـ public routes | 2026-05-14 |
| `src/app/layout.tsx` | ClerkProvider + fallback URLs | 2026-05-14 |
| `middleware.ts` | حماية API routes بـ JWT/API Key | — |

---

## 🚀 قوانين الـ Deploy

### الأمر الصحيح حسب نوع التغيير

| نوع الملف | المثال | الأمر | الوقت |
|-----------|--------|-------|-------|
| API routes | `src/app/api/**` | `node deploy.js --files-only [files]` | ~5 ثواني |
| مكتبات | `src/lib/**` | `node deploy.js --files-only [files]` | ~5 ثواني |
| ترجمات | `src/locales/**` | `node deploy.js --files-only [files]` | ~5 ثواني |
| صفحات UI | `page.tsx`, `layout.tsx` | `node deploy.js --build [files]` | ~2 دقيقة |
| Components | `src/components/**` | `node deploy.js --build [files]` | ~2 دقيقة |
| CSS | `globals.css` | `node deploy.js --build` | ~2 دقيقة |
| Config | `next.config.ts`, `middleware.ts` | `node deploy.js --build` | ~2 دقيقة |
| `.env` فقط | `.env` | أضف يدوياً عبر SSH | ~1 دقيقة |
| إعادة تشغيل | — | `node deploy.js --restart-only` | ~1 ثانية |

> ⚠️ **لا تحذف `.next` أبداً قبل الـ build!** الـ build يكتب فوقها بأمان.

### أمثلة:

```powershell
# API فقط (ثواني)
node deploy.js --files-only src/app/api/auth/sso-redirect/route.ts src/lib/auth.ts

# UI + API مع build (دقيقتين)
node deploy.js --build src/app/sso-callback/page.tsx src/app/layout.tsx src/app/api/auth/sso-redirect/route.ts

# إعادة تشغيل فقط
node deploy.js --restart-only

# Schema update (كل tenant)
node deploy.js --db-push
```

---

## 🛡️ قوانين الأمان (لا يجوز خرقها)

| # | القانون | السبب |
|---|---------|-------|
| 1 | **لا hardcoded secrets** | أي secret يجب أن يكون في `.env` فقط |
| 2 | **`SSO_SECRET` يجب أن يتطابق** بين main site وكل subdomains | Token signing |
| 3 | **Cookies يجب أن تحتوي** `SameSite=Lax; Secure` | منع CSRF |
| 4 | **`crypto.randomUUID()`** بدلاً من `Math.random()` | أمان التوليد |
| 5 | **Connection pools = Singleton** | منع تسريب الاتصالات |
| 6 | **Loop Detection** في كل redirect chain | منع حلقات لا نهائية |
| 7 | **JWT_SECRET** ≥ 64 hex chars | قوة تشفيرية |

---

## 📝 سجل الإصلاحات (Change Log)

### 2026-05-14 — SSO Authentication Hardening (14 إصلاح)

| # | الخطورة | الوصف | الملف |
|---|---------|-------|-------|
| 1 | 🔴 | Redirect Loop → Loop Detection cookie | `sso-redirect/route.ts` |
| 2 | 🔴 | Hardcoded SSO_SECRET → runtime validation | `sso-redirect/route.ts` |
| 3 | 🔴 | Connection Pool per-request → Singleton | `sso-redirect/route.ts` |
| 4 | 🔴 | Same SSO_SECRET bug in auto-login | `auto-login/route.ts` |
| 5 | 🟡 | sso-callback re-render → useRef + timeout | `sso-callback/page.tsx` |
| 6 | 🟡 | `forceRedirectUrl` → `fallbackRedirectUrl` | `login/page.tsx` |
| 7 | 🟡 | Clerk fallback URLs → `/sso-callback` | `layout.tsx` + `.env` |
| 8 | 🟡 | GlobalAuthGuard missing SSO routes | `GlobalAuthGuard.tsx` |
| 9 | 🟡 | Cookie without Secure/SameSite | `login/page.tsx` |
| 10 | 🟡 | UUID via Math.random() → crypto.randomUUID() | `login/page.tsx` |
| 11 | 🟢 | pool.end() per-request removed | `sso-redirect/route.ts` |
| 12 | 🟢 | Hardcoded Arabic → i18n fallback | `login/page.tsx` |
| 13 | 🟢 | Infinite reload() → retry counter | `auth/routing/page.tsx` |
| 14 | 🟢 | Variable shadowing `e` → `addr` | `sso-redirect/route.ts` |

---

## 🔧 أخطاء معروفة ومحلولة

### ❌ SSO Redirect Loop (محلول 2026-05-14)
**العَرَض:** المتصفح يعلق على `sso-redirect` ← HTTP 429  
**السبب:** `forceRedirectUrl="/sso-callback"` + Clerk لم يُكمل تحميل الـ session  
**الحل:** `fallbackRedirectUrl` + Loop Detection cookie (3 محاولات max)

### ❌ `.env` المحلي يُرفع للخادم (تحذير)
**العَرَض:** الموقع يتعطل — `DESKTOP_MODE=true` يُعطّل Clerk  
**الحل:** لا ترفع `.env` كاملاً — أضف المتغير الجديد يدوياً عبر SSH

---

## 📋 Checklist قبل كل Deploy

- [ ] هل التغييرات تشمل `.env`؟ → ⚠️ لا ترفع الملف كاملاً — أضف يدوياً عبر SSH
- [ ] هل التغييرات تشمل ملفات UI؟ → استخدم `--build`
- [ ] هل التغييرات API فقط؟ → استخدم `--files-only`
- [ ] هل غيّرت `middleware.ts`? → يحتاج `--build`
- [ ] هل أضفت متغير بيئة جديد؟ → أضفه على الخادم يدوياً عبر SSH
- [ ] هل غيّرت `schema.prisma`? → يحتاج `db push` لكل tenant

---

## 🆕 إضافة Tenant جديد

```bash
# 1. إنشاء قاعدة البيانات
sudo -u postgres psql -h localhost -p 5432 -c "CREATE USER newclient_db WITH PASSWORD 'pass123';"
sudo -u postgres psql -h localhost -p 5432 -c "CREATE DATABASE newclient_db OWNER newclient_db;"

# 2. رفع الـ Schema
cd /www/wwwroot/namainvist.com
DATABASE_URL="postgresql://postgres@localhost:5432/newclient_db" npx prisma db push

# 3. صلاحيات
sudo -u postgres psql -h localhost -p 5432 -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO newclient_db;" newclient_db

# 4. إضافة لـ ecosystem.config.js + PM2 restart
# 5. إعداد Nginx reverse proxy
```
