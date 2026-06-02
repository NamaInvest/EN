# Autopilot Comprehensive Repair Plan - Nama Invest ERP

هذا الملف يحتوي على قائمة المشاكل التي تم تحديدها وتصنيفها بناءً على الفحص الشامل للمشروع.

---

## جدول تصنيف المشاكل

| ID | Area | File | Problem | Severity | Risk | Safe to Auto-Fix | Requires Approval | Recommended Action | Status |
|---|---|---|---|---|---|---|---|---|---|
| **ISS-01** | TypeScript Test Configuration | [tsconfig.json](file:///d:/namasoft9-3-main/tsconfig.json), [tsconfig.test.json](file:///d:/namasoft9-3-main/tsconfig.test.json) | Deprecation warning TS5107 under TS 6.x causing ts-jest failure in test suites. | P2_HIGH | LOW | YES | NO | Add `"ignoreDeprecations": "6.0"` to compilerOptions. | **COMPLETED** |
| **ISS-02** | ESLint Code Quality | Multiple test & legacy files | 9,047 `@typescript-eslint/no-explicit-any` errors due to strict lint rules on tests. | P3_MEDIUM | HIGH | NO | YES | Add ESLint rule overrides for the test folder to allow any type casts in mock files. | **DEFERRED** |
| **ISS-03** | Static analysis / WMS | [cloud-storage.ts](file:///d:/namasoft9-3-main/src/lib/cloud-storage.ts) | Turbopack build warning due to dynamic fs require pattern in uploads directory. | P4_LOW | LOW | NO | YES | Refactor directory resolution to use static scoping path joins. | **DEFERRED** |
