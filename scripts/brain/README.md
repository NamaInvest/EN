# Brain Governance Scripts

مجموعة سكربتات TypeScript المحلية والآمنة بالكامل والمخصصة لإدارة وتوثيق وحوكمة ذاكرة المشروع الموحدة `.ai-brain/` بنظام **Nama Invest ERP**.

---

## 📌 فلسفة الأمان والقوانين الصارمة
1. **القراءة فقط أولاً (Read-Only First)**: تمنع السكربتات تماماً أي صلاحية للكتابة أو التعديل على الكود التشغيلي `src/` أو المخططات `prisma/` أو لمس خوادم الإنتاج والعمليات الحية.
2. **منع الأسرار وكشفها**: يحظر تماماً استعلام أو فحص ملفات `.env` أو مفاتيح الاتصال المشفرة.
3. **الحوكمة المدعومة بالأدلة**: لا يتم ترقية أي حالة أو فجوة دون ربطها بالتصنيفات المعتمدة.

---

## 🏃‍♀️ سجل وطريقة تشغيل السكربتات المبرمجة

يتم تشغيل السكربتات باستخدام الأداة `tsx` مسبقة التثبيت بقاعدة الأدوات:

### 1. التحقق من اتساق مستندات الذاكرة البرمجية
```bash
npx tsx scripts/brain/check-brain-consistency.ts
```
ينتج عن التشغيل فحص وجود الملفات الـ 20 وتوليد تقرير اتساق كامل `BRAIN_CONSISTENCY_REPORT.md`.

### 2. التحقق من تصنيفات الأدلة وصحة الصياغة
```bash
npx tsx scripts/brain/validate-evidence-tags.ts
```
ينتج عن التشغيل التحقق من مطابقة الكلمات للتصنيفات الرسمية المعتمدة وتصدير تقرير `BRAIN_EVIDENCE_VALIDATION_REPORT.md`.

### 3. أتمتة حوكمة التقارير التاريخية دون حذفها
```bash
npx tsx scripts/brain/archive-old-reports.ts
```
ينتج عن التشغيل فهرسة وتوثيق التقارير وتوليد `OLD_REPORTS_ARCHIVE_INDEX.md` لمنع التضارب.

### 4. تحديث سجل الأدلة والفهارس عبر سطر الأوامر (CLI)
```bash
npx tsx scripts/brain/update-evidence-index.ts --title "CREATE_BRAIN_GOVERNANCE_SCRIPTS_REPORT" --path "CREATE_BRAIN_GOVERNANCE_SCRIPTS_REPORT.md" --purpose "Brain governance scripts bootstrap" --status "STRUCTURE_VERIFIED_ONLY"
```

### 5. تحديث وإدراج قرارات معمارية جديدة للـ ADRs
```bash
npx tsx scripts/brain/update-decision-log.ts --id "ADR-BRAIN-001" --title "Brain Governance Scripts Bootstrap" --status "IMPLEMENTED"
```

### 6. تحديث سجل وحصر الفجوات الهيكلية والتشغيلية
```bash
npx tsx scripts/brain/update-gap-register.ts --id "GP-BRAIN-001" --gap "Brain governance scripts missing" --priority "P1_HIGH" --status "CLOSED"
```

### 7. تحديث سجل وتخفيف المخاطر النشطة
```bash
npx tsx scripts/brain/update-risk-register.ts --id "RK-BRAIN-001" --risk "AI brain inconsistency could mislead agents" --severity "MEDIUM" --status "OPEN"
```

### 8. تحديث بوابات ومستويات الموافقات الصارمة
```bash
npx tsx scripts/brain/update-approval-gates.ts --gate "GO_FOR_SAFE_READ_ONLY_MCP_FOUNDATION_ONLY" --purpose "Enable first-wave read-only MCP foundation"
```

### 9. تحديث ملف الحالة الحالية النشط للمشروع
```bash
npx tsx scripts/brain/update-current-state.ts
```
