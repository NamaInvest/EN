# 📚 Namasoft ERP — Documentation Index

> **آخر تحديث:** 2026-05-10
> **حالة:** Active — يُحدّث مع كل ميزة كبيرة

هذا الدليل المرجعي الكامل. ابدأ من هنا. اللغة: عربي (السرد) + إنجليزي (المصطلحات التقنية).

---

## 🏛️ 1. Architecture (المعمارية)

| Doc | Use when |
|-----|---------|
| [System Overview](./architecture/system-overview.md) | تحتاج صورة كاملة (C4) |
| [Multi-Tenant Architecture](./architecture/multi-tenant.md) ⭐ | أي ميزة تخص العزل، الـ tenant، الـ DB routing |
| [Module Map (104)](../104_modules_checklist.md) | فحص الوحدات الموجودة/الناقصة |
| [Master Roadmap to Global](../MASTER_ROADMAP_TO_GLOBAL.md) | قرارات استراتيجية |
| [Gap Analysis (Global ERP)](../GLOBAL_ERP_GAP_ANALYSIS.md) | فجوات مقارنة بـ SAP/Oracle |

---

## 💾 2. Database (قاعدة البيانات)

| Doc | Use when |
|-----|---------|
| [ERD Overview](./database/erd.md) | فهم العلاقات بين 157 نموذج |
| [Migration Strategy](./migrations/migration-strategy.md) | قبل أي migration |
| [Seed Data & Sample Data](./data/seed-data.md) | تهيئة tenant جديد، أو بيانات اختبار |
| [Prisma schema](../prisma/schema.prisma) | source of truth |

---

## 🔌 3. APIs

| Doc | Use when |
|-----|---------|
| [API Specifications](./api/openapi-summary.md) | تطوير integration / SDK |
| [Generated OpenAPI 3.1](../openapi.json) | machine-readable spec |
| Swagger UI | `https://{tenant}.namasoft.app/api/docs/ui` |

---

## 🤖 4. AI & Workflows

| Doc | Use when |
|-----|---------|
| [Prompt Engineering](./ai/prompt-engineering.md) | كتابة/تعديل system prompt، tool-calling، LangChain |
| [RAG Architecture](./ai/rag-architecture.md) | إضافة مصدر معرفي، vector store، embedding |

---

## 🎨 5. Frontend / UX

| Doc | Use when |
|-----|---------|
| [Style Guide / Design System](./ux/style-guide.md) | بناء component جديد |
| [Wireframes & Mockups](./ux/wireframes.md) | قبل تصميم شاشة |
| [i18n Translation Plan](./i18n/translation-plan.md) | إضافة لغة، نص جديد، RTL/LTR |

---

## 🛡️ 6. Security & Compliance

| Doc | Use when |
|-----|---------|
| [Security Plan](./security/security-plan.md) | threat model، RBAC، secrets |
| [Legal & Compliance](./legal/compliance.md) | ZATCA, GOSI, WPS, PDPL, Saudi Labor Law |
| [HARDENING.md](../HARDENING.md) | السجل التاريخي للتحصين |

---

## 🚀 7. DevOps & Operations

| Doc | Use when |
|-----|---------|
| [Deployment Plan](./deployment/deployment-plan.md) | البنية التحتية، الإصدارات |
| [CI/CD Pipeline](./devops/cicd.md) | تعديل GitHub Actions، quality gates |
| [Hetzner DevOps Guide](../HETZNER_DEVOPS_POSTGRES_GUIDE.md) | Hetzner-specific operations |

---

## ✅ 8. Testing

| Doc | Use when |
|-----|---------|
| [Test Plan](./testing/test-plan.md) | كتابة test cases جديدة، coverage targets |
| [User Stories & AC](./user-stories/sample-user-stories.md) | acceptance criteria → test cases |

---

## 📖 9. Users & Manuals

| Doc | Use when |
|-----|---------|
| [Admin User Manual](./user-manual/admin-manual.md) | تدريب tenant_admin |
| [Business Flows Guide](../BUSINESS_FLOWS_GUIDE.md) | فهم الفلوهات (Q2C, P2P, ...) |
| [System Master Guide](../SYSTEM_MASTER_GUIDE.md) | دليل التشغيل الشامل |

---

## 🗂️ 10. Cross-cutting

| Doc | Purpose |
|-----|---------|
| [CLAUDE.md](../CLAUDE.md) | instructions for AI agents (Claude, etc.) |
| [README.md](../README.md) | project entry point |
| [ZATCA Guide](../ZATCA_GUIDE.md) | ZATCA-specific deep dive |

---

## 📍 خارطة الميزات الناقصة (Gaps to fill)

| Gap | Priority | File to add |
|-----|----------|-------------|
| ERD per domain (Mermaid) | 🟠 | `docs/database/erd-{module}.mmd` |
| Runbooks (failover, ZATCA down, ...) | 🟠 | `docs/runbooks/*.md` |
| Per-module manuals (purchases, inventory, ...) | 🟡 | `docs/user-manual/{module}-manual.md` |
| Wireframes for missing modules | 🟡 | `docs/ux/wireframes/*.png` |
| Per-module backlog stories | 🟡 | `docs/user-stories/backlog/{module}.md` |
| Postman collection | 🟡 | `tools/postman/namasoft.postman_collection.json` |
| Training videos | 🟢 | `docs/training/` (script outlines first) |
| Privacy Policy & ToS final text | 🔴 | legal review required |

---

## 🔍 كيف تقرأ هذا الدليل (Reading Order)

### إذا كنت **مطوراً جديداً**:
1. [README.md](../README.md) → نظرة سريعة
2. [System Overview](./architecture/system-overview.md) → الصورة الكبيرة
3. [Multi-Tenant Architecture](./architecture/multi-tenant.md) → النموذج الأساسي
4. [API Specifications](./api/openapi-summary.md) → APIs
5. [CLAUDE.md](../CLAUDE.md) → القواعد الإلزامية
6. ابدأ ميزة من [Gap Analysis](../GLOBAL_ERP_GAP_ANALYSIS.md)

### إذا كنت **محاسباً / Compliance Officer**:
1. [Legal & Compliance](./legal/compliance.md)
2. [Business Flows Guide](../BUSINESS_FLOWS_GUIDE.md)
3. [Admin Manual](./user-manual/admin-manual.md)

### إذا كنت **DevOps**:
1. [Deployment Plan](./deployment/deployment-plan.md)
2. [CI/CD Pipeline](./devops/cicd.md)
3. [Security Plan](./security/security-plan.md)
4. [Migration Strategy](./migrations/migration-strategy.md)

### إذا كنت **مصمم UI/UX**:
1. [Style Guide](./ux/style-guide.md)
2. [Wireframes](./ux/wireframes.md)
3. [i18n Plan](./i18n/translation-plan.md)

### إذا كنت **AI Agent (Claude / GPT)**:
1. [CLAUDE.md](../CLAUDE.md) — قواعد إلزامية
2. هذا الـ INDEX
3. [Multi-Tenant Architecture](./architecture/multi-tenant.md)
4. [Gap Analysis](../GLOBAL_ERP_GAP_ANALYSIS.md)
5. [Prompt Engineering](./ai/prompt-engineering.md)

---

## 🤝 المساهمة في التوثيق

```
1. عدّل الملف المعني (لا تنشئ ملفات جديدة بدون داعٍ)
2. اربط الملف الجديد من INDEX.md (هنا)
3. حدّث "آخر تحديث" في رأس الملف
4. PR + reviewer من الـ codeowners
```

---

## 📞 جهات الاتصال (Maintainers)

- **Architecture:** الفريق الهندسي الأساسي
- **Compliance:** DPO + Compliance Officer
- **Security:** CISO (or designated)
- **DevOps:** SRE rotation

---

**نهاية الـ Index. جميع الوثائق فوق هي SoT (Source of Truth) لمجالاتها.**
