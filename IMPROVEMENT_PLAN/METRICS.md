# 📊 METRICS — مؤشرات الأداء قبل/بعد

> لوحة المؤشرات الموحّدة لمتابعة تقدّم المشروع.
> يُحدّث أسبوعياً.

---

## 🔐 الأمن (Security)

| KPI | Before | Target | Current | Status |
|-----|--------|--------|---------|--------|
| Routes بدون auth | 297 | 0 | — | 🔴 |
| Routes بدون Zod validation | 650 | 0 | — | 🔴 |
| `.env` في Git history | محتمل | لا | — | 🔴 |
| Secrets في docker-compose | hardcoded | في Vault | — | 🔴 |
| Ghost PostgreSQL | يعمل | متوقّف | — | 🔴 |
| Dependabot alerts | غير متابع | < 5 | — | — |
| CodeQL findings | غير متابع | 0 critical | — | — |
| Snyk vulnerabilities | غير متابع | 0 high | — | — |
| Pen-test findings | لم يُجرى | 0 critical | — | — |

---

## 💰 السلامة المالية (Financial Integrity)

| KPI | Before | Target | Current | Status |
|-----|--------|--------|---------|--------|
| حقول Float لمبالغ مالية | 251 | 0 | — | 🔴 |
| auto-journal coverage | 3.8% | 100% | — | 🔴 |
| Migrations في DB | 2 | 30+ | — | 🔴 |
| Soft deletes | 0 model | 30 model | — | 🔴 |
| Compound indexes | ~50 | 150+ | — | 🟠 |
| Audit log models | 2 (متضاربين) | 1 موحّد | — | 🟠 |
| ZATCA Phase 2 fields | 5/11 | 11/11 | — | 🔴 |
| Balance sheet auto-reconcile | غير محدد | يومياً | — | — |
| FX revaluation | يدوي | شهري تلقائي | — | — |

---

## 🤖 الذكاء الاصطناعي (AI)

| KPI | Before | Target | Current | Status |
|-----|--------|--------|---------|--------|
| Hardcoded prompts | 6+ | 0 | — | 🟠 |
| Personas موحّدة | 0 | 6 | — | 🔴 |
| Few-shot examples | 0 | 140+ | — | 🔴 |
| LangChain tools | 8 | 25 | — | 🟠 |
| Routes تستخدم Orchestrator | 1/8 | 7/8 | — | 🟠 |
| RAG faithfulness (RAGAS) | غير معلوم | > 0.85 | — | — |
| RAG context precision | غير معلوم | > 0.80 | — | — |
| Vector search latency p95 | ~2000ms | < 100ms | — | 🔴 |
| pgvector HNSW active | لا | نعم | — | 🔴 |
| LLM cost per tenant | غير معلوم | tracked | — | 🟠 |
| Prompt A/B tests | 0 | 5+ | — | 🟡 |
| Token budget enforcement | جزئي | 100% | — | 🟠 |

---

## 🔄 الـ Workflow

| KPI | Before | Target | Current | Status |
|-----|--------|--------|---------|--------|
| State Machine enforcement | 0 model | 10+ model | — | 🔴 |
| Active Approval Workflows | 0 | 8 | — | 🔴 |
| Saga implementations | 0 | 4 | — | 🔴 |
| AI Workers active | 0 | 5 | — | 🔴 |
| BullMQ queues | 4 | 9 (4+5) | — | 🟠 |
| Failed jobs retry rate | غير محدد | > 95% | — | — |
| Compensation success rate | غير محدد | > 99% | — | — |

---

## 🌐 الـ API

| KPI | Before | Target | Current | Status |
|-----|--------|--------|---------|--------|
| API endpoints | 661 | 661 (organized) | — | — |
| OpenAPI documentation | 0% | 100% | — | 🔴 |
| API versioning | لا | v1 | — | 🔴 |
| Idempotency keys | 0 routes | 5 critical | — | 🔴 |
| ApiKey runtime | لا | فعّال | — | 🔴 |
| Webhook deliveries success | غير معلوم | > 99% | — | — |
| Rate limit per key | لا | فعّال | — | 🟠 |
| API Keys provisioned | 0 | per tenant | — | 🟠 |

---

## 🎨 الـ Frontend / UX

| KPI | Before | Target | Current | Status |
|-----|--------|--------|---------|--------|
| Pages | 441 | 441 (cleaner) | — | — |
| Dead buttons | 109 | 0 | — | 🔴 |
| react-hook-form adoption | 0% | 100% | — | 🔴 |
| tanstack/react-table adoption | 0% | 100% | — | 🔴 |
| Dark mode | معطّل | فعّال | — | 🟠 |
| Accessibility (axe-core) | < 5% | WCAG 2.1 AA | — | 🔴 |
| Mobile responsive | < 50% | 100% | — | 🟠 |
| i18n completeness | ~70% | 100% | — | 🟠 |
| Lighthouse Performance | غير معلوم | > 85 | — | — |
| Lighthouse Accessibility | غير معلوم | > 95 | — | — |
| Storybook stories | 0 | 50+ | — | 🟡 |

---

## 🚀 الـ Infrastructure / DevOps

| KPI | Before | Target | Current | Status |
|-----|--------|--------|---------|--------|
| `ignoreBuildErrors` | true | false | — | 🔴 |
| TypeScript errors | 91 | 0 | — | 🔴 |
| Sentry sampling (prod) | 100% | 10% | — | 🔴 |
| Health checks | بدائية | 6 services | — | 🟠 |
| Distributed tracing | لا | OpenTelemetry | — | 🟡 |
| Metrics (Prometheus) | لا | فعّال | — | 🟡 |
| `console.log` instances | 20+ | 0 | — | 🟠 |
| Bundle size | غير معلوم | optimized | — | — |
| Backup frequency | يدوي | يومي + saved offsite | — | 🔴 |
| MTTR (incident recovery) | غير معلوم | < 30min | — | — |
| Deployment frequency | manual | per PR | — | 🟠 |

---

## ✅ الاختبار / Quality

| KPI | Before | Target | Current | Status |
|-----|--------|--------|---------|--------|
| Test files | 571 | 800+ | — | 🟢 |
| Coverage measurement | لا | enforced | — | 🔴 |
| Coverage % | غير معلوم | > 80% | — | 🔴 |
| auto-journal coverage % | جزئي | > 95% | — | 🟠 |
| E2E tests | 0 | 25+ | — | 🔴 |
| Multi-tenant isolation tests | لا | شامل | — | 🔴 |
| ZATCA full flow test | لا | passing | — | 🔴 |
| Payroll full flow test | لا | passing | — | 🔴 |
| Mutation score (critical) | غير معلوم | > 80% | — | 🟡 |
| Load test (req/s sustained) | غير معلوم | > 100 | — | — |
| Lighthouse mobile score | غير معلوم | > 90 | — | — |

---

## 💼 الأعمال (Business)

| KPI | Before | Target | Current | Status |
|-----|--------|--------|---------|--------|
| ZATCA submission success rate | غير معلوم | > 99% | — | — |
| Avg invoice processing time | غير معلوم | < 2s | — | — |
| Payroll run time (1000 employees) | غير معلوم | < 5min | — | — |
| Period close time | غير معلوم | < 1 day | — | — |
| Bank reconciliation match rate | غير معلوم | > 95% | — | — |
| User satisfaction (NPS) | غير معلوم | > 50 | — | — |
| Active tenants | غير معلوم | growing | — | — |
| Avg tenant MAU | غير معلوم | > 5 | — | — |

---

## 📊 الوضع الإجمالي

```
الأمان:        ░░░░░░░░░░ 0% → 🎯 100%
المالية:        ░░░░░░░░░░ 5% → 🎯 100%
الذكاء:         ██░░░░░░░░ 30% → 🎯 100%
الـ Workflow:   █░░░░░░░░░ 15% → 🎯 100%
الـ API:        ███░░░░░░░ 35% → 🎯 100%
الـ Frontend:   █████░░░░░ 50% → 🎯 100%
الـ Infra:      ████░░░░░░ 45% → 🎯 100%
الاختبار:       ███░░░░░░░ 35% → 🎯 100%
                ────────────
الإجمالي:       ███░░░░░░░ 27%
```

---

## 🔄 آلية التحديث

- **يومياً:** Standup sync (مهام مكتملة)
- **أسبوعياً:** تحديث KPIs في هذا الملف
- **شهرياً:** Retrospective + إعادة تقييم الأهداف
- **بعد كل milestone:** Review + رفع التقدّم لـ Stakeholders

---

## 🎯 توصيات للقياس

1. **استخدم Datadog/Grafana** لـ real-time metrics
2. **PostHog** لـ Product Analytics
3. **Codecov** لـ Coverage Tracking
4. **LangSmith** لـ AI Metrics
5. **GitHub Insights** لـ DevOps Metrics

كل KPI يجب أن يكون:
- **قابل للقياس** (Measurable)
- **محدد بالوقت** (Time-bound)
- **مع threshold واضح** (Threshold)

