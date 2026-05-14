# 03 - المصادقة والصلاحيات (Auth & Permissions) — كامل

> مستخرج من: `auth.ts` (234 سطر), `middleware.ts` (206 سطر, محدث 2026-05-14), `with-route.ts` (211 سطر), `sso-redirect/route.ts` (287 سطر, محدث), `provision/route.ts` (477 سطر, محدث), `login/page.tsx` (581 سطر)

---

## 🔐 طبقات المصادقة (Authentication Layers)

### الطبقة 0: Cloudflare → Nginx → Next.js
- Cloudflare Turnstile (CAPTCHA) للنماذج الحساسة
- Nginx reverse proxy لـ HTTPS termination

### الطبقة 1: Edge Middleware (`middleware.ts`)
**النوع:** Edge Runtime (لا يدعم Node.js APIs)
**المكتبة:** `jose` (لأن `jsonwebtoken` لا يعمل في Edge)

**ترتيب الفحص:**
1. **مسار معطّل** (`DISABLED_ROUTES`) → `410 Gone`
2. **مسار Cron** (`/api/cron/*`) → فحص `x-cron-secret` header
3. **مسار عام** (`PUBLIC_ROUTES` — 36 مسار) → مرّر بدون مصادقة
4. **API Key** (نمط `nma_` + 40 hex) → مرّر ويُحقن `x-api-key`
5. **ICE Admin** (`/ice/*`) — يفحص `ice_session` cookie
6. **JWT** → `jose.jwtVerify()` ثم يحقن:
   - `x-user-id`, `x-user-role`, `x-tenant-id`, `x-username`, `x-auth-type`

### الطبقة 2: `withRoute` HOF (`src/lib/api/with-route.ts`)
**النوع:** Node.js Runtime  
**المكتبة:** `jsonwebtoken`

```typescript
export const GET = withRoute(async ({ req, prisma, auth, tenant, requestId }) => {
    return NextResponse.json(await prisma.product.findMany());
}, { rateLimit: 'DEFAULT', requireAuth: true, roles: ['admin'] });
```

**الإجراءات بالترتيب:**
1. `resolveTenant(req)` → تحديد القاعدة الصحيحة
2. `checkRateLimit()` → التحقق من حد المعدل
3. `getUserFromRequest()` → فك JWT → 401 إذا فشل
4. Role Guard → 403 إذا لم يكن الدور مطابقاً
5. `getPrisma(req)` → عميل DB معزول
6. تنفيذ handler داخل `currentRequestStore`
7. تسجيل Metrics + Tracing headers

### الطبقة 3: `withGuard` HOF (`auth.ts` — Legacy)
نسخة قديمة لا زالت مستخدمة في بعض المسارات:
```typescript
export const GET = withGuard(async (request, params, user) => {
    // user.tenantId, user.userId, user.role
});
```

### الطبقة 4: Clerk Middleware (`src/proxy.ts`)
- يعمل بشكل موازٍ (احتياطي مع `@clerk/nextjs`)
- يحدد مسارات Clerk العامة (sign-in/sign-up/sso-callback/master-panel)

---

## 🪪 هيكل JWT Token

من `auth.ts` سطر 28-36:
```typescript
interface JWTPayload {
    userId: number;         // معرف المستخدم (0 للـ owner)
    username: string;       // الاسم
    role: string;           // admin | owner | cashier | accountant | employee
    tenantId?: string;      // اسم المستأجر
    sessionToken?: string;  // لإلغاء الجلسة
}
```

**الإعدادات:**
- **المفتاح:** `process.env.JWT_SECRET` (fallback خطر: default)
- **الصلاحية:** 24 ساعة
- **التوقيع:** HS256 (HMAC-SHA256)

---

## 🔑 استخراج التوكن

من `auth.ts` سطر 85-92:
```
الأولوية:
1. Authorization: Bearer <token>     ← من Header
2. Cookie: token=<token>             ← من Cookie
```

في حالة `master_token` cookie إضافي → للوصول للـ master-panel فقط.

---

## 👑 Master Owner — منطق جديد (2026-05-14)

> **تغيير حرج:** سابقاً كان يبحث في جدول `users.email` لاكتشاف المالك، لكن العمود غير موجود في الـ schema الحالي. الآن يعتمد على متغيرات البيئة.

### الكود الجديد (`sso-redirect/route.ts` سطر 80-218):
```typescript
const MASTER_OWNER_EMAILS = [
    process.env.ICE_OWNER_EMAIL,
    process.env.MASTER_OWNER_EMAIL,
    process.env.MASTER_ADMIN_EMAIL,
].filter(Boolean).map(value => String(value).trim().toLowerCase());

// عند الـ SSO:
if (MASTER_OWNER_EMAILS.includes(email.toLowerCase())) {
    // owner → master-panel
    const jwt = generateToken({ userId: 0, username: email, role: 'owner' });
    response.cookies.set('token', jwt, {...});
    response.cookies.set('master_token', 'SECURE_MASTER_VALIDATED', {
        path: '/', maxAge: 60*60*24, sameSite: 'lax', httpOnly: true
    });
    return NextResponse.redirect('/master-panel');
}
```

### كيف يصبح المستخدم مالكاً للمنصة:
1. تضيف بريده في إحدى متغيرات البيئة: `ICE_OWNER_EMAIL` أو `MASTER_OWNER_EMAIL` أو `MASTER_ADMIN_EMAIL`
2. يقوم بالدخول عبر Clerk SSO (بنفس البريد)
3. النظام يحوله تلقائياً إلى `/master-panel`

---

## 👥 نظام الصلاحيات الـ Granular

من `auth.ts` سطر 128-152:

### أولوية التحقق:
1. **إذا `role === 'admin'` أو `role === 'owner'`** → دخول كامل
2. **إذا `user.permissions.length > 0`** → يتحقق من وجود `module` المطلوب
3. **بدون صلاحيات ولا دور مميز** → مرفوض

### نموذج UserPermission:
```prisma
model UserPermission {
    id        Int      @id
    userId    Int
    module    String   // 'sales' / 'purchases' / 'accounting' / ...
    canView   Boolean
    canAdd    Boolean
    canEdit   Boolean
    canDelete Boolean
    canPrint  Boolean
}
```

### الكشف عن المدير القديم:
```typescript
async function isLegacyAdmin(userId: number): Promise<boolean>
// يرجع true إذا role='admin' لكن permissions.length === 0
// لاكتشاف حسابات قبل نظام الصلاحيات الدقيق
```

---

## 🛡 ICE Super Admin Guard

من `middleware.ts` سطر 106-122:
- مسارات `/ice/*` (ما عدا `/ice/login`) محمية بـ Cookie `ice_session`
- التحقق عبر `jose.jwtVerify()` بنفس `JWT_SECRET`
- إذا فشل → يُعاد التوجيه إلى `/ice/login`

---

## 🎫 API Key Authentication

من `middleware.ts` سطر 61-62:
- **النمط:** `nma_` + 40 حرف hex (مثال: `nma_a1b2c3d4...`)
- **التحقق في Middleware:** فقط Pattern Match
- **التحقق الفعلي:** SHA-256 lookup في جدول `ApiKey`
- يُحقن كـ `x-api-key` header

### نموذج ApiKey:
```prisma
model ApiKey {
    keyHash    String   // SHA-256 hash of the key
    scopes     Json     // ['read:sales', 'write:invoices', ...]
    expiresAt  DateTime?
    lastUsedAt DateTime?
    isActive   Boolean
}
```

---

## 🔐 MFA (Multi-Factor Authentication)

### نماذج الـ Schema:
```prisma
MfaPolicy {
    requireForRoles    Json  // ['admin', 'accountant']
    requireForActions  Json  // ['post-je', 'modify-invoice']
    allowedMethods     Json  // ['totp', 'sms', 'email']
    enforceFromDate    DateTime
    gracePeriodDays    Int
}
MfaAttempt {
    userId, success, method, ipAddress, userAgent,
    countryCode, city, failureReason, attemptedAt
}
TrustedDevice {
    userId, deviceFingerprint, deviceName, browser, os,
    ipAddress, trustedUntil, revokedAt
}
UserBackupCode {
    userId, codeHash, codeHint, usedAt, generatedBatchId
}
MfaRecoveryRequest {
    userId, reason, status, reviewedByUserId, newSecretGenerated
}
MfaUsedToken {
    userId, tokenHash, usedAt, expiresAt  // منع replay
}
```

### المسارات:
- `POST /api/auth/mfa/setup` → توليد TOTP secret + QR
- `POST /api/auth/mfa/verify` → التحقق من الكود
- `POST /api/auth/mfa/backup-codes/generate` → 10 كود احتياطي
- `POST /api/auth/mfa/recovery` → طلب استعادة

### مكتبات:
- `otplib` ^13.4.0 — TOTP
- `speakeasy` ^2.0.0 — TOTP + verification
- `qrcode` ^1.5.4 — لتوليد QR

---

## 🔄 تدفق SSO الكامل (Clerk → Tenant)

من `provision/route.ts` (477 سطر) و `sso-redirect/route.ts`:

### السيناريو 1: مستخدم جديد (Provisioning)
```
1. المستخدم يفتح namainvist.com
2. ينقر "ابدأ مجاناً" → Clerk Sign-up
3. Clerk يرسله إلى /sso-callback
4. يملأ /onboarding (اسم الشركة، الرقم الضريبي، ...)
5. POST /api/tenant/provision:
   a. ترجمة اسم الشركة عربي→إنجليزي (Google Translate API)
   b. توليد subdomain فريد عبر SSH:
      - يبدأ بالاسم الإنجليزي مترجماً (مثلاً "aljassim")
      - إذا موجود → يضيف رقم (aljassim2, aljassim3, ...)
      - حد أقصى 99 محاولة
   c. إنشاء DB عبر SSH:
      - SSH إلى 46.4.188.170
      - CREATE DATABASE {subdomain}_db
   d. تطبيق Schema (Prisma 5.22.0 صراحة):
      cd /www/wwwroot/namainvist.com
      DATABASE_URL=... npx prisma@5.22.0 db push 
        --schema=prisma/schema.prisma --accept-data-loss
   e. زرع البيانات الأولية (داخل tenant DB):
      - 21+ مفتاح settings (company_name, tax_number, zatca_crn, ...)
      - مستخدم admin (password: admin7773)
      - شركة + فرع + مستودع + عميل نقدي + وحدات (حبة/كرتون)
   f. تسجيل في Master DB (n11_db):
      TenantAccount.upsert({
          userEmail, clerkUserId, subdomain, orgName,
          vatNumber, status: 'pending', plan: 'free'
      })
   g. توليد SSO Token:
      HMAC-SHA256(subdomain + userId + timestamp, JWT_SECRET)
      صالح 15 دقيقة فقط
   h. إرجاع: { subdomain, ssoToken }
6. الـ Frontend يُعيد التوجيه إلى:
   https://{subdomain}.namainvist.com/sso-callback?token={ssoToken}
7. الـ Middleware يقرأ الـ host ويحقن x-tenant
8. /api/auth/sso يتحقق من الـ ssoToken ويُنشئ JWT للمستخدم
```

### السيناريو 2: مستخدم موجود (Sign-in)
```
1. المستخدم يفتح namainvist.com
2. ينقر "تسجيل الدخول" → Clerk Sign-in
3. POST /api/auth/sso-redirect:
   a. يستخرج البريد من Clerk session
   b. هل البريد في MASTER_OWNER_EMAILS؟
      → نعم: master-panel
      → لا: متابعة
   c. يبحث في Master DB:
      TenantAccount WHERE userEmail = email AND status != 'suspended'
   d. إذا موجود → يُعيد التوجيه إلى {subdomain}.namainvist.com
   e. إذا غير موجود → /sign-up أو /no-tenant
4. حماية من Loop:
   - max 3 محاولات في cookie 'sso_redirect_attempts'
   - بعدها → /error/redirect-loop
```

### السيناريو 3: تسجيل دخول مباشر (Username + Password)
```
1. المستخدم يفتح {subdomain}.namainvist.com/login
2. يدخل username + password
3. POST /api/auth/login:
   a. يبحث عن User بـ username
   b. bcrypt.compare(password, user.passwordHash)
   c. يتحقق من MFA إذا مفعّل:
      - يرجع { requiresMfa: true, mfaSessionToken }
      - المستخدم يدخل TOTP code
      - POST /api/auth/mfa/verify
   d. يولد JWT
   e. يضع token في Cookie:
      response.cookies.set('token', jwt, {
          httpOnly: true, sameSite: 'lax', secure: true
      });
4. الـ Frontend يعيد التوجيه إلى /dashboard
```

---

## 📱 صفحة الدخول الموحدة (`/login`)

من `src/app/login/page.tsx` (581 سطر):

**تدعم 3 طرق دخول في صفحة واحدة:**

1. **Credentials (Username + Password)**
   - للمستخدمين العاديين داخل الـ tenant
   - يدعم MFA

2. **Clerk SSO**
   - للمستخدمين الذين سجلوا عبر Clerk
   - يفتح Clerk Sign-in popup

3. **Desktop Activation**
   - للنسخة المكتبية (Electron)
   - يستخدم Hardware ID + License Key

### المنطق:
```typescript
const detectionMode = () => {
    if (process.env.NEXT_PUBLIC_IS_DESKTOP === '1') return 'desktop';
    if (subdomain === 'namainvist') return 'sso';  // الموقع الرئيسي
    return 'credentials';  // tenant subdomain
};
```

---

## 🚨 أوامر الإدارة

### إنشاء مستخدم admin مباشر:
```typescript
const passwordHash = await bcrypt.hash('admin7773', 10);
await prisma.user.create({
    data: {
        username: 'admin',
        passwordHash,
        role: 'admin',
        branchId: 1,
    }
});
```

### إعادة تعيين كلمة سر:
```typescript
await prisma.user.update({
    where: { username },
    data: { passwordHash: await bcrypt.hash(newPass, 10) }
});
```

### إلغاء جلسة (Session Token):
```typescript
await prisma.user.update({
    where: { id },
    data: { sessionToken: null }
});
// الـ JWT الحالي سيُرفض في الفحص التالي
```

---

## 🔒 أمان كلمة السر

- **خوارزمية:** bcrypt
- **Cost:** 10 (في كل مكان)
- **مكتبات:** `bcryptjs` (للسيرفر) + `bcrypt` (Native للأداء)
- **كلمة السر الافتراضية للـ admin:** `admin7773` (يجب تغييرها)

---

## 🌐 الحقول المحقونة في الـ Headers

من Edge Middleware:
```
x-tenant-subdomain: aljassim
x-tenant:          aljassim
x-tenant-id:       aljassim
x-user-id:         42
x-user-role:       admin
x-username:        ahmad
x-auth-type:       jwt | api-key
x-api-key:         nma_...   (إذا API key)
x-request-id:      uuid
```

من withRoute في الـ response:
```
X-Request-Id: uuid
X-Response-Time: 45ms
Retry-After: 60 (إذا 429)
```

---

## 🛑 قواعد أمنية صارمة

1. ❌ **لا تُخزّن كلمات سر في الكود** — استخدم ENV vars فقط
2. ❌ **لا تستخدم default JWT_SECRET في الإنتاج**
3. ❌ **لا تُمرّر User Input بدون Zod validation**
4. ❌ **لا تستخدم raw SQL** — Prisma فقط (مع `$queryRaw` كاستثناء)
5. ✅ **كل API route محمي بـ `withRoute`**
6. ✅ **MFA إجباري للأدوار الحرجة** (admin, accountant)
7. ✅ **Rate Limit مناسب** لكل نوع
8. ✅ **HTTPS فقط** في الإنتاج
9. ✅ **Audit Log لكل تعديل حساس**
10. ✅ **bcrypt cost ≥ 10** دائماً

---

## 🎭 الأدوار المتاحة (Roles)

| الدور | الوصف | الصلاحيات |
|---|---|---|
| `owner` | مالك المنصة (NamaInvest) | master-panel + كل شيء |
| `admin` | مدير الـ tenant | كل شيء داخل الـ tenant |
| `accountant` | محاسب | المحاسبة + التقارير |
| `cashier` | كاشير | POS + المبيعات |
| `employee` | موظف عادي | حسب UserPermission |
| `manager` | مدير قسم | حسب UserPermission (admin-lite) |
| `viewer` | للقراءة فقط | حسب UserPermission (view only) |
