# Namasoft ERP — Complete Requirements Pack

> الحزمة الشاملة. كل بند فيه: **الحالة الحالية** + **Ready Prompt** + **سيناريو** + **Data Flow**.
> اقرأ هذا الفهرس أولاً ثم افتح أي بند تريد تنفيذه.

## الفهرس الكامل

### المجموعة A — AI Layer
| # | البند | الملف |
|--:|---|---|
| 1 | Prompt Engineering + System Prompt + Context | [A1-prompts.md](A1-prompts.md) |
| 2 | Workflow & Orchestration (LangChain / Chaining) | [A2-workflow.md](A2-workflow.md) |
| 3 | Vector DB / RAG / Data & Storage | [A3-vector-rag.md](A3-vector-rag.md) |

### المجموعة B — Backend
| # | البند | الملف |
|--:|---|---|
| 4 | Backend / Logic / API | [B1-backend.md](B1-backend.md) |
| 5 | Database ERD | [B2-erd.md](B2-erd.md) |
| 6 | API Specifications (OpenAPI) | [B3-openapi.md](B3-openapi.md) |

### المجموعة C — Frontend
| # | البند | الملف |
|--:|---|---|
| 7 | Frontend / UI-UX | [C1-frontend.md](C1-frontend.md) |
| 8 | Wireframes & Mockups (+ Shutterstock assets) | [C2-wireframes.md](C2-wireframes.md) |
| 9 | Style Guide / Design System | [C3-style-guide.md](C3-style-guide.md) |
| 10 | i18n Translation Files | [C4-i18n.md](C4-i18n.md) |

### المجموعة D — Infrastructure
| # | البند | الملف |
|--:|---|---|
| 11 | Infrastructure / DevOps / CI/CD | [D1-infra.md](D1-infra.md) |
| 12 | Deployment Plan | [D2-deployment.md](D2-deployment.md) |
| 13 | Security Plan | [D3-security.md](D3-security.md) |

### المجموعة E — Testing
| # | البند | الملف |
|--:|---|---|
| 14 | Testing & QA (Unit + Integration) | [E1-testing.md](E1-testing.md) |
| 15 | Test Cases & Test Plan | [E2-test-cases.md](E2-test-cases.md) |

### المجموعة F — Documentation
| # | البند | الملف |
|--:|---|---|
| 16 | Architecture Document | [F1-architecture.md](F1-architecture.md) |
| 17 | Business Flows | [F2-business-flows.md](F2-business-flows.md) |
| 18 | User Stories & Acceptance Criteria | [F3-user-stories.md](F3-user-stories.md) |

### المجموعة G — Content & Compliance
| # | البند | الملف |
|--:|---|---|
| 19 | Sample Data / Seeders | [G1-seeders.md](G1-seeders.md) |
| 20 | Migration Scripts | [G2-migration.md](G2-migration.md) |
| 21 | User Manual | [G3-user-manual.md](G3-user-manual.md) |
| 22 | Training Videos | [G4-training.md](G4-training.md) |
| 23 | Legal & Compliance Docs | [G5-legal.md](G5-legal.md) |

## كيف تستخدم هذه الحزمة

1. **اختر بند** من الفهرس
2. **افتح ملفه** — ستجد:
   - **الحالة الحالية** (ما المتوفر فعلاً في المشروع)
   - **الفجوة** (ما الناقص مقارنة بالأنظمة العالمية)
   - **Ready Prompt** (انسخه والصقه في Claude Code)
   - **سيناريو** (مثال عملي)
   - **Data Flow** (تتبع البيانات)
3. **نفّذ الـ Prompt** أو احفظه للجلسة التالية

## ترتيب التنفيذ الموصى به (حسب الـ ROI)

| الأولوية | البند | الجهد | القيمة |
|:--:|---|--:|:--:|
| 1 | ERD آلي (B2) | 30د | 🟢🟢🟢 |
| 2 | OpenAPI Postman+SDK (B3) | 30د | 🟢🟢 |
| 3 | i18n Scanner (C4) | 15د | 🟢🟢 |
| 4 | User Stories Consolidation (F3) | ساعتين | 🟢🟢 |
| 5 | Seeders قطاعية (G1) | يومين | 🟠🟠 |
| 6 | Wireframes via Stitch (C2) | يوم | 🟠 |
| 7 | Test Coverage Backfill (E1+E2) | 3 أيام | 🔴🔴 |
| 8 | Migration Scripts (G2) | 3 أيام | 🟠 |
| 9 | User Manuals لكل دور (G3) | يومين | 🟠 |
| 10 | Training Videos (G4) | أسبوع | 🔴 |
| 11 | Legal Pack (G5) | محامي + 3 أيام | 🟠 |
