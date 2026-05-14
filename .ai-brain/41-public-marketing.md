# 41 - الصفحات العامة والتسويق (Public & Marketing Pages)

> Marketing pages + Sign-up + Onboarding + Error pages + Public APIs

---

## 🏠 Marketing Pages

### الـ Routes:
| المسار | الغرض |
|---|---|
| `/` | Landing page (الرئيسية) |
| `/pricing` | الأسعار والخطط |
| `/features` | الميزات |
| `/about` | عن الشركة |
| `/contact` | تواصل |
| `/blog` | المدونة (إن وُجد) |
| `/docs` | الوثائق |
| `/docs/[slug]` | مقال محدد |

### الـ Layout:
- يستخدم `x-is-marketing: 1` header
- يفعّل marketing layout مخصص
- بدون sidebar
- بدون auth (public)

### في `next.config.ts`:
```typescript
headers: [
    { source: '/', headers: [{ key: 'x-is-marketing', value: '1' }] },
    { source: '/pricing', headers: [{ key: 'x-is-marketing', value: '1' }] }
]
```

### Cache Strategy:
- **HTML:** revalidate كل ساعة (ISR)
- **Static assets:** 1 year cache
- **Fonts:** 1 year cache
- **Images:** stale-while-revalidate

---

## 📝 Sign-up Flow

### الـ Routes:
| المسار | الغرض |
|---|---|
| `/sign-up` | صفحة Clerk Sign-up |
| `/sso-callback` | Callback بعد Clerk |
| `/onboarding` | استكمال بيانات الشركة |

### الـ Flow:
```
1. زبون محتمل يفتح namainvist.com
2. ينقر "ابدأ مجاناً"
3. → /sign-up (Clerk modal)
4. يدخل بريد + password
5. Clerk يرسل email verification
6. بعد التحقق → /sso-callback
7. /sso-callback يفحص:
   - هل لديه tenant موجود؟
   - إذا نعم → redirect إلى {subdomain}.namainvist.com
   - إذا لا → /onboarding
8. /onboarding:
   - اسم الشركة (عربي)
   - الرقم الضريبي
   - السجل التجاري
   - العنوان
   - رقم الجوال
   - القطاع
9. POST /api/tenant/provision
10. النظام:
    - يولّد subdomain
    - ينشئ DB
    - يطبق Schema
    - يزرع البيانات
    - يولّد SSO Token
11. redirect إلى {subdomain}.namainvist.com مع الـ token
12. الـ subdomain يدخل المستخدم تلقائياً
```

---

## 🎬 Onboarding Page

### المسار:
`/onboarding/page.tsx` — صفحة استكمال البيانات

### الـ Fields:
```typescript
{
    // معلومات الشركة
    companyNameAr: string,        // مطلوب
    companyNameEn: string,        // اختياري (يُترجم)
    
    // قانوني
    vatNumber: string,            // 15 رقم، يبدأ وينتهي بـ 3
    crNumber: string,             // 10 أرقام، يبدأ بـ 7
    
    // تواصل
    mobile: string,
    email: string,
    
    // عنوان
    city: string,
    district: string,
    street: string,
    buildingNo: string,
    postalCode: string,
    
    // الأعمال
    businessDomain: string,       // الصيدلة، التجزئة، إلخ
    expectedUsers: number,
    expectedInvoicesPerMonth: number,
    
    // الخطة
    selectedPlan: 'free' | 'basic' | 'professional'
}
```

### Validations (Zod):
```typescript
const schema = z.object({
    companyNameAr: z.string().min(3).max(100),
    vatNumber: z.string()
        .regex(/^3[0-9]{13}3$/, 'الرقم الضريبي غير صحيح')
        .optional(),
    crNumber: z.string()
        .regex(/^7[0-9]{9}$/, 'السجل التجاري غير صحيح')
        .optional(),
    mobile: z.string()
        .regex(/^(05|9665)[0-9]{8}$/, 'رقم الجوال غير صحيح'),
    city: z.enum(['الرياض', 'جدة', 'الدمام', ...]),
    // ...
});
```

### Cache Headers (مهم!):
```typescript
// no-cache للـ onboarding (يجب الـ fresh data)
headers: [
    {
        source: '/onboarding/:path*',
        headers: [
            { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
            { key: 'Pragma', value: 'no-cache' },
            { key: 'CDN-Cache-Control', value: 'no-store' }
        ]
    }
]
```

---

## 🚨 Error Pages

### الـ Routes:
| المسار | الـ Status | الغرض |
|---|---|---|
| `/404` | 404 | Not Found |
| `/error/redirect-loop` | - | SSO loop detected |
| `/error/expired` | - | Trial expired |
| `/error/no-tenant` | - | No tenant for user |
| `/error/maintenance` | 503 | Maintenance |
| `/error/blocked` | - | Tenant blocked |
| `/error/payment-required` | - | Payment overdue |

### مثال: Redirect Loop:
```
المستخدم يصل لـ SSO redirect أكثر من 3 مرات:
→ /error/redirect-loop
   "حدث خطأ في تسجيل الدخول. الرجاء:
    1. مسح الـ cookies
    2. إعادة المحاولة
    3. إذا استمر: تواصل مع الدعم"
```

### مثال: Trial Expired:
```
العميل في الفترة التجريبية وانتهت:
→ /error/expired
   "انتهت فترتك التجريبية.
    يرجى الترقية لمواصلة استخدام النظام.
    [زر: ترقية الآن]"
```

### مثال: No Tenant:
```
مستخدم Clerk بدون tenant مرتبط:
→ /error/no-tenant
   "لا يوجد حساب مؤسسة مرتبط ببريدك.
    [زر: إنشاء حساب جديد] → /onboarding
    [زر: تواصل مع الدعم]"
```

---

## 🌐 Public API Endpoints

### Customer-facing (عبر QR code):
```
/api/public/menu           — قائمة الطعام (مطعم)
/api/public/order          — طلب أونلاين
/api/public/call-waiter    — استدعاء النادل
/api/public/table          — معلومات الطاولة
```

### الـ Flow (Restaurant Menu):
```
1. مطعم يضع QR code على كل طاولة
2. الزبون يمسح بالموبايل
3. → namainvist.com/menu?tenant={subdomain}&table={tableId}
4. عرض القائمة:
   - الأطباق بالصور
   - الأسعار
   - الفلترة
   - زر: طلب الآن
5. الزبون يطلب:
   POST /api/public/order
   - يصل للمطبخ مباشرة (KDS)
6. أو ينادي:
   POST /api/public/call-waiter
   - تنبيه للنادل
```

### Auth:
- بدون JWT
- يتحقق من tenant subdomain فقط
- Rate Limit: PUBLIC tier (200 req/min)

---

## 📄 Documentation

### الـ Routes:
- `/docs` — قائمة الوثائق
- `/docs/[slug]` — مقال محدد
- `/docs/getting-started`
- `/docs/features`
- `/docs/api`
- `/docs/faq`

### الـ Content:
- Markdown files
- مكتوبة عربي + إنجليزي
- Search functionality
- Sidebar للتنقل

---

## 📋 Health Check Endpoint

### المسار: `/api/health` و `/api/sys/health`

### المخرج:
```json
{
    "status": "ok",
    "timestamp": "2026-05-14T10:30:00Z",
    "version": "2.4.8",
    "checks": {
        "database": "ok",
        "redis": "ok",
        "zatca": "ok",
        "diskSpace": "ok (45%)",
        "memory": "ok (60%)"
    }
}
```

### Detailed Health (`/api/sys/health`):
```json
{
    "status": "ok",
    "checks": [
        {
            "name": "database",
            "status": "ok",
            "latency": "12ms",
            "details": { "connections": 3, "pool_size": 5 }
        },
        {
            "name": "redis",
            "status": "ok",
            "latency": "2ms"
        },
        {
            "name": "zatca",
            "status": "ok",
            "lastSuccessfulRequest": "2026-05-14T10:25:00Z"
        }
    ]
}
```

### الاستخدام:
- Uptime monitoring (UptimeRobot, Pingdom)
- Load balancer health checks
- DevOps dashboards

---

## 🔍 SEO

### Meta Tags (في layout):
```typescript
export const metadata: Metadata = {
    title: 'Nama Invest - نظام ERP سعودي',
    description: 'نظام تخطيط موارد المؤسسات للشركات السعودية...',
    keywords: 'ERP, محاسبة, ZATCA, POS, نظام مالي',
    openGraph: {
        title: '...',
        description: '...',
        images: ['/og-image.png'],
        locale: 'ar_SA',
        type: 'website'
    },
    alternates: {
        canonical: 'https://namainvist.com',
        languages: {
            'ar': 'https://namainvist.com',
            'en': 'https://namainvist.com/en'
        }
    }
};
```

### Sitemap:
```typescript
// app/sitemap.ts
export default function sitemap() {
    return [
        { url: 'https://namainvist.com', priority: 1.0 },
        { url: 'https://namainvist.com/pricing', priority: 0.9 },
        { url: 'https://namainvist.com/features', priority: 0.8 },
        { url: 'https://namainvist.com/docs', priority: 0.7 },
        // ...
    ];
}
```

### Robots:
```
# /robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /master-panel/
Disallow: /ice/

Sitemap: https://namainvist.com/sitemap.xml
```

---

## 🎨 Manifest (PWA)

### المسار: `/api/manifest` أو `/manifest.json`

```json
{
    "name": "Nama Invest",
    "short_name": "NamaInvest",
    "description": "نظام ERP سعودي",
    "lang": "ar",
    "dir": "rtl",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#0066cc",
    "icons": [
        { "src": "/icons/icon-192.png", "sizes": "192x192" },
        { "src": "/icons/icon-512.png", "sizes": "512x512" },
        { "src": "/icons/apple-touch-icon.png", "sizes": "180x180" }
    ],
    "shortcuts": [
        { "name": "POS", "url": "/pos" },
        { "name": "Sales", "url": "/sales" }
    ]
}
```

---

## 🌍 i18n & Localization

### اللغات:
- **العربية** (default — RTL)
- **English** (LTR)

### الـ Hook:
```typescript
const { t } = useTranslation();
return <button>{t('save')}</button>;
```

### الـ Files:
- `src/locales/ar.json`
- `src/locales/en.json`

### الـ Direction:
- يتم تطبيقه تلقائياً عبر `dir` attribute في `<html>`
- Tailwind RTL plugin
- CSS logical properties (margin-inline-start بدل margin-left)

---

## 📞 Contact & Support

### الـ Routes:
- `/contact` — نموذج تواصل
- `/support` — مركز الدعم
- `/support/help-desk` — Help Desk
- `/support/sla` — SLA

### Support Channels:
- 📧 Email: support@namainvist.com
- 📞 Phone: 800-XXX-XXXX
- 💬 WhatsApp: 9665XXXXXXXXX
- 🌐 Web Chat (in-app)
- 📚 Knowledge Base: /docs

---

## 🎯 Best Practices

1. ✅ **HTML semantic** للـ accessibility
2. ✅ **Server-side rendering** للـ marketing pages (SEO)
3. ✅ **ISR** للمحتوى الذي يتغير ببطء
4. ✅ **Cache headers** صحيحة
5. ✅ **OpenGraph + Twitter Card** لكل صفحة
6. ✅ **Sitemap + Robots.txt** محدثة
7. ✅ **Mobile-first** design
8. ✅ **Lazy load images**
9. ❌ **لا client-side rendering** للـ landing page (slow LCP)
10. ✅ **Web Vitals** monitoring
