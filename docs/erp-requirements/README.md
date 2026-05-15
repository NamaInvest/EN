# 📋 Namasoft ERP — Complete Requirements Catalog
## كتالوج المتطلبات الشامل مقابل الأنظمة العالمية

> **الهدف**: سد الفجوة بين Namasoft و SAP S/4HANA / Oracle Fusion / NetSuite / Workday
> **الفلسفة**: لكل موديول ناقص → متطلبات كاملة + سيناريو + فلو + Prompt جاهز
> **تاريخ الإنشاء**: 2026-05-15

---

## 🎯 ما يحتويه كل موديول

كل موديول تحت هذا المجلد يحتوي على الـ 10 ملفات الإلزامية التالية:

| # | الملف | الوصف |
|---|------|-------|
| 1 | `requirements.md` | الجداول + الأزرار + القوائم + الحقول + Acceptance Criteria |
| 2 | `business-flow.md` | سيناريو العمل الكامل + فلو البيانات + State Machine |
| 3 | `erd.md` | Database Schema (Prisma models) + Relations + Indexes |
| 4 | `api-spec.yaml` | OpenAPI 3.1 specification (endpoints + DTOs) |
| 5 | `wireframes.md` | ASCII wireframes للشاشات + UX flow |
| 6 | `user-stories.md` | User Stories + Acceptance Criteria (Gherkin) |
| 7 | `test-cases.md` | Unit + Integration + E2E test plan |
| 8 | `ai-prompt.md` | System Prompt جاهز للذكاء الاصطناعي (Claude/Gemini) |
| 9 | `architecture.md` | Component diagram + Dependencies + Tech stack |
| 10 | `security.md` | Threat model + PDPL/ZATCA compliance + Encryption |

---

## 📊 الفجوات المُكتشفة من التقييم (72/100)

### 🔴 P0 — Critical Security (يجب قبل أي إنتاج)

| # | الموديول | المخاطرة | المسار |
|---|---------|----------|--------|
| 1 | **WPS Real SIF Generator** | mock فقط — مخالف لقانون حماية الأجور | [01-critical-security/01-wps-real/](./01-critical-security/01-wps-real/) |
| 2 | **Encryption Key Management** | ENCRYPTION_KEY hardcoded default | [01-critical-security/02-encryption-key/](./01-critical-security/02-encryption-key/) |
| 3 | **Rate Limiting (Redis)** | in-memory يفشل عند replicas | [01-critical-security/03-rate-limiting/](./01-critical-security/03-rate-limiting/) |
| 4 | **PDPL Compliance** | لا encryption للبيانات الشخصية الحساسة | [01-critical-security/04-pdpl/](./01-critical-security/04-pdpl/) |
| 5 | **AI API Key Encryption** | Gemini key مخزّن plaintext في DB | [01-critical-security/05-ai-key-encryption/](./01-critical-security/05-ai-key-encryption/) |

### 🟠 P1 — Missing Financial (للوصول لمستوى Oracle/SAP)

| # | الموديول | الفجوة | المسار |
|---|---------|--------|--------|
| 1 | **IFRS 16 Leases** | lease-accounting-engine بدائي | [02-missing-financial/01-ifrs16-leases/](./02-missing-financial/01-ifrs16-leases/) |
| 2 | **IFRS 15 Revenue Recognition** | contract-asset-engine بسيط | [02-missing-financial/02-ifrs15-revenue/](./02-missing-financial/02-ifrs15-revenue/) |
| 3 | **Consolidation Elimination** | 95% لكن غير مُختبر | [02-missing-financial/03-consolidation-elimination/](./02-missing-financial/03-consolidation-elimination/) |
| 4 | **Statement of Changes in Equity** | غير موجود | [02-missing-financial/04-changes-in-equity/](./02-missing-financial/04-changes-in-equity/) |
| 5 | **Tax Reconciliation Reports** | غير موجود | [02-missing-financial/05-tax-reconciliation/](./02-missing-financial/05-tax-reconciliation/) |

### 🟠 P1 — Missing Supply Chain

| # | الموديول | الفجوة | المسار |
|---|---------|--------|--------|
| 1 | **APS Advanced Planning** | 42 سطر فقط — لا constraint solver | [03-missing-supply-chain/01-aps-advanced/](./03-missing-supply-chain/01-aps-advanced/) |
| 2 | **3PL Integration** | غير موجود | [03-missing-supply-chain/02-3pl-integration/](./03-missing-supply-chain/02-3pl-integration/) |
| 3 | **Route Optimization** | بدائي | [03-missing-supply-chain/03-route-optimization/](./03-missing-supply-chain/03-route-optimization/) |
| 4 | **Yard Management** | غير موجود | [03-missing-supply-chain/04-yard-management/](./03-missing-supply-chain/04-yard-management/) |
| 5 | **EDI Integration** | غير موجود | [03-missing-supply-chain/05-edi-integration/](./03-missing-supply-chain/05-edi-integration/) |

### 🟡 P2 — Missing CRM & Sales

| # | الموديول | الفجوة | المسار |
|---|---------|--------|--------|
| 1 | **Loyalty Programs** | غير موجود | [04-missing-crm-sales/01-loyalty-programs/](./04-missing-crm-sales/01-loyalty-programs/) |
| 2 | **Marketing Automation** | basic | [04-missing-crm-sales/02-marketing-automation/](./04-missing-crm-sales/02-marketing-automation/) |
| 3 | **E-commerce Integration** | محدود | [04-missing-crm-sales/03-ecommerce/](./04-missing-crm-sales/03-ecommerce/) |
| 4 | **Omnichannel** | غير موجود | [04-missing-crm-sales/04-omnichannel/](./04-missing-crm-sales/04-omnichannel/) |

### 🟡 P2 — Missing HR

| # | الموديول | الفجوة | المسار |
|---|---------|--------|--------|
| 1 | **ATS Advanced** | بدائي — لا interview/offer letters | [05-missing-hr/01-ats-advanced/](./05-missing-hr/01-ats-advanced/) |
| 2 | **MSS Advanced** | غير كامل | [05-missing-hr/02-mss-advanced/](./05-missing-hr/02-mss-advanced/) |
| 3 | **Mobile App (iOS/Android)** | غير موجود | [05-missing-hr/03-mobile-app/](./05-missing-hr/03-mobile-app/) |
| 4 | **Muqeem Integration** | documentation فقط | [05-missing-hr/04-muqeem-integration/](./05-missing-hr/04-muqeem-integration/) |
| 5 | **LMS Advanced** | بدائي | [05-missing-hr/05-lms-advanced/](./05-missing-hr/05-lms-advanced/) |

### 🔵 P3 — Infrastructure / DevOps

| # | الموديول | الفجوة | المسار |
|---|---------|--------|--------|
| 1 | **CI/CD Pipeline** | لا GitHub Actions configured | [06-infrastructure/01-cicd-pipeline/](./06-infrastructure/01-cicd-pipeline/) |
| 2 | **Docker + Kubernetes** | غير موجود | [06-infrastructure/02-docker-k8s/](./06-infrastructure/02-docker-k8s/) |
| 3 | **Terraform IaC** | غير موجود | [06-infrastructure/03-terraform-iac/](./06-infrastructure/03-terraform-iac/) |
| 4 | **Monitoring & Observability** | Sentry فقط | [06-infrastructure/04-monitoring/](./06-infrastructure/04-monitoring/) |

### 🔵 P3 — Quality Assurance

| # | الموديول | الفجوة | المسار |
|---|---------|--------|--------|
| 1 | **E2E Testing Suite** | financial-integration excluded | [07-quality/01-e2e-testing/](./07-quality/01-e2e-testing/) |
| 2 | **Pentest** | غير موجود | [07-quality/02-pentest/](./07-quality/02-pentest/) |
| 3 | **Performance Benchmarks** | غير موجود | [07-quality/03-performance/](./07-quality/03-performance/) |

---

## 📐 Global Standards (يلتزم بها كل موديول)

### Technology Stack
- **Backend**: Next.js 16 (App Router) + Prisma 5.22 + PostgreSQL
- **Frontend**: React + Tailwind 4 + shadcn/ui + RTL
- **Auth**: Clerk 7 + MFA
- **Validation**: Zod 4
- **Tables**: TanStack Table
- **Forms**: react-hook-form
- **Charts**: Recharts 3
- **AI**: Gemini 2.0 Flash / Claude
- **Queue**: BullMQ + Redis
- **Tests**: Jest + Playwright (E2E)

### Naming Conventions
```
Models:        PascalCase singular     (Lease, ConsolidationRule)
Tables:        snake_case plural       (leases, consolidation_rules)
API Routes:    kebab-case              (/api/leases, /api/consolidation/eliminations)
Components:    PascalCase              (LeaseForm, LeaseListPage)
Hooks:         useCamelCase            (useLeases, useLeaseCalculation)
Functions:     camelCase               (calculateROU, postLeaseEntry)
Constants:     SCREAMING_SNAKE         (LEASE_TYPES, IFRS16_THRESHOLD)
```

### Folder Convention per Module
```
src/app/api/[module]/
  route.ts                 # list + create
  [id]/route.ts            # get + update + delete
  [id]/[action]/route.ts   # specific actions (post, reverse, etc)

src/app/[locale]/[module]/
  page.tsx                 # list page
  new/page.tsx             # create form
  [id]/page.tsx            # detail view
  [id]/edit/page.tsx       # edit form

src/lib/
  [module]-engine.ts       # business logic
  [module]-types.ts        # TypeScript types
  __tests__/[module].test.ts  # unit tests
```

---

## 🚀 Quick Start: استخدام هذا الكتالوج

### للمطوّر:
```bash
# 1. اختر موديولاً
cd docs/erp-requirements/02-missing-financial/01-ifrs16-leases/

# 2. اقرأ بالترتيب:
cat requirements.md          # ماذا نبني
cat business-flow.md         # كيف يسير العمل
cat erd.md                   # Schema
cat api-spec.yaml            # APIs
cat user-stories.md          # Acceptance criteria
cat test-cases.md            # Tests

# 3. استخدم ai-prompt.md مع Claude/Cursor
```

### للذكاء الاصطناعي (Claude Code):
```
# في بداية كل جلسة عمل على موديول جديد:
"اقرأ docs/erp-requirements/[category]/[module]/ai-prompt.md ثم نفّذ"
```

### للـ PM / المالك:
```bash
# اقرأ business-flow.md + user-stories.md فقط لفهم القيمة
```

---

## 📈 خارطة الطريق المقترحة (12 شهراً)

| الربع | الأولوية | الموديولات |
|--------|---------|------------|
| **Q1** | P0 Critical Security | WPS Real, Encryption, Rate Limiting, PDPL, AI Key |
| **Q2** | P1 Financial | IFRS 16, IFRS 15, Consolidation Elim, SOCE |
| **Q3** | P1 Supply Chain | APS, 3PL, Route Opt, EDI |
| **Q4** | P2 + Infra | Mobile App, ATS, CI/CD, K8s, E2E |

---

## 🔗 الوثائق المرجعية

- `../GLOBAL_ERP_GAP_ANALYSIS.md` — التحليل الكامل للفجوات
- `../BUSINESS_FLOWS_GUIDE.md` — 18 فلو موجود
- `../CLAUDE.md` — قواعد المشروع للذكاء الاصطناعي
- `./_templates/` — قوالب لإنشاء موديولات جديدة

---

**صاحب الوثيقة**: Namasoft Architecture Team
**يُحدّث**: بعد كل تغيير معماري
