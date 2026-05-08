# 🔐 تقرير أمان البنية التحتية — Infrastructure Security Report

> **التاريخ:** 2026-05-08
> **السيرفر:** 46.4.188.170 (Hetzner VPS)

---

## الإجراءات المتخذة

### 1. Ghost PostgreSQL
- **المشكلة:** PostgreSQL 16 يعمل على port 5433 بجانب PostgreSQL 17 الرئيسي (5432)
- **الإجراء:** `pg_ctlcluster 16 main stop` + `systemctl disable postgresql@16-main`
- **التحقق:** فقط port 5432 يستمع

### 2. Clerk Keys Rotation
- تم تغيير من `pk_test_*` / `sk_test_*` إلى `pk_live_*` / `sk_live_*`
- تم التحديث على:
  - `/www/wwwroot/namainvist.com/.env`
  - `/www/wwwroot/n1.namainvist.com/.env`
  - `/www/wwwroot/n11.namainvist.com/.env`
  - محلياً: `.env`

### 3. CRON_SECRET
- **القيمة:** `00eff330a6ef76c705d0854c1be29af07d5ecdc987e2214f73bd827bcc351390`
- تم إضافته لكل الـ `.env` files على السيرفر ومحلياً
- يُستخدم في `middleware.ts` لحماية `/api/cron/*` routes

### 4. النسخ الاحتياطي
- **السكريبت:** `/usr/local/bin/namasoft-backup.sh`
- **الكرون:** `/etc/cron.d/namasoft-backup`
- **المسار:** `/var/backups/namasoft/`
- **الاحتفاظ:** 7 أيام
- **الجدول:** يومياً 2AM + 2PM

### 5. Routes المعطّلة
```
/api/system/reset  → HTTP 410 Gone (كل HTTP methods)
/api/check-env     → HTTP 410 Gone (GET + POST)
```
محجوبة على مستويين:
1. `middleware.ts` — يرفض الطلب قبل وصوله
2. `route.ts` — يرد بـ 410 إذا وصل بأي طريقة

### 6. Sentry
- `tracesSampleRate` تم تخفيضه من 1.0 إلى 0.1 في production
- يوفّر ~90% من تكلفة Sentry

---

## المفاتيح والبيانات الحساسة

> ⚠️ هذا الملف للمراجعة الداخلية فقط. لا يُرفع على Git.

| المفتاح | المكان | ملاحظات |
|---------|--------|---------|
| CLERK_PUBLISHABLE_KEY | `.env` (gitignored) | `pk_live_*` |
| CLERK_SECRET_KEY | `.env` (gitignored) | `sk_live_*` |
| CRON_SECRET | `.env` (gitignored) | 64-char hex |
| DATABASE_URL | `.env` (gitignored) | postgres://... |
| JWT_SECRET | `.env` (gitignored) | production secret |

---

## الملفات المُعدّلة

| الملف | التغيير |
|-------|--------|
| `middleware.ts` | JWT auth + cron protection + disabled routes |
| `sentry.server.config.ts` | sampling 0.1 in prod |
| `sentry.client.config.ts` | sampling 0.1 in prod |
| `sentry.edge.config.ts` | sampling 0.1 in prod |
| `src/app/api/system/reset/route.ts` | HTTP 410 Gone |
| `src/app/api/check-env/route.ts` | HTTP 410 Gone |
| `src/app/api/health/route.ts` | hardened + memory/uptime |
| `.github/dependabot.yml` | weekly npm updates |
| `.github/CODEOWNERS` | critical path ownership |
