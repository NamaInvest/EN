# 19 - سجل وفهارس الأدلة والقرائن البرمجية (Evidence Index)

> **آخر تحديث:** 2026-06-02 | **سجل توثيق التقارير والأدلة البرمجية المعتمدة** | **ثابت معتمد**

---

## 📌 فلسفة سجل الأدلة (Evidence-Based Philosophy)
في مشروع **Nama Invest ERP** المالي ذو الحساسية الفائقة، يُحظر إعلان اكتمال أو جاهزية أي ميزة أو موديول أو ملف بشكل نظري أو إنشائي. يجب إرفاق الدليل البرمجي والتشغيلي الملموس والمثبت مباشرة من نتائج تشغيل الأوامر والاختبارات الحية، وتسجيل مسار وموقع التقارير في هذا السجل كمرجع وحيد معتمد ومحايد.

---

## 📊 فهرس وسجل التقارير والأدلة المعتمدة للمشروع (Evidence Index)

يتم تنظيم ومراقبة كافة تقارير الجلسات وفحوصات الجودة والأمان وفقاً للجدول المرجعي التالي:

| تاريخ الإصدار | كود واسم التقرير المعتمد | مسار الملف البرمجي للتقرير (Relative Path) | الغرض الجوهري والفائدة التشغيلية للتقرير | تصنيف الحالة المعتمدة للتقرير |
| ------------- | ------------------------ | ------------------------------------------ | ---------------------------------------- | ----------------------------- |
| 2026-06-02 | `GLOBAL_READINESS_MASTER_BASELINE` | `GLOBAL_READINESS_MASTER_BASELINE.md` (Artifact) | تأسيس وحصر Baseline الجاهزية العالمية الشامل للمراحل الـ 13 وتحديث `.ai-brain`. | `TEMPORARY_EVIDENCE_BASELINE` |
| 2026-06-02 | `FULL_TEST_SUITE_AND_COVERAGE_BASELINE_REPORT` | `FULL_TEST_SUITE_AND_COVERAGE_BASELINE_REPORT.md` (Artifact) | تسجيل نتائج تشغيل فحوصات الجودة الحية اللحظية (tsc, eslint, jest, vitest). | `TEMPORARY_EVIDENCE_BASELINE` |
| 2026-06-02 | `FULL_SYSTEM_FILE_AUDIT_REPORT_V3_1_FINAL_EVIDENCE_BASELINE` | `FULL_SYSTEM_FILE_AUDIT_REPORT_V3_1_FINAL_EVIDENCE_BASELINE.md` (Artifact) | تنظيف صياغة وتصنيفات تقرير التدقيق العام وتحويله لـ Baseline معتمد ومحايد. | `TEMPORARY_EVIDENCE_BASELINE` |
| 2026-06-02 | `TEST_INFRA_FIX_PLAN` | `TEST_INFRA_FIX_PLAN.md` (Artifact) | خطة المعالجة وإصلاح تعارضات TypeScript وتجميع اختبارات Jest وتعارض Vitest. | `PROPOSED_PLAN` |
| 2026-06-02 | `MCP_AND_SKILLS_ACCELERATION_PLAN` | `MCP_AND_SKILLS_ACCELERATION_PLAN.md` (Workspace root) | خطة تسريع تطوير وجودة ERP بالاعتماد على خوادم MCP والـ AI Skills والـ Add-ons. | `PLAN_ONLY` |
| 2026-06-02 | `SAFE_READ_ONLY_MCP_AND_SKILLS_BOOTSTRAP_PLAN` | `SAFE_READ_ONLY_MCP_AND_SKILLS_BOOTSTRAP_PLAN.md` (Workspace root) | خطة التهيئة الآمنة للقرءة فقط لخوادم الـ MCP وتصميم الـ Skills والسكربتات. | `PLAN_ONLY` |
| 2026-06-02 | `NAMA_AI_SKILLS_BOOTSTRAP` | `.skills/**/SKILL.md` | إنشاء ملفات الـ AI Skills المخصصة لضبط وضبط عمل الوكيل قبل الـ MCP. | `STRUCTURE_VERIFIED_ONLY` |
| 2026-06-02 | `CREATE_SKILL_FILES_REPORT` | `CREATE_SKILL_FILES_REPORT.md` (Workspace root) | تقرير مرحلة إنشاء ملفات الـ AI Skills بالكامل للمستودع الموحد. | `PLAN_SAFE_IMPLEMENTATION` |
| 2026-06-02 | `BRAIN_GOVERNANCE_SCRIPTS_BOOTSTRAP` | `scripts/brain/**` | السكربتات المحلية الآمنة لأتمتة وتوطيد اتساق ذاكرة المشروع الموحدة. | `STRUCTURE_VERIFIED_ONLY` |
| 2026-06-02 | `CREATE_BRAIN_GOVERNANCE_SCRIPTS_REPORT` | `CREATE_BRAIN_GOVERNANCE_SCRIPTS_REPORT.md` (Workspace root) | تقرير مرحلة إنشاء السكربتات المحلية لحوكمة الذاكرة البرمجية. | `STRUCTURE_VERIFIED_ONLY` |
| 2026-06-01 | `BRAIN_CONSISTENCY_REPORT` | `BRAIN_CONSISTENCY_REPORT.md` | Consistency report for brain files and skills | `STRUCTURE_VERIFIED_ONLY` |
| 2026-06-01 | `BRAIN_EVIDENCE_VALIDATION_REPORT` | `BRAIN_EVIDENCE_VALIDATION_REPORT.md` | Validation report for evidence tags in brain files | `STRUCTURE_VERIFIED_ONLY` |
| 2026-06-01 | `TSCONFIG_TEST_JSON` | `tsconfig.test.json` | Isolated test configuration resolving TS5011 compiler error | `VERIFIED_BY_CODE` |
| 2026-06-01 | `BRAIN_UPDATE_LOG` | `BRAIN_UPDATE_LOG.md` | Execution log for safe read-only MCP foundation updates | `STRUCTURE_VERIFIED_ONLY` |
| 2026-06-01 | `BRAIN_GOVERNANCE_YML` | `.github/workflows/brain-governance.yml` | Automated CI/CD memory audit pipeline | `VERIFIED_BY_CODE` |
| 2026-06-02 | `SECRET_SCAN_REPORT` | `SECRET_SCAN_REPORT.md` | تقرير مسح الأسرار المدقق برمجياً مع حجب كامل للمخرجات الحساسة. | `VERIFIED_BY_REPORT` |
| 2026-06-02 | `PRISMA_SCHEMA_AUDIT_REPORT` | `PRISMA_SCHEMA_AUDIT_REPORT.md` | تقرير تدقيق مخطط قاعدة البيانات (Wave 2) ورصد الدقة والـ soft-deletes. | `VERIFIED_BY_SCHEMA` |
| 2026-06-02 | `FULL_AI_BRAIN_INVENTORY_REPORT` | `FULL_AI_BRAIN_INVENTORY_REPORT.md` | تقرير جرد وتصنيف كافة ملفات الذاكرة الـ 85 بالكامل برمجياً. | `VERIFIED_BY_COMMAND` |
| 2026-06-02 | `SAFE_MCP_FOUNDATION_VERIFICATION_REPORT` | `SAFE_MCP_FOUNDATION_VERIFICATION_REPORT.md` | تقرير التحقق من بوابات ومسارات الـ MCP وقائمة الحظر والأمان. | `VERIFIED_BY_CODE` |
| 2026-06-02 | `SECURITY_SCANNERS_SETUP_REPORT` | `SECURITY_SCANNERS_SETUP_REPORT.md` | تقرير تدقيق وتوثيق فجوات أدوات الأمان وفاحص الأمان المحلي البديل. | `VERIFIED_BY_COMMAND` |
| 2026-06-02 | `SECRET_SCAN_READINESS_REPORT` | `SECRET_SCAN_READINESS_REPORT.md` | تقرير جاهزية الأسرار وتأمين بيانات ZATCA التجريبية في المستودع. | `VERIFIED_BY_COMMAND` |
| 2026-06-02 | `DEPENDENCY_AUDIT_REPORT` | `DEPENDENCY_AUDIT_REPORT.md` | تقرير تدقيق الحزم ورصد ثغرات npm audit والـ critical xmldom. | `VERIFIED_BY_COMMAND` |
| 2026-06-02 | `SECURITY_TOOLING_GAP_REPORT` | `SECURITY_TOOLING_GAP_REPORT.md` | تقرير فجوات أدوات الأمان وحل الفحوصات المحلية الآمنة. | `VERIFIED_BY_COMMAND` |
| 2026-06-02 | `CI_WORKFLOW_AUDIT_REPORT` | `CI_WORKFLOW_AUDIT_REPORT.md` | تقرير تدقيق سير عمل الـ CI/CD للتكامل والنشر والتراجع التلقائي. | `VERIFIED_BY_COMMAND` |
| 2026-06-02 | `TYPECHECK_RAW_OUTPUT_SUMMARY` | `docs/reports/TYPECHECK_RAW_OUTPUT_SUMMARY.md` | Raw TypeScript command evidence | `VERIFIED_BY_COMMAND` |
| 2026-06-02 | `PRISMA_VALIDATE_RAW_OUTPUT_SUMMARY` | `docs/reports/PRISMA_VALIDATE_RAW_OUTPUT_SUMMARY.md` | Raw Prisma schema validation evidence | `VERIFIED_BY_SCHEMA` |
| 2026-06-02 | `JEST_RAW_OUTPUT_SUMMARY` | `docs/reports/JEST_RAW_OUTPUT_SUMMARY.md` | Raw Jest unit test evidence | `VERIFIED_BY_TEST` |
| 2026-06-02 | `VITEST_RAW_OUTPUT_SUMMARY` | `docs/reports/VITEST_RAW_OUTPUT_SUMMARY.md` | Raw Vitest/coverage evidence | `VERIFIED_BY_TEST` |
| 2026-06-02 | `COVERAGE_SUMMARY_FILE_EVIDENCE` | `docs/reports/COVERAGE_SUMMARY_FILE_EVIDENCE.md` | Coverage summary file metadata evidence | `VERIFIED_BY_REPORT` |
| 2026-06-02 | `FULL_TEST_RAW_EVIDENCE_REPORT` | `FULL_TEST_RAW_EVIDENCE_REPORT.md` | Consolidated raw evidence report | `VERIFIED_BY_REPORT` |
| 2026-06-02 | `TEST_FAILURE_ANALYSIS_REPORT` | `docs/reports/TEST_FAILURE_ANALYSIS_REPORT.md` | Comprehensive analysis of Vitest tenant-isolation test failure | `VERIFIED_BY_COMMAND` |
| 2026-06-02 | `PRODUCTION_HEALTH_RAW_EVIDENCE_REPORT` | `docs/reports/PRODUCTION_HEALTH_RAW_EVIDENCE_REPORT.md` | تقرير الفحص صامتاً وقراءة فقط لصحة واستجابة قاعدة البيانات ومؤشرات عتاد النظام. | `VERIFIED_BY_COMMAND` |
| 2026-06-02 | `PRODUCTION_READINESS_AND_ROLLBACK_REVIEW` | `docs/reports/PRODUCTION_READINESS_AND_ROLLBACK_REVIEW.md` | تقرير المراجعة والتدقيق الشامل لجاهزية النشر ومخططات التراجع وخطة الطوارئ. | `VERIFIED_BY_REPORT` |
| 2026-06-02 | `PRODUCTION_READINESS_SCORECARD` | `docs/reports/PRODUCTION_READINESS_SCORECARD.md` | بطاقة تقييم جاهزية الإنتاج النهائية الموحدة لـ 11 محوراً فنياً وتمريرها حياً بنسبة 100%. | `VERIFIED_BY_REPORT` |
| 2026-06-02 | `BACKUP_RESTORE_DRILL_PLAN` | `docs/reports/BACKUP_RESTORE_DRILL_PLAN.md` | دليل وخطة تمرين استعادة البيانات المتعددة المستأجرين وإدارة سيناريوهات الكوارث والـ Rollback. | `VERIFIED_BY_REPORT` |
| 2026-06-02 | `OBSERVABILITY_ALERTING_SETUP_PLAN` | `docs/reports/OBSERVABILITY_ALERTING_SETUP_PLAN.md` | خطة وتصميم أنظمة المراقبة والنبض الصحي وقواعد التنبيه الـ 18 الإلزامية و 10 كتيبات Runbooks. | `VERIFIED_BY_REPORT` |
| 2026-06-02 | `OBSERVABILITY_ALERTING_SETUP_REVIEW` | `docs/reports/OBSERVABILITY_ALERTING_SETUP_REVIEW.md` | تقرير المراجعة والتدقيق الفني المعماري الشامل لقواعد التنبيه الـ 18 وكتيبات Runbooks ولوحات الرصد. | `VERIFIED_BY_REPORT` |
| 2026-06-02 | `OBSERVABILITY_ALERTING_SETUP_IMPLEMENTATION_PLAN` | `docs/reports/OBSERVABILITY_ALERTING_SETUP_IMPLEMENTATION_PLAN.md` | مخطط وتصميم بنية المراقبة والتنبيهات المتقدمة وتصميم الجسور البرمجية الأربعة. | `VERIFIED_BY_REPORT` |
| 2026-06-02 | `OBSERVABILITY_ALERTING_SETUP_IMPLEMENTATION_REPORT` | `docs/reports/OBSERVABILITY_ALERTING_SETUP_IMPLEMENTATION_REPORT.md` | تقرير إتمام التطوير والدمج للجسور والحلول التشغيلية للمراقبة بنجاح وأمان كامل. | `VERIFIED_BY_REPORT` |
| 2026-06-02 | `OBSERVABILITY_ALERTING_SETUP_LOCAL_VERIFICATION` | `docs/reports/OBSERVABILITY_ALERTING_SETUP_LOCAL_VERIFICATION.md` | تقرير التحقق المحلي المتقدم لأنظمة المراقبة ونجاح اختبارات تكامل عزل المستأجرين بنسبة 100%. | `VERIFIED_BY_REPORT` |








---

## 🛡️ قواعد وتصنيفات قوة الأدلة (Evidence Strength Standards)
يتم تصنيف قوة الدليل والقرائن في التقارير البرمجية كلياً لواحد من المستويات الصارمة التالية:
1. **`VERIFIED_BY_CODE`**: الدليل مستند لقراءة مباشرة وفحص دقيق للكود المصدري الفعلي للمشروع في الجلسة الحالية.
2. **`VERIFIED_BY_SCHEMA`**: الدليل مستند لمطابقة هيكلية مباشرة ومثبتة في مخططات قاعدة البيانات `prisma/schema.prisma`.
3. **`VERIFIED_BY_TEST`**: الدليل مستند لنتيجة تشغيل اختبار آلي ناجح ومثبت في بيئة الفحوصات الجارية.
4. **`VERIFIED_BY_COMMAND`**: الدليل مستند لمخرجات تشغيل أوامر النظام مباشرة وسجلات سطر الأوامر الفعلي.
5. **`CLAIMED_ONLY` / `NOT_VERIFIED`**: معلومات مرسلة أو مسجلة نظرياً دون توفر قرائن برمجية أو تشغيلية حية تثبت صحتها، وتتطلب فحصاً لاحقاً ومستقلاً.
