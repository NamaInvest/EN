# Agent Scan & Plan Report — F-08 Subledger Accounting (SLA) & Central Auto-Journalization Engine

## 1. الملفات التي قرأتها (Files Scanned)
- [PROJECT_BRAIN.md](file:///d:/namasoft9-3-main/PROJECT_BRAIN.md) (Root Reference)
- [AI_PROJECT_MEMORY.md](file:///d:/namasoft9-3-main/AI_PROJECT_MEMORY.md) (Modernization Log)
- [LIVE_GAP_ANALYSIS.md](file:///d:/namasoft9-3-main/LIVE_GAP_ANALYSIS.md) (Semantic Audit Gaps)
- [project-governance/03-FINANCIAL_INVARIANTS.md](file:///d:/namasoft9-3-main/project-governance/03-FINANCIAL_INVARIANTS.md) (Ledger Laws)
- [MASTER_ROADMAP_TO_GLOBAL.md](file:///d:/namasoft9-3-main/MASTER_ROADMAP_TO_GLOBAL.md) (Roadmap)
- [deploy.js](file:///d:/namasoft9-3-main/deploy.js) (Deploy Utility)

## 2. تصنيف ملفات دليل العمل المحلي (Worktree Classification)
*   **ملفات آمنة ومقصودة**:
    *   `deploy.js`: دعم `SSH_KEY_PATH` الخارجي لمنع ارتكاب المفتاح الخاص.
    *   `.gitignore`: استبعاد ملفات المخططات والأسرار المحلية.
*   **ملفات خارج النطاق (مرشحة للمرحلة القادمة F-08)**:
    *   `src/app/api/purchases/route.ts`: مسودة كود معالجة فواتير الشراء.
    *   `src/lib/auto-journal.ts`: مسودة التوزيع التلقائي للقيود.
    *   `src/lib/services/subledger-accounting.ts`: خدمة المحاسبة الفرعية المساعدة المقترحة.

## 3. الفجوات المالية الحالية والمرحلة المقترحة
*   **المرحلة الموصى بها**: **F-08 — Subledger Accounting (SLA) & Central Auto-Journalization Engine**.
*   **الأهمية**: فصل منطق كتابة القيود وتوحيده في مكان واحد لضمان مطابقة الـ invariants المحاسبية لـ SOCPA ومنع تكرار الكود.

## 4. ضمانات السلامة الحالية (Strict Assurances)
```text
SCAN_AND_PLAN_ONLY: True
NO_CODE_CHANGE: True
NO_COMMIT: True
NO_PUSH: True
NO_DEPLOY: True
NO_DB_CHANGE: True
NO_ENV_CHANGE: True
NO_PRODUCTION_TOUCH: True
NO_LIVE_FINANCIAL_POSTING: True
```
