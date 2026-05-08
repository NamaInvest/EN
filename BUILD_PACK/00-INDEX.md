# Namasoft ERP — Master Build Pack
**Date:** 2026-05-09
**Status:** Active Build Pack — يلغي كل التقارير السابقة

---

## كيف تستخدم هذا الـ Build Pack

هذا المجلد يحتوي على **كل الوثائق المعمارية والإرشادية الكاملة** لبناء Namasoft ERP حتى مستوى SAP/Oracle/NetSuite.

### 1. الفحص + الفجوات + البرومنتات
- [`../FULL_AUDIT_2026-05-09.md`](../FULL_AUDIT_2026-05-09.md) — الفحص الشامل + 80 برومنت جاهز

### 2. وثائق على مستوى النظام (System-Level)
| # | الملف | الوصف |
|---|------|-------|
| 01 | [01-ARCHITECTURE_MASTER.md](01-ARCHITECTURE_MASTER.md) | المعمارية الكاملة (Frontend, Backend, DB, AI, Multi-tenant) |
| 02 | [02-SECURITY_PLAN.md](02-SECURITY_PLAN.md) | OWASP Top 10, RBAC, MFA, Encryption, Audit |
| 03 | [03-DEPLOYMENT_PLAN.md](03-DEPLOYMENT_PLAN.md) | Docker, Hetzner, Electron, PWA, CDN |
| 04 | [04-DESIGN_SYSTEM.md](04-DESIGN_SYSTEM.md) | Tokens, Components, RTL, Typography, Spacing |
| 05 | [05-DATABASE_ERD_GUIDE.md](05-DATABASE_ERD_GUIDE.md) | ERD لكل domain + علاقات + indexes |
| 06 | [06-API_SPECIFICATIONS.md](06-API_SPECIFICATIONS.md) | OpenAPI 3.1 patterns + endpoint catalog |
| 07 | [07-TEST_STRATEGY.md](07-TEST_STRATEGY.md) | Unit, Integration, E2E, Mutation, Performance |
| 08 | [08-LEGAL_COMPLIANCE_SAUDI.md](08-LEGAL_COMPLIANCE_SAUDI.md) | ZATCA, GOSI, Mudad, Qiwa, PDPL, Labor Law |
| 09 | [09-PROMPT_LIBRARY.md](09-PROMPT_LIBRARY.md) | System prompts, context management, chaining |
| 10 | [10-DEVOPS_CICD.md](10-DEVOPS_CICD.md) | GitHub Actions, PM2, Monitoring, Backup |
| 11 | [11-RAG_VECTOR_AI.md](11-RAG_VECTOR_AI.md) | Embeddings, Vector DB, RAG pipeline, LangChain |
| 12 | [12-I18N_TRANSLATION.md](12-I18N_TRANSLATION.md) | AR/EN, RTL, Hijri, Number formatting |
| 13 | [13-USER_MANUAL_OUTLINE.md](13-USER_MANUAL_OUTLINE.md) | هيكل دليل المستخدم (per role) |
| 14 | [14-TRAINING_VIDEOS.md](14-TRAINING_VIDEOS.md) | سكربتات الفيديوهات التدريبية |

### 3. وثائق على مستوى الموديول (Per-Module)
في `modules/<module-name>/`:
- `01-business-flow.md` — User journey + state machine
- `02-wireframes.md` — Sketch + ASCII wireframes
- `03-erd.md` — Entity-Relationship Diagram
- `04-openapi.yaml` — API spec
- `05-user-stories.md` — Given/When/Then
- `06-test-cases.md` — Detailed cases
- `07-migration.sql` — Prisma migration SQL
- `08-seed-data.sql` — Sample data
- `09-prompt.md` — Build prompt for the module

سيُبنى لكل P0 module:
- `accounting-coa-socpa/` (CoA SOCPA seed)
- `accounting-fs-generator/` (Balance Sheet, IS, CF)
- `accounting-tb-gl-inquiry/` (TB + GL)
- `accounting-payroll-gl/` (Payroll → GL)
- `accounting-provisions/` (EOS + Leave provisions)
- `compliance-mudad/` (Real Mudad API)
- `reporting-financial-statements/` (UI + PDF)

ثم P1 (20 موديول)، ثم P2 (23 موديول).

### 4. Wireframes ASCII / Mermaid
في `wireframes/` يوجد لكل صفحة رسم نصي + Mermaid diagram.

### 5. OpenAPI Specs
في `openapi/` يوجد ملف YAML واحد لكل موديول.

---

## الأرتفكتس مقابل قائمتك

| طلب من قائمتك | المكان |
|--------------|--------|
| Prompt Engineering | 09-PROMPT_LIBRARY.md |
| System Prompt | 09-PROMPT_LIBRARY.md §1 |
| Context | 09-PROMPT_LIBRARY.md §2 |
| Workflow & Orchestration | 09-PROMPT_LIBRARY.md §3 + 11-RAG §3 |
| LangChain | 11-RAG_VECTOR_AI.md §4 |
| Chaining | 09-PROMPT_LIBRARY.md §3 |
| VectorMine (Vector DB) | 11-RAG_VECTOR_AI.md §1-2 |
| Backend / Logic | 01-ARCHITECTURE_MASTER.md §3 |
| API | 06-API_SPECIFICATIONS.md |
| Data & Storage | 01-ARCHITECTURE_MASTER.md §4 + 05-DATABASE_ERD |
| Vector Databases | 11-RAG_VECTOR_AI.md |
| RAG | 11-RAG_VECTOR_AI.md §3 |
| Frontend / UI-UX | 01-ARCHITECTURE_MASTER.md §2 + 04-DESIGN_SYSTEM |
| Stock Images | 04-DESIGN_SYSTEM.md §10 |
| Infrastructure / DevOps | 10-DEVOPS_CICD.md |
| CI/CD | 10-DEVOPS_CICD.md §3 |
| Testing & QA | 07-TEST_STRATEGY.md |
| Unit Testing | 07-TEST_STRATEGY.md §1 |
| Integration Testing | 07-TEST_STRATEGY.md §2 |
| Wireframes & Mockups | wireframes/ + modules/*/02-wireframes.md |
| Business Flows | modules/*/01-business-flow.md + BUSINESS_FLOWS_GUIDE.md |
| Database ERD | 05-DATABASE_ERD_GUIDE.md + modules/*/03-erd.md |
| API Specifications (OpenAPI) | 06-API_SPECIFICATIONS.md + openapi/*.yaml |
| User Stories & Acceptance Criteria | modules/*/05-user-stories.md |
| Test Cases & Test Plan | 07-TEST_STRATEGY.md + modules/*/06-test-cases.md |
| Architecture Document | 01-ARCHITECTURE_MASTER.md |
| Security Plan | 02-SECURITY_PLAN.md |
| Deployment Plan | 03-DEPLOYMENT_PLAN.md |
| Style Guide / Design System | 04-DESIGN_SYSTEM.md |
| i18n Translation Files | 12-I18N_TRANSLATION.md + locales/ |
| Sample Data / Seeders | modules/*/08-seed-data.sql |
| Migration Scripts | modules/*/07-migration.sql |
| User Manual | 13-USER_MANUAL_OUTLINE.md |
| Training Videos | 14-TRAINING_VIDEOS.md |
| Legal & Compliance Docs | 08-LEGAL_COMPLIANCE_SAUDI.md |

---

## Status Tracking
- ✅ الدفعة 1: 14 ملف معماري على مستوى النظام (هذا التسليم)
- ⏳ الدفعة 2: 7 موديولات P0 × 9 artifacts = 63 ملف
- ⏳ الدفعة 3: 20 موديول P1 × 9 artifacts = 180 ملف
- ⏳ الدفعة 4: 23 موديول P2 × 9 artifacts = 207 ملف

**إجمالي مستهدف:** ~465 ملف للتغطية الكاملة.
