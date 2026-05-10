# 🗺️ ROADMAP — خارطة الطريق التنفيذية

> **المدة الكلية:** 5-6 أشهر
> **الفريق المقترح:** 4 مطورين + DevOps + QA + CPA reviewer
> **المنهجية:** Hardening أولاً، ثم Features

---

## 📅 الفترة 0 — حرائق الأمن (الأسبوع الأول)

### 🚨 يجب الانتهاء قبل أي شيء آخر

| # | المهمة | الجهد | المسؤول | الملف |
|---|--------|------|---------|------|
| P0.1 | إزالة `.env` من Git history | 4h | DevOps | [15](15_INFRASTRUCTURE_DEVOPS.md) |
| P0.2 | Rotate جميع المفاتيح | 2h | DevOps | [15](15_INFRASTRUCTURE_DEVOPS.md) |
| P0.3 | تعطيل `system/reset` و `check-env` | 1h | Backend | [09](09_API.md) |
| P0.4 | Auth middleware موحّد على 297 route | 2d | Backend | [03](03_CONTEXT.md) |
| P0.5 | Sentry sampling = 0.1 في prod | 30m | DevOps | [15](15_INFRASTRUCTURE_DEVOPS.md) |
| P0.6 | إيقاف Ghost PostgreSQL | 2h | DevOps | [15](15_INFRASTRUCTURE_DEVOPS.md) |
| P0.7 | Backup cron يومي + S3 sync | 4h | DevOps | [10](10_DATA_STORAGE.md) |
| P0.8 | إصلاح TypeScript أو timeline قاسي | 6d | Backend | [16](16_CICD.md) |

**Deliverable:** نظام آمن من نزيف الأمن. تقرير امتثال أولي.

---

## 📅 الفترة 1 — السلامة المحاسبية (الأسبوع 2-5)

### 🎯 الهدف: قاعدة بيانات سليمة + Service Layer

| # | المهمة | الجهد | المسؤول | الملف |
|---|--------|------|---------|------|
| P1.1 | Migration: 251 Float → Decimal | 5d | Backend + DBA | [10](10_DATA_STORAGE.md) |
| P1.2 | Soft deletes على 30 model | 3d | Backend | [10](10_DATA_STORAGE.md) |
| P1.3 | توحيد FieldAuditTrail + FieldAuditLog | 4d | Backend | [10](10_DATA_STORAGE.md) |
| P1.4 | Compound indexes (tenantId, *) | 2d | DBA | [10](10_DATA_STORAGE.md) |
| P1.5 | ZATCA fields (icv, pih, signedXml, clearedAt) | 2d | Backend | [10](10_DATA_STORAGE.md) |
| P1.6 | Service Layer لـ Accounting | 5d | Backend | [08](08_BACKEND_LOGIC.md) |
| P1.7 | Service Layer لـ Sales/Purchases | 8d | Backend | [08](08_BACKEND_LOGIC.md) |
| P1.8 | Service Layer لـ HR/Payroll | 5d | Backend | [08](08_BACKEND_LOGIC.md) |
| ~~P1.9~~ ? | ~~auto-journal coverage (309/309 tests)~~ | 5d | Backend + CPA | [08](08_BACKEND_LOGIC.md) |
| P1.10 | Zod validation على 650 route | 12d | Backend (parallel) | [08](08_BACKEND_LOGIC.md) |

**Deliverable:** قاعدة بيانات نظيفة + Service Layer + 100% validation. Balance Sheet يطابق.

---

## 📅 الفترة 2 — الـ Workflow & API (الأسبوع 6-9)

### 🎯 الهدف: نضج المنصة

| # | المهمة | الجهد | المسؤول | الملف |
|---|--------|------|---------|------|
| P2.1 | Business Context Service | 5d | Backend | [03](03_CONTEXT.md) |
| P2.2 | State Machine Engine | 5d | Backend | [04](04_WORKFLOW_ORCHESTRATION.md) |
| P2.3 | Approval Workflow Runtime | 10d | Backend | [04](04_WORKFLOW_ORCHESTRATION.md) |
| P2.4 | Saga Pattern (3 sagas) | 7d | Backend | [04](04_WORKFLOW_ORCHESTRATION.md) |
| P2.5 | OpenAPI auto-gen | 3d | Backend | [09](09_API.md) |
| P2.6 | API versioning v1 | 5d | Backend | [09](09_API.md) |
| P2.7 | Idempotency keys | 3d | Backend | [09](09_API.md) |
| P2.8 | API Keys runtime | 4d | Backend | [09](09_API.md) |
| P2.9 | Webhooks Manager | 5d | Backend | [09](09_API.md) |

**Deliverable:** Workflow Engine حيّ + API documented + versioned.

---

## 📅 الفترة 3 — الـ AI Stack (الأسبوع 10-13)

### 🎯 الهدف: AI منظّم وقابل للقياس

| # | المهمة | الجهد | المسؤول | الملف |
|---|--------|------|---------|------|
| P3.1 | Personas + Few-shot library | 8d | AI specialist + لغوي | [02](02_SYSTEM_PROMPT.md) |
| P3.2 | Prompt Registry: هجرة 6 برومبتات | 4d | Backend | [01](01_PROMPT_ENGINEERING.md) |
| P3.3 | A/B Testing engine | 3d | Backend | [01](01_PROMPT_ENGINEERING.md) |
| P3.4 | Cost Dashboard | 4d | Frontend + Backend | [01](01_PROMPT_ENGINEERING.md) |
| P3.5 | Eval Suite + RAGAS | 5d | AI specialist | [01](01_PROMPT_ENGINEERING.md) |
| P3.6 | pgvector HNSW | 1d | DBA | [11](11_VECTOR_DATABASES.md) |
| P3.7 | Hybrid Search + Reranker | 4d | AI specialist | [07](07_VECTORMINE.md) |
| P3.8 | Ingestion Pipeline | 7d | Backend | [07](07_VECTORMINE.md) |
| P3.9 | RAG Pipeline + Citations | 6d | AI specialist | [12](12_RAG.md) |
| P3.10 | LangChain: 25 tools | 10d | Backend | [05](05_LANGCHAIN.md) |
| P3.11 | Chains (Sequential + Router) | 8d | AI specialist | [06](06_CHAINING.md) |
| P3.12 | MCP Bridge | 4d | Backend | [03](03_CONTEXT.md) |
| P3.13 | AI Workers (5 BullMQ workers) | 5d | Backend | [04](04_WORKFLOW_ORCHESTRATION.md) |

**Deliverable:** AI Stack production-grade مع RAG + Tools + Cost tracking.

---

## 📅 الفترة 4 — الـ Frontend (الأسبوع 14-19)

### 🎯 الهدف: تجربة المستخدم الاحترافية

| # | المهمة | الجهد | المسؤول | الملف |
|---|--------|------|---------|------|
| P4.1 | Forms System (RHF + Zod) | 3d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.2 | DataTable v2 (tanstack) | 5d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.3 | إصلاح 109 dead button | 8d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.4 | ترحيل 100+ form لـ RHF | 15d | Frontend (2x) | [13](13_FRONTEND_UIUX.md) |
| P4.5 | ترحيل الجداول لـ DataTable v2 | 8d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.6 | Loading/Empty/Error states موحّدة | 4d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.7 | Dark Mode + Theme System | 3d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.8 | Accessibility pass (WCAG 2.1 AA) | 7d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.9 | Mobile responsive audit | 12d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.10 | i18n completion | 6d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.11 | Storybook + Design Tokens | 5d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.12 | CDN + Asset Library | 8d | Frontend | [14](14_SHUTTERSTOCK_MEDIA.md) |

**Deliverable:** UI متناسق + accessible + responsive + dark mode.

---

## 📅 الفترة 5 — Testing & DevOps Maturity (الأسبوع 20-23)

### 🎯 الهدف: الإنتاج الموثوق

| # | المهمة | الجهد | المسؤول | الملف |
|---|--------|------|---------|------|
| P5.1 | Coverage reporting (codecov) | 1d | DevOps | [16](16_CICD.md) |
| P5.2 | Test factories + utilities | 5d | QA | [17](17_TESTING_QA.md) |
| P5.3 | Auto-journal comprehensive tests | 5d | QA | [18](18_UNIT_TESTING.md) |
| P5.4 | Multi-tenant isolation tests | 4d | QA | [18](18_UNIT_TESTING.md) |
| P5.5 | Test Containers setup | 3d | QA + DevOps | [19](19_INTEGRATION_TESTING.md) |
| P5.6 | ZATCA + Payroll integration tests | 10d | QA | [19](19_INTEGRATION_TESTING.md) |
| P5.7 | Playwright E2E (25 paths) | 15d | QA | [19](19_INTEGRATION_TESTING.md) |
| P5.8 | Load testing (k6) | 4d | DevOps | [19](19_INTEGRATION_TESTING.md) |
| P5.9 | Dependabot + CodeQL + Snyk | 3d | DevOps | [16](16_CICD.md) |
| P5.10 | Lighthouse CI | 2d | DevOps | [16](16_CICD.md) |
| P5.11 | Smoke tests + Auto-rollback | 5d | DevOps | [16](16_CICD.md) |
| P5.12 | OpenTelemetry + Prometheus | 9d | DevOps | [15](15_INFRASTRUCTURE_DEVOPS.md) |
| P5.13 | pgBackRest + DR runbook | 6d | DevOps | [10](10_DATA_STORAGE.md) |

**Deliverable:** نظام production-ready مع 80%+ coverage + monitoring + automated recovery.

---

## 📊 جدول التتبّع الأسبوعي

| الأسبوع | الفترة | الإنجاز المتوقع | KPIs |
|---------|--------|----------------|------|
| 1 | P0 | حرائق الأمن | 0 routes بدون auth |
| 2-5 | P1 | السلامة المحاسبية | 0 Float، 100% Zod |
| 6-9 | P2 | Workflow + API | OpenAPI complete |
| 10-13 | P3 | AI Stack | RAGAS > 0.85 |
| 14-19 | P4 | Frontend | WCAG 2.1 AA |
| 20-23 | P5 | Testing + DevOps | Coverage 80%+ |

---

## 🎯 المعالم الكبرى (Milestones)

### M1 — Foundation Hardening (نهاية الأسبوع 5)
- ✅ لا حقول Float مالية
- ✅ Service Layer للـ accounting/sales/purchases
- ✅ auto-journal coverage 100%
- ✅ Multi-tenant isolation موثّقة
- ✅ Backup automation فعّال
- ✅ Sentry tuned
- 🎯 **Demo:** قيد محاسبي يمر بكامل الـ pipeline (validate → service → auto-journal → audit)

### M2 — Platform Maturity (نهاية الأسبوع 9)
- ✅ Workflow Engine حيّ
- ✅ Approval flows فعّالة
- ✅ OpenAPI documented
- ✅ API versioning + idempotency
- 🎯 **Demo:** فاتورة > 100K تمر بـ approval workflow ثم تُرسل لـ ZATCA

### M3 — AI-Native ERP (نهاية الأسبوع 13)
- ✅ RAG production-grade
- ✅ 25 ERP tools
- ✅ Cost tracking
- ✅ Eval Suite في CI
- 🎯 **Demo:** CFO يسأل بالعربية، يحصل على إجابة مستندة لـ knowledge base + actions executable

### M4 — Polished UX (نهاية الأسبوع 19)
- ✅ 0 dead buttons
- ✅ 100% RHF + Zod
- ✅ WCAG 2.1 AA
- ✅ Dark mode + Mobile
- 🎯 **Demo:** المستخدم ينشئ فاتورة من الموبايل في أقل من 30 ثانية

### M5 — Production Excellence (نهاية الأسبوع 23)
- ✅ 25 E2E tests
- ✅ 80% coverage
- ✅ OpenTelemetry + Grafana
- ✅ Auto-rollback
- 🎯 **Demo:** PR كامل: lint → test → build → deploy → smoke → green

---

## 💰 تقدير التكلفة (تقريبي)

| البند | التكلفة (شهري) |
|------|---------------|
| 4 مطورين × $5K | $20,000 |
| DevOps × $5K | $5,000 |
| QA × $4K | $4,000 |
| CPA reviewer (part-time) | $2,000 |
| AI specialist (part-time) | $3,000 |
| Tools (Sentry, LangSmith, Doppler, Codecov, etc.) | $500 |
| Infrastructure (Hetzner + R2 + extras) | $300 |
| **الإجمالي الشهري** | **~$35K** |
| **الإجمالي للمشروع (6 أشهر)** | **~$210K** |

> **التوصية:** استخدام مطورين عرب أسعارهم تنافسية + ميزة فهم السوق السعودي.

---

## 🎬 خطة الانطلاق (Kick-off)

### الأسبوع الأول
1. **يوم 1:** اجتماع kick-off — مراجعة الخطة مع الفريق
2. **يوم 2-3:** تنفيذ P0 (حرائق الأمن) — كل الفريق
3. **يوم 4-5:** Setup أدوات (Doppler, codecov, Sentry tuning, Sentry, k6)

### المتابعة الأسبوعية
- **Standup يومي:** 15 دقيقة (ما تم/ما القادم/blockers)
- **Demo أسبوعي:** الجمعة، 30 دقيقة (إنجازات الأسبوع)
- **Retrospective شهري:** 1 ساعة (ما نجح/ما لم ينجح/تحسينات)
- **Milestone review:** نهاية كل فترة، 2 ساعة (مراجعة KPIs، قرارات المسار)

---

## 📈 مؤشرات النجاح النهائية

| KPI | بداية المشروع | نهاية المشروع |
|-----|---------------|---------------|
| Routes بدون auth | 297 | 0 |
| Routes بدون Zod | 650 | 0 |
| Float financial fields | 251 | 0 |
| auto-journal coverage | 3.8% | 100% |
| Test coverage | غير معلوم | 80%+ |
| E2E tests | 0 | 25 |
| Hardcoded prompts | 6+ | 0 |
| Dead buttons | 109 | 0 |
| Migrations | 2 | 30+ |
| API documentation | 0% | 100% |
| WCAG compliance | < 5% | AA |
| Sentry sampling cost | عالي | معقول |
| Backup automation | يدوي | تلقائي |
| RAGAS faithfulness | غير معلوم | > 0.85 |
| MTTR (Mean Time To Recovery) | غير معلوم | < 30min |

---

**🚀 جاهز للبدء؟** ابدأ بـ [00_OVERVIEW.md](00_OVERVIEW.md) ثم [P0 — حرائق الأمن](15_INFRASTRUCTURE_DEVOPS.md#المرحلة-151--حرائق-أمنية-فورية-أسبوع).

