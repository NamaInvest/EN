# 04 - واجهة API الكاملة (API Routes & Middlewares)

> مستخرج من: `with-route.ts` (211 سطر), `middleware.ts` (206 سطر), `rate-limit.ts` (211 سطر)، وفحص 848 ملف route.ts في 167 قسم

---

## 📊 إحصائيات API الفعلية

| المقياس | العدد |
|---|---|
| **ملفات route.ts** | 848 |
| **الأقسام الرئيسية (top-level folders)** | 167 |
| **المسارات العامة (PUBLIC_ROUTES)** | 36 |
| **المسارات المعطّلة (DISABLED)** | 2 |
| **حماية بـ `withRoute`** | ~95% |
| **حماية بـ `withGuard` (Legacy)** | ~5% |
| **CRON endpoints** | 29 |

---

## 🛡 الغلاف الأمني (`withRoute` HOF)

### الواجهة الكاملة:
```typescript
import { withRoute } from '@/lib/api/with-route';

export const GET = withRoute(
    async ({ req, prisma, auth, tenant, requestId }) => {
        // req: NextRequest
        // prisma: PrismaClient (للـ tenant الحالي)
        // auth: { userId, role, tenantId, username }
        // tenant: string (اسم المستأجر)
        // requestId: UUID للتتبع
        
        const items = await prisma.product.findMany({ take: 50 });
        return NextResponse.json(items);
    },
    {
        rateLimit: 'DEFAULT',      // أو FINANCIAL / AI / AUTH / UPLOAD / ADMIN / CRON / PUBLIC
        requireAuth: true,          // افتراضي true
        roles: ['admin', 'manager'] // اختياري — اقصر على أدوار معينة
    }
);
```

### الإجراءات الداخلية (بالترتيب):

```
1. resolveTenant(req)
   ↓ AsyncLocalStorage → currentRequestStore → x-tenant header → host → env → 'n11'
   
2. checkRateLimit(tenant, method, path, tier)
   ↓ إذا تجاوز → 429 + Retry-After: 60
   ↓ Sliding window: في الذاكرة (per process)
   
3. getUserFromRequest(req)
   ↓ يستخرج JWT من Authorization header أو cookie
   ↓ jwt.verify(token, JWT_SECRET)
   ↓ إذا فشل ومطلوب auth → 401
   
4. Role Guard
   ↓ إذا roles محددة و auth.role غير موجود في القائمة → 403
   
5. getPrisma(req)
   ↓ getClient(tenant) → عميل Prisma معزول
   ↓ متضمن: Soft Delete + Audit + RLS middleware
   
6. handler(ctx)
   ↓ ينفذ داخل currentRequestStore (للوصول للسياق من أي مكان)
   
7. Metrics
   ↓ httpRequestsTotal.inc({method, status, route})
   ↓ httpRequestDuration.observe({method, route}, durationSec)
   
8. Response Headers
   ↓ X-Request-Id: uuid
   ↓ X-Response-Time: 45ms
```

### الأخطاء المعالجة:
| الكود | السبب |
|---|---|
| 401 Unauthorized | لا JWT أو فشل verify |
| 403 Forbidden | الدور غير مسموح |
| 429 Too Many Requests | تجاوز Rate Limit |
| 500 Internal Server Error | استثناء غير معالج |

---

## ⏱ Rate Limiting — المستويات الكاملة

### من `with-route.ts` (سطر 68-77):

| Tier | الحد | النافذة | الاستخدام |
|---|---|---|---|
| `DEFAULT` | 100 req | 60 ثانية | معظم المسارات |
| `FINANCIAL` | 30 req | 60 ثانية | المحاسبة، الفواتير، الدفعات |
| `AI` | 10 req | 60 ثانية | Gemini, LLM, OCR |
| `AUTH` | 500 req | 60 ثانية | login, register, refresh |
| `ADMIN` | 20 req | 60 ثانية | عمليات الإدارة |
| `UPLOAD` | 10 req | 60 ثانية | رفع الملفات |
| `CRON` | 1000 req | 60 ثانية | المهام المجدولة |
| `PUBLIC` | 200 req | 60 ثانية | المسارات العامة |

### التنفيذ:
- **الخوارزمية:** Sliding Window
- **التخزين:** في الذاكرة (Map<key, {count, windowStart}>)
- **المفتاح:** `${tenant}:${method}:${path}`
- **التنظيف:** كل 10 دقائق (`setInterval`)
- **في الإنتاج المتعدد replicas:** يحتاج Redis (`@upstash/redis` مثبت لكن غير مفعّل افتراضياً)

### Rate Limit للـ API Keys (`rate-limit.ts` سطر 110-177):
- **AUTH:** 5 req / 15 دقيقة (للـ login brute force)
- **AI:** 20 req / 1 دقيقة
- **FINANCIAL:** 30 req / 1 دقيقة
- **SENSITIVE:** 5 req / 1 دقيقة (PII)
- **UPLOAD:** 10 req / 1 دقيقة
- **DEFAULT:** 120 req / 1 دقيقة

---

## 🌐 المسارات العامة (`PUBLIC_ROUTES`) — 36 مسار

من `middleware.ts` (سطر 19-52):

```
المصادقة:
  /api/auth/login
  /api/auth/register
  /api/auth/refresh
  /api/auth/logout
  /api/auth/mfa/verify
  /api/auth/sso-redirect
  /api/auth/sso
  /api/auth/auto-login
  /api/auth/find-tenant-by-email
  /api/auth/login-by-email
  /api/auth/sync

B2B:
  /api/b2b/auth/login
  /api/b2b/auth/register

ZATCA:
  /api/zatca/callback

Webhooks:
  /api/webhook
  /api/webhooks/events

عامة:
  /api/public
  /api/pos/session/open
  /api/docs
  /api/metrics
  /api/health
  /api/sys/health

Master Panel (جديد 2026-05-14):
  /api/master-panel/auth
  /api/master-panel-data
  /api/master-panel/servers
  /api/master-panel/licenses

Tenant Provisioning:
  /api/tenant/provision
  /api/tenant/check-status
  /api/tenant/status

أخرى:
  /api/translate
```

### المسارات المعطلة (`DISABLED_ROUTES`):
```
/api/system/reset    → 410 Gone
/api/check-env       → 410 Gone
```

---

## 📂 خريطة الأقسام الـ 167 (مصنفة)

### 1️⃣ المحاسبة والمالية (14 قسم — 171 route)
| القسم | عدد المسارات | الوصف |
|---|---|---|
| `accounting` | 99 | شجرة الحسابات، القيود، الميزانية، التقارير |
| `finance` | 72 | CFO Dashboard, Cash Flow, Budgeting, FX |
| `treasury` | 12 | السيولة، البنوك، Petty Cash |
| `banks` | 5 | تسويات، استيراد، حسابات بنكية |
| `zakat` | 5 | تقييمات الزكاة |
| `copa` | 4 | محاسبة المراكز والأنشطة |
| `ap` | 3 | الموردين، capture، 3-way match |
| `fixed-assets` | 3 | الإهلاك، الإيجار |
| `ar` | 2 | الائتمان، Dunning |
| `wht` | 2 | ضريبة الدخل، نموذج 14 |
| `budgets` | 2 | السيناريوهات |
| `tax` | 1 | WHT |
| `vat` | 1 | الفئات الضريبية |
| `fx` | 1 | إعادة تقييم العملات |

### 2️⃣ المبيعات والـ POS (10 قسم — 39 route)
| القسم | عدد المسارات | الوصف |
|---|---|---|
| `sales` | 21 | فواتير، أوامر، تسليم، عمولات، ATP |
| `pos` | 13 | جلسات، checkout، BNPL، مطعم |
| `customers` | 6 | إدارة العملاء |
| `subscriptions` | 5 | اشتراكات متكررة |
| `bnpl` | 4 | Tabby، Tamara |
| `coupons` | 3 | كوبونات وخصومات |
| `loyalty` | 2 | برنامج الولاء |
| `gift-cards` | 2 | بطاقات هدايا |
| `cpq` | 1 | Configure-Price-Quote |
| `price-quotes` | 1 | عروض أسعار |

### 3️⃣ المشتريات (7 قسم — 37 route)
| القسم | عدد المسارات | الوصف |
|---|---|---|
| `purchases` | 16 | PO, GRN, matching, OCR, RFQ |
| `procurement` | 17 | RFQ، عقود الموردين، spend analytics |
| `purchase-orders` | 3 | تفاصيل PO |
| `vendors` | 2 | scorecard، بيانات |
| `ap` | 3 | (مشترك مع المحاسبة) |
| `grn` | 1 | استلام البضائع |
| `purchase-returns` | 1 | مرتجعات |

### 4️⃣ المخزون (10 قسم — 36 route)
| القسم | عدد المسارات | الوصف |
|---|---|---|
| `inventory` | 18 | جرد، باتشات، picking، تكاليف |
| `warehouses` | 4 | WMS، analytics |
| `batches` | 3 | تتبع الدفعات، الصلاحية |
| `stock` | 3 | حركات، تسويات |
| `stocktake` | 2 | جرد، AI vision |
| `warehouse` | 2 | cross-dock، slotting |
| `stock-transfers` | 1 | تحويلات |
| `stock-movements` | 1 | تسجيل |
| `product-stocks` | 1 | بالموقع |
| `packaging-units` | 1 | وحدات تغليف |

### 5️⃣ التصنيع (3 قسم — 42 route)
| القسم | عدد المسارات | الوصف |
|---|---|---|
| `manufacturing` | 40 | BOM, MRP, MES, kanban, work orders |
| `cmms` | 2 | جدولة الصيانة |
| `quality` | 2 | معايرة، إحصاءات |

### 6️⃣ الموارد البشرية والرواتب (4 قسم — 51 route)
| القسم | عدد المسارات | الوصف |
|---|---|---|
| `hr` | 39 | موظفين، إجازات، حضور، رواتب |
| `payroll` | 10 | حساب، runs، WPS |
| `attendance` | 2 | face-ID |
| `shifts` | 1 | ورديات |

### 7️⃣ الإدارة (11 قسم — 91 route)
| القسم | عدد المسارات | الوصف |
|---|---|---|
| `auth` | 23 | login, MFA, 2FA, SSO |
| `settings` | 23 | أدوار، قوالب، ZATCA onboarding |
| `ice` | 16 | اشتراكات، مستأجرين، تراخيص ديسكتوب |
| `admin` | 12 | امتثال، BI، backups |
| `system` | 12 | workflow، kanban، إشعارات |
| `tenant` | 7 | إنشاء، seed |
| `approvals` | 5 | inbox |
| `portal` | 4 | بوابات العملاء/الموردين |
| `master-panel` | 4 | auth, deploy, licenses |
| `users` | 1 | إدارة المستخدمين |
| `master` | 1 | بيانات مرجعية |

### 8️⃣ الذكاء الاصطناعي (5 قسم — 18 route)
| القسم | عدد المسارات | الوصف |
|---|---|---|
| `ai` | 13 | copilot, chat, NLQ, RAG, forecasting |
| `gaps` | 5 | forecast-v2, anomaly, ESG |
| `bi` | 3 | cube, KPIs, budget variance |
| `ai-cfo` | 2 | report |
| `ai-auditor` | 1 | تدقيق آلي |

### 9️⃣ التكاملات (7 قسم — 40 route)
| القسم | عدد المسارات | الوصف |
|---|---|---|
| `cron` | 29 | 29 مهمة مجدولة |
| `platform` | 9 | webhooks, SSO, iPaaS, forms |
| `zatca` | 8 | onboard, QR, XML, generate |
| `saudi` | 5 | Mudad, Qiwa, Nitaqat |
| `webhooks` | 5 | Salla, Zid |
| `telegram` | 2 | webhook, process |
| `whatsapp` | 1 | interactive |

### 🔟 التقارير والامتثال (5 قسم — 36 route)
| القسم | عدد المسارات | الوصف |
|---|---|---|
| `reports` | 11 | cash-flow, statements, ZATCA-VAT |
| `compliance` | 3 | audits, rules, risks |
| `audit-logs` | 1 | عرض السجلات |
| `audit` | 1 | field-trail |
| `dashboard` | 1 | عام |

### 1️⃣1️⃣ الحلول القطاعية (16 قسم — 61 route)
| القسم | عدد المسارات | الوصف |
|---|---|---|
| `crm` | 23 | accounts, opportunities, leads, tickets |
| `v3` | 17 | كل القطاعات الإصدار 3 |
| `enterprise` | 9 | fleet, projects, MRP, quality, WMS |
| `projects` | 7 | phases, milestones, resources |
| `pharmacy` | 6 | adviser drugs, patients |
| `fleet` | 4 | fuel, maintenance, trips |
| `restaurant` | 4 | POS, table |
| `clinic` | 3 | appointments, eRx, lab |
| `ecommerce` | 3 | orders, stores, sync |
| `bookings` | 2 | فواتير |
| `rental` | 2 | عقود، مرتجعات |
| `field-service` | 2 | orders |
| `fsm` | 2 | tickets |
| `supply-chain` | 2 | RFx auction، vendor onboarding |
| `school` | 1 | عام |
| `rent` | 1 | عام |

### 1️⃣2️⃣ المرافق (9 قسم — 18 route)
| القسم | عدد المسارات | الوصف |
|---|---|---|
| `public` | 4 | menu, order, call-waiter |
| `documents` | 3 | transition |
| `health` | 1 | فحص الصحة |
| `version` | 1 | الإصدار |
| `search` | 1 | semantic |
| `upload` | 1 | رفع ملفات |
| `translate` | 1 | الترجمة |
| `check-env` | 1 | (معطّل) |
| `manifest` | 1 | PWA |

---

## 📋 سيناريو Provision كامل

من `provision/route.ts` (477 سطر) — السيناريو الكامل لإنشاء مستأجر جديد:

### المدخلات (Zod Schema):
```typescript
{
    companyNameAr: string,        // مطلوب
    companyNameEn?: string,       // اختياري (يُترجم تلقائياً)
    businessDomain?: string,
    branchName?: string,
    mobile: string,               // مطلوب
    city: string,                 // مطلوب
    district?, address?, buildingNo?, postalCode?,
    vatNumber?: string,           // 15 رقم، يبدأ وينتهي بـ 3
    crnNumber?: string,           // 10 أرقام، يبدأ بـ 7
    clerkUserId?: string|number,
    clerkEmail?: string
}
```

### الخطوات A→G:

**A. ترجمة الاسم (إذا الإنجليزي فارغ):**
```typescript
const englishName = await translateArabicToEnglish(companyNameAr);
// مثال: "شركة الجاسم للتجارة" → "Aljassim Trading Company"
```

**B. توليد subdomain فريد:**
```typescript
let subdomain = slugify(englishName); // "aljassim-trading"
let counter = 0;
while (await directoryExists(`/www/wwwroot/${subdomain}.namainvist.com`)) {
    counter++;
    subdomain = `${baseSubdomain}${counter}`;
}
```

**C. إنشاء قاعدة البيانات عبر SSH:**
```bash
# يتصل بـ 46.4.188.170 root
psql -U postgres -c "CREATE DATABASE ${subdomain}_db;"

# تطبيق Schema:
cd /www/wwwroot/namainvist.com
DATABASE_URL="postgresql://.../$subdomain_db" \
    npx prisma@5.22.0 db push \
    --schema=prisma/schema.prisma \
    --accept-data-loss
```

**D. زرع البيانات الأولية (داخل الـ tenant DB):**
```typescript
// 21+ مفتاح settings
await tx.setting.createMany({ data: [
    { key: 'company_name', value: companyNameAr },
    { key: 'company_name_en', value: companyNameEn },
    { key: 'tax_number', value: vatNumber },
    { key: 'zatca_crn', value: crnNumber },
    { key: 'company_phone', value: mobile },
    { key: 'company_address', value: address },
    { key: 'posFooterText', value: '' },
    { key: 'zatca_industry', value: businessDomain },
    { key: 'zatca_city', value: city },
    { key: 'zatca_city_en', value: cityEn },
    { key: 'zatca_district', value: district },
    { key: 'zatca_street', value: '' },
    { key: 'zatca_building', value: buildingNo },
    { key: 'zatca_postal_code', value: postalCode },
    { key: 'trialActive', value: 'true' },
    { key: 'trialEndsAt', value: trialEndDate.toISOString() },
    { key: 'maxTrialInvoices', value: '50' },
    { key: 'tax_rate', value: '15' },
    { key: 'POS_TAX_ENABLED', value: 'true' },
    { key: 'POS_TAX_INCLUSIVE', value: 'false' },
    { key: 'branch_name_en', value: branchName },
]});

// إنشاء مستخدم admin
await tx.user.create({
    data: {
        username: usernameFromEmail,
        passwordHash: await bcrypt.hash('admin7773', 10),
        role: 'admin',
    }
});

// مستخدم admin إضافي (احتياطي)
await tx.user.create({
    data: { username: 'admin', passwordHash: hash, role: 'admin' }
});

// شركة + فرع + مستودع + عميل نقدي + وحدات
```

**E. تسجيل في Master DB:**
```typescript
const masterDb = new PrismaClient({ datasources: { db: { url: MASTER_DB_URL } } });
await masterDb.tenantAccount.upsert({
    where: { userEmail: clerkEmail },
    create: { ...data, status: 'pending', plan: 'free' },
    update: { subdomain, status: 'active' }
});
```

**F. توليد SSO Token:**
```typescript
const payload = `${subdomain}:${clerkUserId}:${Date.now()}`;
const signature = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
const ssoToken = `${Buffer.from(payload).toString('base64url')}.${signature}`;
// صالح 15 دقيقة فقط (يفحص الـ timestamp)
```

**G. الاستجابة:**
```json
{
    "success": true,
    "subdomain": "aljassim",
    "ssoToken": "base64url.hmac_hex",
    "seedOk": true,
    "message": "تم تأسيس نظامك بنجاح."
}
```

### معالجة الأخطاء:
```typescript
catch (e: any) {
    log.error('[provision] Uncaught error:', e);
    return NextResponse.json({
        success: false,
        message: 'خطأ عام: ' + e.message,
        debug: e.stack  // ⚠️ يُكشف في dev/staging فقط
    }, { status: 500 });
}
```

---

## 🔄 سيناريوهات API شائعة

### إنشاء فاتورة مبيعات:
```
POST /api/sales/invoices
Body: { customerId, items[], paymentMethod }

1. withRoute: auth + rate limit (FINANCIAL)
2. Zod validation
3. prisma.$transaction:
   a. توليد رقم الفاتورة (Counter لـ SERIALIZABLE)
   b. إنشاء SalesInvoice
   c. إنشاء SalesInvoiceDetail[]
   d. تخفيض ProductStock
   e. توليد ZATCA QR + Hash + PIH (إذا Phase 2)
   f. توقيع XML (إذا CSID موجود)
   g. postSalesInvoice() → JournalEntry تلقائي
4. Webhook trigger (invoice.created)
5. Response: { invoiceId, zatcaQr, journalEntryId }
```

### استلام دفعة (Payment):
```
POST /api/finance/payments
Body: { customerId, amount, invoiceIds[], paymentMethod }

1. التحقق من رصيد العميل
2. توليد PaymentRun
3. ربط بالفواتير (allocation)
4. postPaymentReceipt() → JE (Dr Cash, Cr AR)
5. تحديث Customer.balance
6. تحديث SalesInvoice.paidAmount + status
```

### إغلاق جلسة POS:
```
POST /api/pos/session/close
Body: { sessionId, declaredCash }

1. تجميع كل المبيعات في الجلسة
2. حساب الـ expected cash (subset حسب طريقة الدفع)
3. الفرق = declaredCash - expectedCash
4. إذا الفرق > tolerance → تسجيل في AuditLog
5. postPosClosing() → JE
6. update PosSession.status = 'closed'
```

---

## 🎯 خلاصة للـ AI

- ✅ **استخدم `withRoute` دائماً** للمسارات الجديدة
- ✅ **اختر Rate Limit المناسب** (FINANCIAL للحساس)
- ✅ **استخدم Zod** للـ validation
- ✅ **استخدم `prisma.$transaction`** للعمليات متعددة الجداول
- ❌ **لا تكتب راو SQL** إلا في ظروف خاصة
- ❌ **لا تتخطى الـ auth** بإضافة مسارك إلى PUBLIC_ROUTES بدون مبرر قوي
- ❌ **لا تستخدم `withGuard` للمسارات الجديدة** — استخدم `withRoute`
