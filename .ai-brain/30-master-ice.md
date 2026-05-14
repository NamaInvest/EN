# 30 - Master Panel & ICE Admin

> لوحة المالك (Master Panel) + لوحة ICE Super Admin + إدارة المستأجرين

---

## 👑 Master Panel (لوحة المالك)

### الوصول:
- **URL:** `https://namainvist.com/master-panel`
- **من؟** فقط الـ emails في:
  - `ICE_OWNER_EMAIL`
  - `MASTER_OWNER_EMAIL`
  - `MASTER_ADMIN_EMAIL`

### تدفق الدخول (محدّث 2026-05-14):
```
1. المالك يفتح namainvist.com
2. ينقر "تسجيل الدخول" → Clerk SSO
3. POST /api/auth/sso-redirect:
   a. يستخرج email من Clerk session
   b. هل email ∈ MASTER_OWNER_EMAILS؟
4. إذا نعم:
   - JWT بـ role: 'owner', userId: 0
   - cookies:
     - token (24h)
     - master_token: 'SECURE_MASTER_VALIDATED' (24h)
   - redirect → /master-panel
5. الـ middleware يسمح بالوصول
```

### الكود في `sso-redirect/route.ts` (سطر 80-218):
```typescript
const MASTER_OWNER_EMAILS = [
    process.env.ICE_OWNER_EMAIL,
    process.env.MASTER_OWNER_EMAIL,
    process.env.MASTER_ADMIN_EMAIL,
].filter(Boolean).map(value => String(value).trim().toLowerCase());

if (MASTER_OWNER_EMAILS.includes(email.toLowerCase())) {
    const jwt = generateToken({ userId: 0, username: email, role: 'owner' });
    response.cookies.set('token', jwt, {...});
    response.cookies.set('master_token', 'SECURE_MASTER_VALIDATED', {...});
    return NextResponse.redirect('/master-panel');
}
```

### الـ Endpoints (4):
| المسار | الوصف |
|---|---|
| `/api/master-panel/auth` | Login (داخلي) |
| `/api/master-panel-data` | Stats كاملة |
| `/api/master-panel/servers` | حالة السيرفرات |
| `/api/master-panel/licenses` | تراخيص الديسكتوب |

### الواجهة:
```
┌─────────────────────────────────────────┐
│  Master Panel — NamaInvest               │
├─────────────────────────────────────────┤
│  Total Tenants: 145                       │
│  Active: 130 | Pending: 10 | Suspended: 5│
│                                           │
│  Revenue This Month: 145,000 SAR          │
│  New Signups: 23                          │
│                                           │
│  Server Status:                           │
│  • main-site:   🟢 Online                 │
│  • saas-app:    🟢 Online                 │
│  • n1-main:     🟢 Online                 │
│                                           │
│  Latest Tenants:                          │
│  • aljassim     Active   2026-05-13      │
│  • alqashan     Trial    2026-05-12      │
│  • ...                                    │
│                                           │
│  Desktop Licenses:                        │
│  • Total: 87 | Active: 72 | Expired: 15  │
└─────────────────────────────────────────┘
```

---

## 🛡 ICE Super Admin

### الوصول:
- **URL:** `https://namainvist.com/ice`
- **Auth:** `ice_session` cookie (منفصل عن user JWT)
- **من؟** فريق الدعم الفني (Tech Support, DevOps)

### الـ Endpoints (16):
```
/api/ice/login                    — Login
/api/ice/tenants                  — قائمة المستأجرين
/api/ice/tenants/{id}             — تفاصيل
/api/ice/tenants/{id}/suspend     — تعليق
/api/ice/tenants/{id}/activate    — تفعيل
/api/ice/tenants/{id}/delete      — حذف
/api/ice/tenants/{id}/features    — feature flags
/api/ice/tenants/{id}/users       — المستخدمون
/api/ice/tenants/{id}/billing     — الفواتير
/api/ice/subscriptions            — كل الاشتراكات
/api/ice/desktop-licenses         — التراخيص
/api/ice/modules                  — الموديولات
/api/ice/announcements            — الإعلانات
/api/ice/health                   — صحة النظام
/api/ice/logs                     — السجلات
/api/ice/stats                    — الإحصائيات
```

### Sidebar (`IceSidebar.tsx`):
```
🏠 Dashboard
👥 Tenants
   └─ All / Pending / Suspended
📦 Modules
🔑 Desktop Licenses
💰 Subscriptions & Billing
📢 Announcements
🔧 System
   └─ Health / Logs / Backups
👤 Users
⚙️ Settings
```

---

## 🏢 إدارة المستأجرين

### Lifecycle:
```
PENDING → ACTIVE → SUSPENDED → DELETED (soft)
            ↓
         EXPIRED (after trial)
            ↓
         CANCELLED
```

### عرض المستأجرين:
```typescript
GET /api/ice/tenants
Response: {
    tenants: [{
        id, subdomain, orgName,
        userEmail, vatNumber,
        status, plan,
        trialEndsAt, subscriptionEndsAt,
        createdAt,
        usage: { users, invoices, products, storageGB }
    }]
}
```

### العمليات:

#### تفعيل:
```typescript
POST /api/ice/tenants/{id}/activate
{
    plan: 'free' | 'basic' | 'professional' | 'enterprise',
    subscriptionMonths: 12,
    discountPct: 10
}
```

#### تعليق:
```typescript
POST /api/ice/tenants/{id}/suspend
{ reason }
// → status: 'suspended'
// → users لا يمكنهم الدخول
// → البيانات محفوظة
// → email إخطار للعميل
```

#### حذف (Soft):
```typescript
DELETE /api/ice/tenants/{id}
{ confirmDelete: true, backupBeforeDelete: true }
// → backup أولاً
// → ثم DROP DATABASE {tenant}_db (محذراً)
// → TenantAccount soft delete
```

#### تمديد التجربة:
```typescript
PUT /api/ice/tenants/{id}/extend-trial
{ additionalDays: 14, reason }
```

---

## 🚩 Feature Flags

### النموذج:
```prisma
TenantFeatureFlag {
    tenantId, moduleName
    isEnabled
    enabledByUserId
    enabledAt
    expiresAt
    notes
}
```

### الـ Modules القابلة:
```
الأساسية (الكل):
  DASHBOARD, SETTINGS, USERS, AUTH

المحاسبة:
  ACCOUNTING, AR, AP, TREASURY, BANKS, REPORTS

المبيعات:
  SALES, POS, CRM, LOYALTY, COUPONS

المشتريات:
  PURCHASES, PROCUREMENT, GRN

المخزون:
  INVENTORY, WMS, BATCHES, SERIALS

التصنيع:
  MANUFACTURING, BOM, MRP, QC, CMMS

HR:
  HR, PAYROLL, WPS, GOSI, EOS

الأصول:
  FIXED_ASSETS, DEPRECIATION, IFRS16

ZATCA:
  ZATCA_PHASE1, ZATCA_PHASE2

الذكاء:
  AI_COPILOT, AI_CFO, AI_AUDITOR, AI_OCR, AI_VISION

القطاعية:
  RESTAURANT, PHARMACY, CLINIC, SCHOOL, FLEET

التكاملات:
  SALLA, ZID, TABBY, TAMARA, WHATSAPP, TELEGRAM
```

### الاستخدام:
```typescript
const enabled = await checkFeatureFlag(tenantId, 'AI_OCR');
if (!enabled) {
    return <ComingSoonModule moduleName="AI OCR" />;
}
```

---

## 💰 الاشتراكات

### النماذج:
```prisma
Subscription {
    tenantId
    plan: 'free' | 'basic' | 'professional' | 'enterprise'
    monthlyPrice, annualPrice
    startDate, endDate
    autoRenew
    paymentMethod: 'CARD' | 'BANK_TRANSFER' | 'INVOICE'
    status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'
}
```

### الخطط (مقترح):
| الخطة | السعر | الميزات | الحد |
|---|---|---|---|
| **Free** | 0 | POS + Accounting أساسي | 3 users, 100 فاتورة/شهر |
| **Basic** | 199/شهر | + Inventory + Reports | 10 users, 1000/شهر |
| **Professional** | 499/شهر | + AI + HR + Mfg | 50 users, غير محدود |
| **Enterprise** | Custom | كل الميزات + Support | غير محدود |

### الـ Flow:
```
1. اختيار plan
2. إدخال بطاقة (Stripe/Tap/Moyasar)
3. سحب الفاتورة الأولى
4. التجديد التلقائي شهرياً/سنوياً
5. إذا فشل الدفع:
   - 3 أيام: retry
   - 7 أيام: notify
   - 30 يوم: suspend
```

---

## 🔑 Desktop Licenses

### إصدار License:
```typescript
POST /api/master-panel/licenses
{
    customerName, customerEmail,
    maxUsers, expiresAt,
    features: ['POS', 'ACCOUNTING', ...]
}
// → يولّد LicenseKey
// → يرسل email للعميل
```

### العمليات:
- **Activate** (تلقائي عند أول استخدام)
- **Suspend** (إيقاف مؤقت)
- **Renew** (تمديد)
- **Revoke** (إلغاء نهائي)

### المتابعة:
- آخر heartbeat
- إصدار التطبيق
- usage stats
- crash reports

---

## 📢 الإعلانات

### النموذج:
```prisma
Announcement {
    title, body, type: 'INFO' | 'WARNING' | 'CRITICAL'
    audience: 'ALL' | 'PLAN_BASIC' | 'PLAN_PRO' | 'SPECIFIC'
    specificTenantIds: Json?
    publishAt, expiresAt
    dismissible
    readBy: Json
}
```

### الاستخدامات:
- صيانة مجدولة
- ميزة جديدة
- تنبيه أمني
- تذكير ضريبي (VAT return due)

### العرض في tenant:
- Banner في الـ Dashboard
- Toast notification
- Email (للـ CRITICAL)

---

## 📊 الإحصائيات

### KPIs:
1. **النمو:**
   - New tenants/month
   - Trial → Paid conversion
   - Churn rate

2. **الإيرادات:**
   - MRR (Monthly Recurring Revenue)
   - ARR (Annual)
   - ARPU (Average Revenue Per User)
   - LTV (Customer Lifetime Value)

3. **الاستخدام:**
   - Invoices/day
   - Active users
   - Feature usage
   - AI tokens consumed

4. **الجودة:**
   - Crash rate
   - Response time
   - Error rate
   - NPS

---

## 🖥 إدارة السيرفرات

### الـ Endpoint:
```typescript
GET /api/master-panel/servers
Response: [
    {
        name: 'main-site',
        pm2Name: 'main-site',
        status: 'online',
        cpu: 5, memory: 60,
        uptime: '15d', restarts: 2
    },
    // ...
]
```

### العمليات:
- **Restart Service:** `pm2 restart {name}`
- **View Logs:** آخر 100 سطر
- **Deploy Update:** Trigger `deploy.js`
- **Health Check:** `/api/sys/health`

---

## 🔄 سيناريو نشر تحديث

### Flow:
```
1. Developer يـ push كود
2. CI runs tests
3. المالك يفتح Master Panel
4. POST /api/master-panel/deploy:
   {
       branch: 'main',
       targets: ['main-site', 'saas-app'],
       buildRequired: false,
       skipMigrations: false
   }
5. السيرفر:
   a. git pull
   b. npm install (إذا package.json تغير)
   c. npm run build (إذا needed)
   d. prisma db push (لكل tenant إذا migrations)
   e. pm2 restart {target}
6. Health check
7. notify success/failure
```

### Rollback:
- آخر 3 إصدارات محفوظة
- 1-click rollback

---

## 🛡 Audit Trail للـ Master

### النموذج:
```prisma
MasterAuditLog {
    actorEmail
    action: 'SUSPEND_TENANT' | 'DELETE_TENANT' | 'EXTEND_TRIAL' | 'ISSUE_LICENSE' | ...
    targetTenantId
    details: Json
    ipAddress
    createdAt
}
```

### المتابعة:
- من فعل ماذا ومتى
- لا يمكن الحذف
- مفيد للـ compliance

---

## 🎯 Best Practices

1. ✅ **2FA إجباري** للـ Master Panel
2. ✅ **Audit Log** لكل عملية
3. ✅ **Backup قبل الحذف**
4. ✅ **Cooling Period** للعمليات الخطرة
5. ✅ **Email Notifications** للتغييرات
6. ✅ **IP Whitelist** للوصول
7. ❌ **لا تحذف tenant** بدون نسخة احتياطية
8. ❌ **لا تعطّل ميزة** بدون إخطار مسبق
9. ✅ **Reset hardwareId** فقط بعد التحقق
10. ✅ **Communication** قبل أي صيانة
