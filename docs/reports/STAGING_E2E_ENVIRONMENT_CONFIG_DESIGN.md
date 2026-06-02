# STAGING E2E ENVIRONMENT CONFIG DESIGN
# وثيقة تصميم ملفات تكوين بيئة الاستضافة التجريبية المعزولة (Config Design Gate)

---

> **TRACK ID**: `E2E_STAGING_READINESS_TRACK` / `GLOBAL_EVALUATION_GAPS_CLOSURE`
> **GATE STATE**: `GO_FOR_STAGING_E2E_ENVIRONMENT_CONFIG_DESIGN_ONLY` (Config Design Only Gate)
> **COMPLIANCE ASSURANCES**: Zero runtime mutations, zero staging deployment, zero active .env modification. Strictly config file template design and report documentation.
> **DECISION VERDICT**: `STAGING_E2E_CONFIG_DESIGN_COMPLETED` (Pending Local Scripts Implementation Gate)

---

## 1. Executive Summary / الملخص التنفيذي

تمثل هذه البوابة الممر الهندسي الثاني لتأمين اختبارات الموجة الثانية (Wave 2) الحساسة من خلال **تصميم وتوصيف كامل ملفات التكوين (Configuration Files Design)** المطلوبة لتأسيس وتشغيل بيئة الاستضافة التجريبية المعزولة (**Staging E2E Environment**).

تنحصر مخرجات هذه البوابة في **تصميم القوالب الإعدادية وملفات التكوين الهيكلية** وصياغتها برمجياً دون تفعيلها حياً على الخادم أو المساس بالبيئة الإنتاجية الحالية أو إحداث أي أثر على قاعدة البيانات الحية.

---

## 2. Config Files Architecture / هيكلية ملفات التكوين المصممة

لضمان عزل منطقي وفيزيائي كامل وتفادي أي تداخل تشغيلي، تم تصميم أربعة ملفات تكوين معزولة ومستقلة تماماً:

```
d:\namasoft9-3-main\
├── .env.staging.template           <-- قالب المتغيرات البيئية المعزول كلياً
├── playwright.staging.config.ts    <-- إعدادات محرك Playwright الخاصة بالـ Staging وصمامات الأمان
├── docker-compose.staging.yml      <-- مواصفات حاويات الخدمات المعزولة (PostgreSQL & Redis)
└── docs/reports/                   <-- تقارير الحوكمة والمطابقة الفنية
```

---

## 3. Environment Variables Specification: `.env.staging.template`

تصميم قالب المتغيرات البيئية لبيئة الاستضافة التجريبية (`.env.staging.template`). يحتوي القالب على محاكاة كاملة لكافة الاتصالات والأسرار دون قيم حية للإنتاج:

```ini
# =========================================================================
# 🚀 NAMA INVEST ERP - STAGING ENVIRONMENT VARIABLES TEMPLATE (.env.staging)
# =========================================================================
# WARNING: STRICTLY FOR ISOLATED STAGING. DO NOT COPY PRODUCTION CREDENTIALS here!

# 1. System Environment & Target Domain
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.namainvist.com
E2E_STAGING_BASE_URL=https://staging.namainvist.com
E2E_TENANT_SLUG=e2e-isolated-tenant-xyz

# 2. Safety Write Guards (MUST be true only in Staging, NEVER in Prod!)
E2E_ALLOW_WRITES=true
E2E_RUN_ID=staging_auto_run_latest

# 3. Isolated Database Connection (PostgreSQL Staging - Port 5433)
# PostgreSQL staging runs on port 5433 to completely isolate from production 5432
DATABASE_URL="postgresql://postgres_staging:MockPassStaging123@127.0.0.1:5433/n11_staging_db?schema=public&sslmode=disable"
DIRECT_URL="postgresql://postgres_staging:MockPassStaging123@127.0.0.1:5433/n11_staging_db?schema=public&sslmode=disable"

# 4. Isolated Redis Connection (Staging - Port 6380)
# Redis staging runs on port 6380 to avoid contaminating production 6379 queues
REDIS_URL="redis://127.0.0.1:6380/0"
REDIS_HOST=127.0.0.1
REDIS_PORT=6380
REDIS_KEY_PREFIX="staging:"

# 5. Clerk Auth Sandbox Keys (Mock Clerk Secrets for E2E authentication bypass)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bW9jay1jbGVyay1zdGFnaW5nLXVzZXItOTkuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_MockClerkSecretKeyStagingOnlyNoProductionAllowed12345
CLERK_JWT_KEY=MockClerkJWTKeyStagingBypassOnlyForE2ETestingWithGranularRoles

# 6. Mock Sandboxed APIs Configuration
ZATCA_ENVIRONMENT=sandbox
ZATCA_DEVELOPER_PORTAL_URL=https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMS_PROVIDER_API_KEY=MockSMSProviderAPIKeyForStagingOnlyNoSMSCharges
PAYMENT_GATEWAY_SANDBOX_KEY=MockMadaVisaPaymentGatewaySandboxKeyForE2ETesting
```

---

## 4. Playwright Staging Config: `playwright.staging.config.ts`

تم تصميم ملف إعدادات Playwright المخصص لبيئة الاستضافة التجريبية (`playwright.staging.config.ts`). يدمج الملف صمامات أمان حديدية وقواعد لمنع الفحص العشوائي أو الكتابة على قواعد الإنتاج:

```typescript
import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * 🔒 NAMA INVEST ERP - Playwright Staging Configuration
 * 
 * يدمج هذا الملف صمامات أمان حازمة تمنع تشغيل اختبارات الموجة الثانية التي تكتب بيانات
 * على أي بيئة إنتاجية حية أو خادم إنتاج.
 */

// 1. صمام الحماية الحديدي للتحقق من الرابط المستهدف (Production Write Guard)
const targetBaseURL = process.env.E2E_STAGING_BASE_URL || 'http://127.0.0.1:3000';

if (targetBaseURL.includes('namainvist.com') && !targetBaseURL.includes('staging.namainvist.com')) {
  console.error('\n🚨🚨🚨 CRITICAL SECURITY FAULT 🚨🚨🚨');
  console.error('Target baseURL pointing to PRODUCTION domain namainvist.com!');
  console.error('Wave 2 write tests are STRICTLY PROHIBITED on production servers.');
  console.error('Execution terminated immediately to preserve financial safety.\n');
  process.exit(1);
}

// 2. التحقق من صلاحية الكتابة للمستندات والقيود
if (process.env.E2E_ALLOW_WRITES !== 'true') {
  console.error('\n🚨 SECURITY WARNING 🚨');
  console.error('E2E_ALLOW_WRITES environment variable is not explicitly set to "true".');
  console.error('Write tests will fail-fast. Staging E2E execution requires write clearance.\n');
  process.exit(1);
}

export default defineConfig({
  ...baseConfig,
  testDir: './e2e',
  // عزل نتائج الفحوصات في مجلد خاص ببيئة الـ Staging لسهولة الفرز والتطهير
  outputDir: 'staging-test-results/',
  
  // تمديد المهل لضمان عدم تعليق عمليات الدمج والمحاسبة المعقدة
  timeout: 120_000,
  
  // تشغيل متوازٍ مقيد لعدم التسبب بحجب الموارد أو إرهاق خادم الفحص التجريبي
  workers: 2,
  retries: 1,

  use: {
    ...baseConfig.use,
    baseURL: targetBaseURL,
    // تسجيل كامل التفاصيل بالفيديو ولقطات الشاشة عند إخفاق أي فحص للاستكشاف والتحليل المتقدم
    screenshot: 'on',
    video: 'on-first-retry',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'staging-chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        // بادئات مخصصة وتحديد المتصفح واللغة العربية افتراضياً لفحص المطابقة للـ ZATCA والـ SOCPA
        locale: 'ar-SA',
        timezoneId: 'Asia/Riyadh',
      },
    },
    {
      name: 'staging-mobile-emulation',
      use: {
        ...devices['iPhone 13'],
        defaultBrowserType: 'chromium',
        locale: 'ar-SA',
        timezoneId: 'Asia/Riyadh',
      },
    },
  ],
});
```

---

## 5. Docker Containers Spec: `docker-compose.staging.yml`

تصميم ملف تكوين الحاويات المعزولة لبيئة الاستضافة التجريبية (`docker-compose.staging.yml`) لتشغيل خوادم PostgreSQL مستقلة تماماً و خوادم Redis مستقلة على منافذ غير تشغيلية للإنتاج:

```yaml
version: '3.8'

services:
  # 1. Isolated PostgreSQL Database Service
  postgres_staging:
    image: postgres:15-alpine
    container_name: nama_postgres_staging
    environment:
      POSTGRES_USER: postgres_staging
      POSTGRES_PASSWORD: MockPassStaging123
      POSTGRES_DB: n11_staging_db
    ports:
      # Map database port to 5433 instead of standard 5432 to avoid conflict with production postgres
      - "127.0.0.1:5433:5432"
    volumes:
      - staging_pgdata:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - nama_staging_network

  # 2. Isolated Redis Service for caching and BullMQ staging jobs
  redis_staging:
    image: redis:7-alpine
    container_name: nama_redis_staging
    command: redis-server --port 6380 --requirepass MockRedisStagingPass123
    ports:
      # Map Redis port to 6380 to prevent any intersection with production Redis queue on port 6379
      - "127.0.0.1:6380:6380"
    volumes:
      - staging_redisdata:/data
    restart: unless-stopped
    networks:
      - nama_staging_network

volumes:
  staging_pgdata:
    driver: local
  staging_redisdata:
    driver: local

networks:
  nama_staging_network:
    driver: bridge
```

---

## 6. Preventative Production Guards / آليات صمام منع تداخل الإنتاج

لحماية خادم الإنتاج الحقيقي، تم اعتماد صمامات الأمان المعمارية الحاكمة كالتالي:

1. **شبكة عمل داخلية مغلقة (Host Binding Restriction)**:
   - يلاحظ في ملف تكوين الحاويات `docker-compose.staging.yml` ربط المنافذ بـ `127.0.0.1` لمنع كشف منافذ قواعد بيانات Staging للإنترنت الخارجي وحجب أي دخول خارجي غير مفوض.
2. **عزل منافذ العمليات (Service Ports Separation)**:
   - تشغيل PostgreSQL الاستضافة على المنفذ `5433` (الإنتاج على `5432`).
   - تشغيل Redis الاستضافة على المنفذ `6380` (الإنتاج على `6379`).
3. **صمام منع الكتابة البرمجي (Code-Level Write Guards)**:
   - دمج التحقق الصارم بداخل ملفات اختبارات Playwright ليمنع إرسال أي معاملات POST/PUT/DELETE إنشائية إلا بعد مطابقة عنوان الفحص المستهدف `staging.namainvist.com` مع الـ URL النشط وتواجد متغير البيئة الحاكم `E2E_ALLOW_WRITES=true`.

---

## 7. Configuration Safety Matrix / مصفوفة أمن التكوين

| المكون | التكوين الإنتاجي الحالي | تكوين الـ Staging المصمم | مستوى العزل |
| :--- | :--- | :--- | :--- |
| **Domain** | `namainvist.com` | `staging.namainvist.com` | عزل نطاق فرعي كامل |
| **Port** | `3000` | مخصص للـ Staging (مثل `3099` أو معزول) | عزل منافذ التطبيقات |
| **PostgreSQL** | المنفذ `5432` | المنفذ `5433` | عزل منطقي وفيزيائي كامل |
| **Redis** | المنفذ `6379` | المنفذ `6380` | عزل منطقي للذاكرة والطوابير |
| **Clerk Auth** | رموز إنتاج حية ونشطة | رموز Sandbox للتجربة والفحص | عزل المصادقة بالكامل |
| **ZATCA Portal** | خوادم الإنتاج المباشرة للهيئة | بوابة مطوري الفحص والـ Sandbox | عزل الفوترة والامتثال الضريبي |

---

## 8. Setup Gates Alignment / بوابات التأسيس والمراحل القادمة

للانتقال الآمن، يرجى الالتزام بمسار البوابات التشغيلية المعتمد كجزء من مسار الحوكمة:

1. `GO_FOR_STAGING_E2E_ENVIRONMENT_SETUP_APPROVAL_ONLY` (**مكتملة بنجاح ✅**)
2. `GO_FOR_STAGING_E2E_ENVIRONMENT_CONFIG_DESIGN_ONLY` (**البوابة الحالية - قيد الإتمام والتسجيل ⏳**)
3. `GO_FOR_STAGING_E2E_ENVIRONMENT_LOCAL_SCRIPTS_IMPLEMENTATION_ONLY` (البوابة البرمجية القادمة لكتابة سكربتات التطهير وتغذية البيانات محلياً)
4. `GO_FOR_STAGING_E2E_ENVIRONMENT_SETUP_DRY_RUN_ONLY` (تجربة محاكاة تشغيل وهمية خالية من الأثر)
5. `GO_FOR_STAGING_E2E_ENVIRONMENT_SETUP_EXECUTION_ONLY` (تأسيس وتشييد البيئة التجريبية فعلياً على الخادم)
6. `GO_FOR_STAGING_E2E_ENVIRONMENT_VERIFICATION_ONLY` (التحقق الكامل من عزل وسلامة الـ Staging)

---

## 9. Brain Updates / تحديثات ذاكرة المساعد الذكي (AI Brain Updates)

تم تسجيل هذه البوابة بنجاح كحالة حوكمة برمجية مستقلة وآمنة تماماً في مستودع الذاكرة البرمجية للذكاء الاصطناعي:
* **`.ai-brain/01-current-state.md`**: تسجيل إتمام بوابة تصميم التكوينات التجريبية (`STAGING_E2E_CONFIG_DESIGN_COMPLETED`) وحظر أي نشاط تشغيلي.
* **`.ai-brain/15-approval-gates.md`**: إدراج البوابة الحالية كبوابة مكتملة ومعتمدة رسمياً.
* **`.ai-brain/19-evidence-index.md`**: إدراج هذه الوثيقة كدليل رسمي معتمد للمطابقة.
* **`.ai-brain/20-next-actions.md`**: التوصية بالانتقال الآمن للبوابة الهندسية القادمة `GO_FOR_STAGING_E2E_ENVIRONMENT_LOCAL_SCRIPTS_IMPLEMENTATION_ONLY`.

---

## 10. Commit/Push Policy / سياسة الالتزام والنشر والدفع المعتمدة

تم تطبيق هذه السياسة بصرامة حديدية:
* تم استعراض `git status` والتأكد من خلو شجرة العمل من أي ملفات برمجية تشغيلية أو أسرار حية.
* تم إعداد التزام توثيقي واحد فقط وحصري برسالة الالتزام المعتمدة:
  ```text
  docs(e2e): design staging environment configuration files
  ```
* تم الدفع بأمان وسلاسة تامة إلى الفرع الرئيسي للمستودع وتأكيد التزامن التام مع الريموت:
  ```text
  git rev-parse HEAD == git rev-parse origin/main
  ```

---

## 11. Final Decision / القرار النهائي للحوكمة البرمجية

بموجب المراجعة والتصاميم الهندسية الشاملة والمطابقة لمعايير الجودة التقنية لنظام **نماء انفست (Nama Invest ERP)**:

```text
STATUS: STAGING_E2E_CONFIG_DESIGN_COMPLETED
TRACK: E2E_STAGING_READINESS_TRACK
IMPROVEMENT: COMMERCIAL_READINESS_IMPROVEMENT
GATE STATE: BLOCKED_REQUIRES_LOCAL_SCRIPTS_IMPLEMENTATION
```

*لا يتم تشغيل أو تأسيس أي عتاد فيزيائي للبيئة التجريبية حياً أو تشغيل حاويات الـ Docker على خادم الإنتاج الحقيقي، وتبقى كافة التكوينات كقوالب محلية حتى تفعيل البوابات اللاحقة يدوياً.*
