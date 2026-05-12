# Namasoft ERP — Master Project Pack

> حزمة شاملة لكل ما تحتاجه لبناء ERP ناماسوفت بمستوى عالمي
> Generated: 2026-05-12

## فهرس الحزمة

| # | المجلد | المحتوى |
|---|---|---|
| 01 | [prompts](01-prompts/) | System Prompts + Context Packs + Few-Shot + Prompt Registry |
| 02 | [workflow](02-workflow/) | LangChain Chains + Orchestration + Saga + Event Bus |
| 03 | [backend](03-backend/) | API design + Service layer patterns + Auto-Journal |
| 04 | [data](04-data/) | Vector DB + RAG pipeline + Storage strategy |
| 05 | [frontend](05-frontend/) | UI patterns + Component library + Image assets |
| 06 | [infrastructure](06-infrastructure/) | CI/CD + Docker + K8s + Monitoring |
| 07 | [testing](07-testing/) | Unit + Integration + E2E + Performance tests |
| 08 | [business-flows](08-business-flows/) | 18 flows (Q2C, P2P, R2R, H2R, ...) Mermaid |
| 09 | [wireframes](09-wireframes/) | Page wireframes + Mockups |
| 10 | [erd](10-erd/) | Database ERD diagrams (Mermaid) per domain |
| 11 | [openapi](11-openapi/) | OpenAPI 3.1 specifications |
| 12 | [user-stories](12-user-stories/) | User stories + Acceptance criteria (Gherkin) |
| 13 | [test-cases](13-test-cases/) | Test plan + cases per module |
| 14 | [architecture](14-architecture/) | C4 model + ADRs + Threat model |
| 15 | [security](15-security/) | Security plan + Controls matrix + DR |
| 16 | [deployment](16-deployment/) | Deploy runbooks + Blue/Green + Canary |
| 17 | [style-guide](17-style-guide/) | Design tokens + Patterns + Accessibility |
| 18 | [i18n](18-i18n/) | Translation strategy + ICU + Hijri |
| 19 | [sample-data](19-sample-data/) | Seeders per industry vertical |
| 20 | [migration](20-migration/) | Import templates from SAP/QB/Tally/Excel |
| 21 | [user-manual](21-user-manual/) | Per-role guides + Help center |
| 22 | [training](22-training/) | LMS courses + Video plan + Certifications |
| 23 | [legal](23-legal/) | TOS + Privacy + DPA + Contracts |

## كيف تستخدم هذه الحزمة

### للمطوّر
1. ابدأ بـ [03-backend/api-design.md](03-backend/api-design.md) و [14-architecture/c4-model.md](14-architecture/c4-model.md)
2. عند بناء ميزة جديدة: استخدم [01-prompts/master-system-prompt.md](01-prompts/master-system-prompt.md)
3. اتبع [07-testing/test-strategy.md](07-testing/test-strategy.md)

### للمحلل/البزنس
1. ابدأ بـ [08-business-flows/](08-business-flows/)
2. اقرأ [12-user-stories/](12-user-stories/)
3. صادق [13-test-cases/](13-test-cases/)

### للـ CFO/المحاسب
1. [03-backend/auto-journal-patterns.md](03-backend/auto-journal-patterns.md)
2. [08-business-flows/r2r-record-to-report.md](08-business-flows/r2r-record-to-report.md)

### للمسؤول القانوني/الامتثال
1. [15-security/pdpl-controls.md](15-security/pdpl-controls.md)
2. [23-legal/](23-legal/)

### للـ DevOps
1. [16-deployment/runbook-deploy.md](16-deployment/runbook-deploy.md)
2. [06-infrastructure/ci-cd.md](06-infrastructure/ci-cd.md)

### للمدير
1. [README.md](README.md) (هذا الملف)
2. [14-architecture/decision-records.md](14-architecture/decision-records.md)

## الترقيم والصيانة

- كل ملف يبدأ بـ frontmatter: `version`, `last_updated`, `owner`
- التحديث على تغييرات معمارية كبيرة فقط
- ADRs لا تُحذف — يُضاف ADR جديد ينقضها
