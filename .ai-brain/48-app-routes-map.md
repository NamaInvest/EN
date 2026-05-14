# 48 - خريطة مسارات التطبيق الكاملة (Complete App Routes Map)

> كل صفحة في `src/app/` — Marketing, Dashboard, Portal, ICE, Master, إلخ

---

## 📂 المسارات الرئيسية

```
src/app/
├── (auth)/                  ← (مجموعة auth)
├── (dashboard)/             ← لوحات المستخدم (109 module)
├── api/                     ← 167 API section
├── api-docs/                ← Swagger UI
├── auth/                    ← مسارات auth إضافية
├── auto-login/              ← تسجيل دخول تلقائي
├── b2b/                     ← B2B portal
├── billing-expired/         ← الاشتراك المنتهي
├── company-info/            ← معلومات الشركة
├── company-setup/           ← إعداد الشركة (onboarding)
├── customer/                ← Customer portal
├── design1, design2, design3, design4/  ← تصاميم بديلة
├── factory/                 ← (legacy)
├── features/                ← صفحة الميزات (marketing)
├── ice/                     ← ICE Super Admin
├── invoice/                 ← View invoice (public link)
├── kiosk/                   ← Kiosk mode (POS مبسط)
├── login/                   ← صفحة الدخول الموحدة
├── master/                  ← Master pages
├── master-panel/            ← Master Owner panel
├── menu/                    ← Restaurant menu
├── portals/                 ← Multi-portal entry
├── pricing/                 ← الأسعار
├── qr-menu/                 ← QR menu (مطعم)
├── restaurant/              ← Restaurant management
├── restaurant-pos/          ← Restaurant POS
├── retail/                  ← Retail features
├── sentry-example-page/     ← Sentry testing
├── shop/                    ← Online shop (B2C)
├── sign-in/                 ← Clerk sign-in
├── sign-up/                 ← Clerk sign-up
├── sso-callback/            ← Clerk callback
├── test-i18n/               ← اختبار الترجمة
├── updates/                 ← التحديثات
├── ~offline/                ← Offline page (PWA)
├── _landing.tsx             ← Landing page
├── _module-filter.tsx       ← Module filter
├── globals.css              ← Global styles
├── layout.tsx               ← Root layout
├── manifest.json            ← PWA manifest
├── manifest.ts              ← PWA manifest (TS)
├── not-found.tsx            ← 404 page
└── page.tsx                 ← Home page
```

---

## 🏠 صفحات تسويقية

### `/` (Home / Landing):
- صفحة هبوط
- Hero section
- Features showcase
- Pricing teaser
- Testimonials
- CTA: Sign up

### `/pricing`:
- الخطط الـ 4: Free, Basic, Professional, Enterprise
- مقارنة الميزات
- FAQ
- CTA: ابدأ مجاناً

### `/features`:
- عرض شامل للميزات
- Screenshots
- Demos

### `/api-docs`:
- Swagger UI
- يُولّد من Zod schemas
- جميع APIs موثقة
- يمكن اختبار الـ endpoints

---

## 🔐 صفحات Auth

### `/login`:
- صفحة دخول موحدة (581 سطر)
- تدعم:
  - Username + Password
  - Clerk SSO
  - Desktop License
- مع MFA

### `/sign-in` (Clerk):
- Clerk sign-in widget

### `/sign-up` (Clerk):
- Clerk sign-up widget

### `/sso-callback`:
- يُعاد التوجيه بعد Clerk login
- يحدد:
  - master owner → /master-panel
  - tenant موجود → subdomain
  - بدون tenant → /onboarding

### `/auto-login`:
- لـ Desktop / SSO tokens خاصة
- التحقق من الـ token + JWT generation

### `/auth/*`:
- مسارات auth إضافية
- forgot password
- reset password
- email verification

---

## 🎯 صفحات Onboarding

### `/company-info`:
- استكمال بيانات الشركة بعد التسجيل

### `/company-setup`:
- إعداد أولي للشركة:
  - معلومات الشركة
  - الفروع
  - السنة المالية
  - الإعدادات الأساسية

### `/onboarding` (في dashboard):
- إكمال إعداد النظام للمستخدم الجديد

---

## 📊 صفحات الـ Dashboard (109 موديول)

> راجع `14-modules-map.md` للقائمة الكاملة

### الأقسام الرئيسية:
- المحاسبة (`/accounting/*`)
- المالية (`/finance/*`)
- المبيعات (`/sales/*`)
- POS (`/pos/*`)
- المشتريات (`/purchases/*`)
- المخزون (`/inventory/*`)
- التصنيع (`/manufacturing/*`)
- HR (`/hr/*`)
- الرواتب (`/payroll/*`)
- الأصول (`/fixed-assets/*`)
- الخزينة (`/treasury/*`)
- التقارير (`/reports/*`)
- الإعدادات (`/settings/*`)
- الإدارة (`/admin/*`)

---

## 👤 Customer Portal

### `/customer/*`:
- بوابة العميل (للعملاء التجاريين)
- يعرض:
  - الفواتير المعلقة
  - تاريخ المعاملات
  - الكشف
  - الطلبات
- يمكن:
  - الدفع online
  - طلب عرض سعر
  - فتح ticket

### `/portals/*`:
- نقطة دخول multi-portal
- customer / vendor / partner

---

## 🤝 B2B Portal

### `/b2b/*`:
- بوابة الموردين والشركاء
- B2B specific features:
  - Bulk orders
  - Volume discounts
  - Negotiated pricing
  - PO upload

---

## 🏪 Online Shop (B2C)

### `/shop/*`:
- متجر إلكتروني (إذا مفعّل)
- Product catalog
- Cart
- Checkout
- Order tracking
- يتكامل مع Salla/Zid/Custom

---

## 🍽 Restaurant Pages

### `/restaurant/*`:
- إدارة المطعم

### `/restaurant-pos`:
- POS للمطعم (Floor Plan + KDS)

### `/menu/*`:
- عرض المنيو (للزبائن)

### `/qr-menu/*`:
- منيو QR (للزبون يمسحه على الطاولة)

---

## 🛒 Retail Pages

### `/retail/*`:
- إدارة التجزئة
- POS متقدم
- Loyalty management
- إلخ

### `/kiosk/*`:
- Self-service kiosk
- للمطار/المراكز التجارية
- بدون كاشير

---

## 👑 ICE & Master

### `/ice/*`:
- Super Admin panel
- إدارة المستأجرين
- إدارة التراخيص
- راجع `30-master-ice.md`

### `/master/*`:
- Master internal pages

### `/master-panel/*`:
- لوحة المالك
- راجع `30-master-ice.md`

---

## 📄 صفحات أخرى

### `/invoice/{id}`:
- عرض فاتورة public link
- بدون auth (إذا shared link)
- يمكن طباعتها

### `/billing-expired`:
- صفحة "اشتراكك منتهي"
- خيار الترقية أو التواصل

### `/updates`:
- إعلانات التحديثات
- Changelog
- نسخة Desktop جديدة

### `/~offline` (PWA):
- صفحة offline
- لما الإنترنت ينقطع
- يعرض cached content

---

## 🧪 صفحات اختبار / Dev

### `/sentry-example-page`:
- اختبار Sentry integration
- يولّد errors

### `/test-i18n`:
- اختبار الترجمات

### `/design1`, `/design2`, `/design3`, `/design4`:
- تصاميم بديلة (مرحلة prototyping)
- قد تُحذف لاحقاً

### `/factory`:
- صفحة legacy (قد تُحذف)

---

## 🎨 Layout Files

### `layout.tsx` (root):
- HTML structure
- Providers wrapper
- Sentry
- Theme
- Language

### `(dashboard)/layout.tsx`:
- Sidebar
- Header
- بنية الـ dashboard

### `(auth)/layout.tsx`:
- بنية بسيطة لصفحات الـ auth

### `master-panel/layout.tsx`:
- بنية مخصصة للماستر

### `ice/layout.tsx`:
- بنية ICE

---

## 🚨 Error Pages

### `not-found.tsx` (404):
- 404 page عام

### `error.tsx`:
- Error boundary
- لكل route

### Custom error routes:
- `/error/redirect-loop`
- `/error/expired`
- `/error/no-tenant`
- `/error/maintenance`
- `/error/blocked`
- `/error/payment-required`

---

## 🌐 الـ Layouts الـ Conditional

### Marketing Layout (`x-is-marketing` header):
- يُطبق على `/`, `/pricing`, `/features`
- بدون sidebar
- مع marketing nav

### Dashboard Layout:
- يُطبق على `(dashboard)/*`
- مع sidebar + header
- مع AI Copilot button

### Portal Layout:
- يُطبق على `/customer/*`, `/portals/*`
- محدود الميزات
- للعملاء فقط

### Public Layout:
- يُطبق على `/menu/*`, `/qr-menu/*`, `/invoice/*`
- بدون auth
- مبسط

---

## 🎬 الـ Route Groups في Next.js

### `(dashboard)`:
- يحوي 109 موديول
- نفس الـ layout
- لا تظهر في الـ URL

### `(auth)`:
- يحوي صفحات تسجيل
- نفس الـ layout

---

## 📐 الـ Layouts Hierarchy

```
app/
├── layout.tsx (root)
│   ├── (dashboard)/layout.tsx
│   │   └── accounting/layout.tsx (إذا موجود)
│   │       └── page.tsx
│   ├── (auth)/layout.tsx
│   │   └── login/page.tsx
│   ├── master-panel/layout.tsx
│   ├── ice/layout.tsx
│   └── customer/layout.tsx
```

---

## 🎯 Routing Best Practices

1. ✅ **Server Components افتراضياً** (لا 'use client' بدون سبب)
2. ✅ **Server Actions للـ mutations**
3. ✅ **Suspense للـ loading states**
4. ✅ **Parallel routes للـ dashboards** (@analytics)
5. ✅ **Intercepting routes للـ modals**
6. ✅ **Dynamic routes** بـ [param]
7. ✅ **Catch-all routes** بـ [...slug]
8. ❌ **لا تستخدم getServerSideProps** (Pages Router القديم)
9. ✅ **استخدم Route Handlers** (app/api/.../route.ts)
10. ✅ **Metadata API** لكل صفحة (للـ SEO)

---

## 📊 الإحصائيات النهائية

### عدد الصفحات:
- **page.tsx files:** 491
- **layout.tsx files:** ~20
- **route.ts files:** 848
- **route groups:** 2 ((dashboard), (auth))
- **dynamic routes:** ~50 ([id], [slug])

### عدد الـ subdirectories:
- في `src/app/`: ~50
- في `(dashboard)/`: 109
- في `api/`: 167

---

## 🎯 الـ Routes الفعالة (User-facing)

### العامة (Public):
- `/`, `/pricing`, `/features`, `/about`
- `/sign-up`, `/sign-in`, `/sso-callback`
- `/login`, `/auto-login`
- `/invoice/{id}` (public link)
- `/menu/{tenantId}`, `/qr-menu/{tableId}`
- `/api/health`, `/api/metrics`, `/api/docs`

### الـ Authenticated (Tenants):
- `/dashboard`
- 109 dashboard modules
- `/profile`, `/settings`
- `/portal` (employee self-service)

### الإدارية:
- `/master-panel/*` (owner only)
- `/ice/*` (super admin)

### القطاعية الخاصة:
- `/restaurant-pos`, `/restaurant-tables` (مطعم)
- `/pharmacy` (صيدلية)
- `/clinic` (عيادة)
- `/school` (مدرسة)
- `/fleet` (أسطول)

---

## 🔄 الـ Multi-Tenancy في الـ Routing

### الـ URL Pattern:
```
{subdomain}.namainvist.com/dashboard
            ↓
Middleware extracts:
  x-tenant-subdomain: {subdomain}
            ↓
Prisma client:
  getClient(subdomain) → {subdomain}_db
            ↓
كل الـ queries تذهب لقاعدة الـ tenant
```

### الـ Special Domains:
- `namainvist.com` — الرئيسية (marketing + provisioning)
- `n1.namainvist.com` — Legacy tenant
- `n11.namainvist.com` — Default legacy
- `{any}.namainvist.com` — Phase 2 tenants (each has own DB)

---

## 🎯 الـ Pages الأكثر استخداماً (تقديري)

1. `/pos` — POS اليومي
2. `/sales` — المبيعات
3. `/dashboard` — الـ home
4. `/accounting/journal` — القيود
5. `/inventory` — المخزون
6. `/hr/employees` — الموظفون
7. `/customers` — العملاء
8. `/reports` — التقارير
9. `/settings` — الإعدادات
10. `/ai-cfo` — AI insights

---

## 🎯 الـ Pages للـ Onboarding

### للمستخدم الجديد:
1. `/sign-up` (تسجيل)
2. `/sso-callback` (الـ callback)
3. `/onboarding` (استكمال البيانات)
4. `{subdomain}.namainvist.com/dashboard` (الدخول)
5. `/settings/company` (إعدادات تفصيلية)
6. `/products` (إضافة منتجات)
7. `/customers` (إضافة عملاء)
8. `/sales` (أول فاتورة)
