# ًں—؛ï¸ڈ ROADMAP â€” ط®ط§ط±ط·ط© ط§ظ„ط·ط±ظٹظ‚ ط§ظ„طھظ†ظپظٹط°ظٹط©

> **ط§ظ„ظ…ط¯ط© ط§ظ„ظƒظ„ظٹط©:** 5-6 ط£ط´ظ‡ط±
> **ط§ظ„ظپط±ظٹظ‚ ط§ظ„ظ…ظ‚طھط±ط­:** 4 ظ…ط·ظˆط±ظٹظ† + DevOps + QA + CPA reviewer
> **ط§ظ„ظ…ظ†ظ‡ط¬ظٹط©:** Hardening ط£ظˆظ„ط§ظ‹طŒ ط«ظ… Features

---

## ًں“… ط§ظ„ظپطھط±ط© 0 â€” ط­ط±ط§ط¦ظ‚ ط§ظ„ط£ظ…ظ† (ط§ظ„ط£ط³ط¨ظˆط¹ ط§ظ„ط£ظˆظ„)

### ًںڑ¨ ظٹط¬ط¨ ط§ظ„ط§ظ†طھظ‡ط§ط، ظ‚ط¨ظ„ ط£ظٹ ط´ظٹط، ط¢ط®ط±

| # | ط§ظ„ظ…ظ‡ظ…ط© | ط§ظ„ط¬ظ‡ط¯ | ط§ظ„ظ…ط³ط¤ظˆظ„ | ط§ظ„ظ…ظ„ظپ |
|---|--------|------|---------|------|
| P0.1 | ط¥ط²ط§ظ„ط© `.env` ظ…ظ† Git history | 4h | DevOps | [15](15_INFRASTRUCTURE_DEVOPS.md) |
| P0.2 | Rotate ط¬ظ…ظٹط¹ ط§ظ„ظ…ظپط§طھظٹط­ | 2h | DevOps | [15](15_INFRASTRUCTURE_DEVOPS.md) |
| P0.3 | طھط¹ط·ظٹظ„ `system/reset` ظˆ `check-env` | 1h | Backend | [09](09_API.md) |
| P0.4 | Auth middleware ظ…ظˆط­ظ‘ط¯ ط¹ظ„ظ‰ 297 route | 2d | Backend | [03](03_CONTEXT.md) |
| P0.5 | Sentry sampling = 0.1 ظپظٹ prod | 30m | DevOps | [15](15_INFRASTRUCTURE_DEVOPS.md) |
| P0.6 | ط¥ظٹظ‚ط§ظپ Ghost PostgreSQL | 2h | DevOps | [15](15_INFRASTRUCTURE_DEVOPS.md) |
| P0.7 | Backup cron ظٹظˆظ…ظٹ + S3 sync | 4h | DevOps | [10](10_DATA_STORAGE.md) |
| P0.8 | ط¥طµظ„ط§ط­ TypeScript ط£ظˆ timeline ظ‚ط§ط³ظٹ | 6d | Backend | [16](16_CICD.md) |

**Deliverable:** ظ†ط¸ط§ظ… ط¢ظ…ظ† ظ…ظ† ظ†ط²ظٹظپ ط§ظ„ط£ظ…ظ†. طھظ‚ط±ظٹط± ط§ظ…طھط«ط§ظ„ ط£ظˆظ„ظٹ.

---

## ًں“… ط§ظ„ظپطھط±ط© 1 â€” ط§ظ„ط³ظ„ط§ظ…ط© ط§ظ„ظ…ط­ط§ط³ط¨ظٹط© (ط§ظ„ط£ط³ط¨ظˆط¹ 2-5)

### ًںژ¯ ط§ظ„ظ‡ط¯ظپ: ظ‚ط§ط¹ط¯ط© ط¨ظٹط§ظ†ط§طھ ط³ظ„ظٹظ…ط© + Service Layer

| # | ط§ظ„ظ…ظ‡ظ…ط© | ط§ظ„ط¬ظ‡ط¯ | ط§ظ„ظ…ط³ط¤ظˆظ„ | ط§ظ„ظ…ظ„ظپ |
|---|--------|------|---------|------|
| P1.1 | Migration: 251 Float â†’ Decimal | 5d | Backend + DBA | [10](10_DATA_STORAGE.md) |
| P1.2 | Soft deletes ط¹ظ„ظ‰ 30 model | 3d | Backend | [10](10_DATA_STORAGE.md) |
| P1.3 | طھظˆط­ظٹط¯ FieldAuditTrail + FieldAuditLog | 4d | Backend | [10](10_DATA_STORAGE.md) |
| P1.4 | Compound indexes (tenantId, *) | 2d | DBA | [10](10_DATA_STORAGE.md) |
| P1.5 | ZATCA fields (icv, pih, signedXml, clearedAt) | 2d | Backend | [10](10_DATA_STORAGE.md) |
| P1.6 | Service Layer ظ„ظ€ Accounting | 5d | Backend | [08](08_BACKEND_LOGIC.md) |
| P1.7 | Service Layer ظ„ظ€ Sales/Purchases | 8d | Backend | [08](08_BACKEND_LOGIC.md) |
| P1.8 | Service Layer ظ„ظ€ HR/Payroll | 5d | Backend | [08](08_BACKEND_LOGIC.md) |
| ~~P1.9~~ ✅ | ~~auto-journal coverage (309/309 tests)~~ | 5d | Backend + CPA | [08](08_BACKEND_LOGIC.md) |
| P1.10 | Zod validation ط¹ظ„ظ‰ 650 route | 12d | Backend (parallel) | [08](08_BACKEND_LOGIC.md) |

**Deliverable:** ظ‚ط§ط¹ط¯ط© ط¨ظٹط§ظ†ط§طھ ظ†ط¸ظٹظپط© + Service Layer + 100% validation. Balance Sheet ظٹط·ط§ط¨ظ‚.

---

## ًں“… ط§ظ„ظپطھط±ط© 2 â€” ط§ظ„ظ€ Workflow & API (ط§ظ„ط£ط³ط¨ظˆط¹ 6-9)

### ًںژ¯ ط§ظ„ظ‡ط¯ظپ: ظ†ط¶ط¬ ط§ظ„ظ…ظ†طµط©

| # | ط§ظ„ظ…ظ‡ظ…ط© | ط§ظ„ط¬ظ‡ط¯ | ط§ظ„ظ…ط³ط¤ظˆظ„ | ط§ظ„ظ…ظ„ظپ |
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

**Deliverable:** Workflow Engine ط­ظٹظ‘ + API documented + versioned.

---

## ًں“… ط§ظ„ظپطھط±ط© 3 â€” ط§ظ„ظ€ AI Stack (ط§ظ„ط£ط³ط¨ظˆط¹ 10-13)

### ًںژ¯ ط§ظ„ظ‡ط¯ظپ: AI ظ…ظ†ط¸ظ‘ظ… ظˆظ‚ط§ط¨ظ„ ظ„ظ„ظ‚ظٹط§ط³

| # | ط§ظ„ظ…ظ‡ظ…ط© | ط§ظ„ط¬ظ‡ط¯ | ط§ظ„ظ…ط³ط¤ظˆظ„ | ط§ظ„ظ…ظ„ظپ |
|---|--------|------|---------|------|
| P3.1 | Personas + Few-shot library | 8d | AI specialist + ظ„ط؛ظˆظٹ | [02](02_SYSTEM_PROMPT.md) |
| P3.2 | Prompt Registry: ظ‡ط¬ط±ط© 6 ط¨ط±ظˆظ…ط¨طھط§طھ | 4d | Backend | [01](01_PROMPT_ENGINEERING.md) |
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

**Deliverable:** AI Stack production-grade ظ…ط¹ RAG + Tools + Cost tracking.

---

## ًں“… ط§ظ„ظپطھط±ط© 4 â€” ط§ظ„ظ€ Frontend (ط§ظ„ط£ط³ط¨ظˆط¹ 14-19)

### ًںژ¯ ط§ظ„ظ‡ط¯ظپ: طھط¬ط±ط¨ط© ط§ظ„ظ…ط³طھط®ط¯ظ… ط§ظ„ط§ط­طھط±ط§ظپظٹط©

| # | ط§ظ„ظ…ظ‡ظ…ط© | ط§ظ„ط¬ظ‡ط¯ | ط§ظ„ظ…ط³ط¤ظˆظ„ | ط§ظ„ظ…ظ„ظپ |
|---|--------|------|---------|------|
| P4.1 | Forms System (RHF + Zod) | 3d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.2 | DataTable v2 (tanstack) | 5d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.3 | ط¥طµظ„ط§ط­ 109 dead button | 8d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.4 | طھط±ط­ظٹظ„ 100+ form ظ„ظ€ RHF | 15d | Frontend (2x) | [13](13_FRONTEND_UIUX.md) |
| P4.5 | طھط±ط­ظٹظ„ ط§ظ„ط¬ط¯ط§ظˆظ„ ظ„ظ€ DataTable v2 | 8d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.6 | Loading/Empty/Error states ظ…ظˆط­ظ‘ط¯ط© | 4d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.7 | Dark Mode + Theme System | 3d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.8 | Accessibility pass (WCAG 2.1 AA) | 7d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.9 | Mobile responsive audit | 12d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.10 | i18n completion | 6d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.11 | Storybook + Design Tokens | 5d | Frontend | [13](13_FRONTEND_UIUX.md) |
| P4.12 | CDN + Asset Library | 8d | Frontend | [14](14_SHUTTERSTOCK_MEDIA.md) |

**Deliverable:** UI ظ…طھظ†ط§ط³ظ‚ + accessible + responsive + dark mode.

---

## ًں“… ط§ظ„ظپطھط±ط© 5 â€” Testing & DevOps Maturity (ط§ظ„ط£ط³ط¨ظˆط¹ 20-23)

### ًںژ¯ ط§ظ„ظ‡ط¯ظپ: ط§ظ„ط¥ظ†طھط§ط¬ ط§ظ„ظ…ظˆط«ظˆظ‚

| # | ط§ظ„ظ…ظ‡ظ…ط© | ط§ظ„ط¬ظ‡ط¯ | ط§ظ„ظ…ط³ط¤ظˆظ„ | ط§ظ„ظ…ظ„ظپ |
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

**Deliverable:** ظ†ط¸ط§ظ… production-ready ظ…ط¹ 80%+ coverage + monitoring + automated recovery.

---

## ًں“ٹ ط¬ط¯ظˆظ„ ط§ظ„طھطھط¨ظ‘ط¹ ط§ظ„ط£ط³ط¨ظˆط¹ظٹ

| ط§ظ„ط£ط³ط¨ظˆط¹ | ط§ظ„ظپطھط±ط© | ط§ظ„ط¥ظ†ط¬ط§ط² ط§ظ„ظ…طھظˆظ‚ط¹ | KPIs |
|---------|--------|----------------|------|
| 1 | P0 | ط­ط±ط§ط¦ظ‚ ط§ظ„ط£ظ…ظ† | 0 routes ط¨ط¯ظˆظ† auth |
| 2-5 | P1 | ط§ظ„ط³ظ„ط§ظ…ط© ط§ظ„ظ…ط­ط§ط³ط¨ظٹط© | 0 FloatطŒ 100% Zod |
| 6-9 | P2 | Workflow + API | OpenAPI complete |
| 10-13 | P3 | AI Stack | RAGAS > 0.85 |
| 14-19 | P4 | Frontend | WCAG 2.1 AA |
| 20-23 | P5 | Testing + DevOps | Coverage 80%+ |

---

## ًںژ¯ ط§ظ„ظ…ط¹ط§ظ„ظ… ط§ظ„ظƒط¨ط±ظ‰ (Milestones)

### M1 â€” Foundation Hardening (ظ†ظ‡ط§ظٹط© ط§ظ„ط£ط³ط¨ظˆط¹ 5)
- âœ… ظ„ط§ ط­ظ‚ظˆظ„ Float ظ…ط§ظ„ظٹط©
- âœ… Service Layer ظ„ظ„ظ€ accounting/sales/purchases
- âœ… auto-journal coverage 100%
- âœ… Multi-tenant isolation ظ…ظˆط«ظ‘ظ‚ط©
- âœ… Backup automation ظپط¹ظ‘ط§ظ„
- âœ… Sentry tuned
- ًںژ¯ **Demo:** ظ‚ظٹط¯ ظ…ط­ط§ط³ط¨ظٹ ظٹظ…ط± ط¨ظƒط§ظ…ظ„ ط§ظ„ظ€ pipeline (validate â†’ service â†’ auto-journal â†’ audit)

### M2 â€” Platform Maturity (ظ†ظ‡ط§ظٹط© ط§ظ„ط£ط³ط¨ظˆط¹ 9)
- âœ… Workflow Engine ط­ظٹظ‘
- âœ… Approval flows ظپط¹ظ‘ط§ظ„ط©
- âœ… OpenAPI documented
- âœ… API versioning + idempotency
- ًںژ¯ **Demo:** ظپط§طھظˆط±ط© > 100K طھظ…ط± ط¨ظ€ approval workflow ط«ظ… طھظڈط±ط³ظ„ ظ„ظ€ ZATCA

### M3 â€” AI-Native ERP (ظ†ظ‡ط§ظٹط© ط§ظ„ط£ط³ط¨ظˆط¹ 13)
- âœ… RAG production-grade
- âœ… 25 ERP tools
- âœ… Cost tracking
- âœ… Eval Suite ظپظٹ CI
- ًںژ¯ **Demo:** CFO ظٹط³ط£ظ„ ط¨ط§ظ„ط¹ط±ط¨ظٹط©طŒ ظٹط­طµظ„ ط¹ظ„ظ‰ ط¥ط¬ط§ط¨ط© ظ…ط³طھظ†ط¯ط© ظ„ظ€ knowledge base + actions executable

### M4 â€” Polished UX (ظ†ظ‡ط§ظٹط© ط§ظ„ط£ط³ط¨ظˆط¹ 19)
- âœ… 0 dead buttons
- âœ… 100% RHF + Zod
- âœ… WCAG 2.1 AA
- âœ… Dark mode + Mobile
- ًںژ¯ **Demo:** ط§ظ„ظ…ط³طھط®ط¯ظ… ظٹظ†ط´ط¦ ظپط§طھظˆط±ط© ظ…ظ† ط§ظ„ظ…ظˆط¨ط§ظٹظ„ ظپظٹ ط£ظ‚ظ„ ظ…ظ† 30 ط«ط§ظ†ظٹط©

### M5 â€” Production Excellence (ظ†ظ‡ط§ظٹط© ط§ظ„ط£ط³ط¨ظˆط¹ 23)
- âœ… 25 E2E tests
- âœ… 80% coverage
- âœ… OpenTelemetry + Grafana
- âœ… Auto-rollback
- ًںژ¯ **Demo:** PR ظƒط§ظ…ظ„: lint â†’ test â†’ build â†’ deploy â†’ smoke â†’ green

---

## ًں’° طھظ‚ط¯ظٹط± ط§ظ„طھظƒظ„ظپط© (طھظ‚ط±ظٹط¨ظٹ)

| ط§ظ„ط¨ظ†ط¯ | ط§ظ„طھظƒظ„ظپط© (ط´ظ‡ط±ظٹ) |
|------|---------------|
| 4 ظ…ط·ظˆط±ظٹظ† أ— $5K | $20,000 |
| DevOps أ— $5K | $5,000 |
| QA أ— $4K | $4,000 |
| CPA reviewer (part-time) | $2,000 |
| AI specialist (part-time) | $3,000 |
| Tools (Sentry, LangSmith, Doppler, Codecov, etc.) | $500 |
| Infrastructure (Hetzner + R2 + extras) | $300 |
| **ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط´ظ‡ط±ظٹ** | **~$35K** |
| **ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹ ظ„ظ„ظ…ط´ط±ظˆط¹ (6 ط£ط´ظ‡ط±)** | **~$210K** |

> **ط§ظ„طھظˆطµظٹط©:** ط§ط³طھط®ط¯ط§ظ… ظ…ط·ظˆط±ظٹظ† ط¹ط±ط¨ ط£ط³ط¹ط§ط±ظ‡ظ… طھظ†ط§ظپط³ظٹط© + ظ…ظٹط²ط© ظپظ‡ظ… ط§ظ„ط³ظˆظ‚ ط§ظ„ط³ط¹ظˆط¯ظٹ.

---

## ًںژ¬ ط®ط·ط© ط§ظ„ط§ظ†ط·ظ„ط§ظ‚ (Kick-off)

### ط§ظ„ط£ط³ط¨ظˆط¹ ط§ظ„ط£ظˆظ„
1. **ظٹظˆظ… 1:** ط§ط¬طھظ…ط§ط¹ kick-off â€” ظ…ط±ط§ط¬ط¹ط© ط§ظ„ط®ط·ط© ظ…ط¹ ط§ظ„ظپط±ظٹظ‚
2. **ظٹظˆظ… 2-3:** طھظ†ظپظٹط° P0 (ط­ط±ط§ط¦ظ‚ ط§ظ„ط£ظ…ظ†) â€” ظƒظ„ ط§ظ„ظپط±ظٹظ‚
3. **ظٹظˆظ… 4-5:** Setup ط£ط¯ظˆط§طھ (Doppler, codecov, Sentry tuning, Sentry, k6)

### ط§ظ„ظ…طھط§ط¨ط¹ط© ط§ظ„ط£ط³ط¨ظˆط¹ظٹط©
- **Standup ظٹظˆظ…ظٹ:** 15 ط¯ظ‚ظٹظ‚ط© (ظ…ط§ طھظ…/ظ…ط§ ط§ظ„ظ‚ط§ط¯ظ…/blockers)
- **Demo ط£ط³ط¨ظˆط¹ظٹ:** ط§ظ„ط¬ظ…ط¹ط©طŒ 30 ط¯ظ‚ظٹظ‚ط© (ط¥ظ†ط¬ط§ط²ط§طھ ط§ظ„ط£ط³ط¨ظˆط¹)
- **Retrospective ط´ظ‡ط±ظٹ:** 1 ط³ط§ط¹ط© (ظ…ط§ ظ†ط¬ط­/ظ…ط§ ظ„ظ… ظٹظ†ط¬ط­/طھط­ط³ظٹظ†ط§طھ)
- **Milestone review:** ظ†ظ‡ط§ظٹط© ظƒظ„ ظپطھط±ط©طŒ 2 ط³ط§ط¹ط© (ظ…ط±ط§ط¬ط¹ط© KPIsطŒ ظ‚ط±ط§ط±ط§طھ ط§ظ„ظ…ط³ط§ط±)

---

## ًں“ˆ ظ…ط¤ط´ط±ط§طھ ط§ظ„ظ†ط¬ط§ط­ ط§ظ„ظ†ظ‡ط§ط¦ظٹط©

| KPI | ط¨ط¯ط§ظٹط© ط§ظ„ظ…ط´ط±ظˆط¹ | ظ†ظ‡ط§ظٹط© ط§ظ„ظ…ط´ط±ظˆط¹ |
|-----|---------------|---------------|
| Routes ط¨ط¯ظˆظ† auth | 297 | 0 |
| Routes ط¨ط¯ظˆظ† Zod | 650 | 0 |
| Float financial fields | 251 | 0 |
| auto-journal coverage | 3.8% | 100% |
| Test coverage | ط؛ظٹط± ظ…ط¹ظ„ظˆظ… | 80%+ |
| E2E tests | 0 | 25 |
| Hardcoded prompts | 6+ | 0 |
| Dead buttons | 109 | 0 |
| Migrations | 2 | 30+ |
| API documentation | 0% | 100% |
| WCAG compliance | < 5% | AA |
| Sentry sampling cost | ط¹ط§ظ„ظٹ | ظ…ط¹ظ‚ظˆظ„ |
| Backup automation | ظٹط¯ظˆظٹ | طھظ„ظ‚ط§ط¦ظٹ |
| RAGAS faithfulness | ط؛ظٹط± ظ…ط¹ظ„ظˆظ… | > 0.85 |
| MTTR (Mean Time To Recovery) | ط؛ظٹط± ظ…ط¹ظ„ظˆظ… | < 30min |

---

**ًںڑ€ ط¬ط§ظ‡ط² ظ„ظ„ط¨ط¯ط،طں** ط§ط¨ط¯ط£ ط¨ظ€ [00_OVERVIEW.md](00_OVERVIEW.md) ط«ظ… [P0 â€” ط­ط±ط§ط¦ظ‚ ط§ظ„ط£ظ…ظ†](15_INFRASTRUCTURE_DEVOPS.md#ط§ظ„ظ…ط±ط­ظ„ط©-151--ط­ط±ط§ط¦ظ‚-ط£ظ…ظ†ظٹط©-ظپظˆط±ظٹط©-ط£ط³ط¨ظˆط¹).

