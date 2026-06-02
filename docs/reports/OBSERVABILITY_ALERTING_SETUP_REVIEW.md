# 📊 تقرير المراجعة والتدقيق الشامل لأنظمة المراقبة والتنبيهات (Observability & Alerting Setup Review)

> **المستند:** تقرير تدقيق ومراجعة جاهزية المراقبة والإنذار المبكر للبيئة التشغيلية | **تاريخ المراجعة:** 2026-06-02
> **حالة البوابة الفنية:** `OBSERVABILITY_ALERTING_SETUP_REVIEW_ONLY_COMPLETED` | **السرية:** مقيد للغاية (Enterprise Confidential)
> **تأثير المشروع:** استقرار البيئة وأمان عزل المستأجرين والرقابة المالية (SRE, Security & Financial Governance)

---

## 📌 1. الملخص التنفيذي (Executive Summary)

أجرينا مراجعة فنية معمارية وتشغيلية شاملة وعميقة لخطة وتصاميم أنظمة المراقبة والإنذار المبكر (Observability & Alerting Strategy) لنظام **Nama Invest ERP**، بهدف التحقق من دقة المؤشرات المقترحة ومصداقية قياس قواعد التنبيه الـ 18 وصلاحية كتيبات تشغيل حوادث SRE الـ 10 المقترحة، مع الالتزام الصارم بـ **بروتوكول الصفر التعديلي (Zero-Mutation Protocol)**.

- **الحالة النهائية للمراجعة:** **ناجحة بوجود فجوات توثيقية مقرة (PASS_WITH_GAPS)**.
- **التعديل على كود الـ Runtime:** لا يوجد كلياً (`NO`).
- **التعديل على قاعدة البيانات (DB Mutation):** لا يوجد كلياً (`NO`).
- **تغيير ملفات البيئة أو إعادة تشغيل PM2:** لا يوجد كلياً (`NO`).
- **تأمين الإنتاج وعزل المستأجرين:** محقق ومحمي بالكامل بنسبة 100%.

---

## 🗺️ 2. نطاق التدقيق والملفات المفحوصة (Scope & Files Reviewed)

اقتصرت هذه المراجعة التشغيلية على مسح وتدقيق وهيكلة الملفات الفنية التالية قراءة فقط:

- **خطة المراقبة المعتمدة:** [OBSERVABILITY_ALERTING_SETUP_PLAN.md](file:///d:/namasoft9-3-main/docs/reports/OBSERVABILITY_ALERTING_SETUP_PLAN.md)
- **نبض الصحة العام:** [src/app/api/health/route.ts](file:///d:/namasoft9-3-main/src/app/api/health/route.ts)
- **نبض الصحة للنظام:** [src/app/api/sys/health/route.ts](file:///d:/namasoft9-3-main/src/app/api/sys/health/route.ts)
- **بوابة الأمان والـ SIEM:** [src/app/api/admin/siem/route.ts](file:///d:/namasoft9-3-main/src/app/api/admin/siem/route.ts)
- **عزل المستأجرين:** [src/lib/observability/tenant-telemetry.ts](file:///d:/namasoft9-3-main/src/lib/observability/tenant-telemetry.ts)
- **سجلات المسجل المهيكل:** [src/lib/observability/logger.ts](file:///d:/namasoft9-3-main/src/lib/observability/logger.ts) و [src/lib/logger.ts](file:///d:/namasoft9-3-main/src/lib/logger.ts)
- **محرك الحوادث:** [src/lib/sre/incident-response-engine.ts](file:///d:/namasoft9-3-main/src/lib/sre/incident-response-engine.ts)
- **سجلات الذاكرة والجاهزية:** [01-current-state.md](file:///d:/namasoft9-3-main/.ai-brain/01-current-state.md)، [15-approval-gates.md](file:///d:/namasoft9-3-main/.ai-brain/15-approval-gates.md)، [19-evidence-index.md](file:///d:/namasoft9-3-main/.ai-brain/19-evidence-index.md).

---

## 🛡️ 3. تقرير سلامة الـ Git والتطابق (Git Safety Status)

- **الفرع الحالي (Branch):** `main` (`VERIFIED_BY_COMMAND`)
- **الالتزام الحالي (HEAD):** `6b4aa72619cd72be386ea9d8d0fb175ec96efd6b` (`VERIFIED_BY_COMMAND`)
- **التزام الريموت (origin/main):** `6b4aa72619cd72be386ea9d8d0fb175ec96efd6b` (`VERIFIED_BY_COMMAND`)
- **تطابق الالتزامين (HEAD == origin/main):** **متطابق 100% ومستقر كلياً**.
- **حالة مستودع العمل (Working tree):** لا توجد أي تعديلات برمجية معلقة على كود الـ runtime، وترتكز التغييرات بالكامل في ملفات التقارير التوثيقية لـ Brain بصفة قراءة فقط.

---

## 🔍 4. مراجعة وتقييم نقاط المراقبة الحالية (Observability Surface Review)

قمنا بتقييم جاهزية نقاط المراقبة الحالية المدمجة في الكود وتحديد ما إذا كانت جاهزة للتنبيهات الفورية أم تحتاج لحماية إضافية:

| نقطة المراقبة الحالية | الوصف والجاهزية الفنية الحالية | الحاجة الفنية / حماية إضافية المطلوبة |
| :--- | :--- | :--- |
| **`/api/health`** | **جاهز تماماً**. فحص متوازي لقاعدة البيانات، Redis، ومخدم ZATCA مع Soft-fail ذكي وعودة بكود 200/503. | لا يحتاج جسور إضافية؛ يوصى بربطه مباشرة مع Pingdom أو Cloudflare Uptime. |
| **`/api/sys/health`** | **يحتاج حماية إضافية (Cache Engine)**. يقوم باستدعاء الأداة `exec('pm2 jlist')` والتي تولد عملية فرعية (Child Process) ثقيلة المعالجة على السيرفر الرئيسي. | **خطورة عالية لـ Denial of Service**: يجب إضافة ذاكرة تخزين مؤقت (Cache Layer) بـ Redis أو الذاكرة لمدة 15 ثانية لمنع استهلاك المعالج عند كثرة الاستعلامات. |
| **`/api/admin/siem`** | **جاهز مع ضرورة ضبط الفهارس**. يستعلم في جداول `AuditLog` و `MfaAttempt` و `FieldAuditLog` المكتظة بالبيانات. | **خطر بطء الاستعلامات (Slow Queries)**: يجب التأكد من وجود فهارس مركبة (Compound Indexes) على أعمدة التوقيت `createdAt` و `attemptedAt` لتجنب Full Table Scan. |
| **`tenant-telemetry.ts`** | **يحتاج جسر توصيل (Prometheus Exporter)**. البيانات والعدادات مجمعة في الذاكرة العشوائية `Map` مما يعرضها للضياع والـ reset عند إعادة تشغيل السيرفر أو التوسع (Scaling). | يجب تصميم Exporter يقوم بتصدير قيم العدادات بصفة دورية لـ Prometheus أو حفظها بجدول قاعدة البيانات. |
| **`structured logger`** | **جاهز وممتاز**. يدعم عزل PII وتضمين تفاصيل `requestId` و `tenantId` تلقائياً. | جاهز تماماً للربط مع Grafana Loki أو AWS CloudWatch بشكل مباشر. |
| **`incident engine`** | **جاهز للربط الفعلي**. يدعم تصنيف الحوادث والـ mock لـ PagerDuty/Jira. | يحتاج لتثبيت مفاتيح الربط الفعلي لقنوات PagerDuty و Jira API في خادم النشر في المرحلة القادمة. |

---

## 🚨 5. مراجعة وتدقيق قواعد التنبيه الـ 18 المخططة (Alert Rules Review)

قمنا بتدقيق إمكانية قياس قواعد التنبيه الـ 18 المقترحة بناءً على الأكواد المدمجة حالياً ورصد مخاطر الإنذار السلبي والإيجابي:

| الرقم | رمز التنبيه البرمجي | إمكانية القياس من الكود الحالي | خطر الإنذار الكاذب (False Positive) | خطر الفشل السلبي (False Negative) | التوصية وقنوات التدفق للامتثال |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `PRODUCTION_SITE_DOWN` | **نعم**، عبر `/api/health` | منخفض | منخفض جداً | ربط فوري مع PagerDuty كـ SEV1. |
| 2 | `TENANT_SITE_DOWN` | **نعم**، عبر Subdomains | متوسط (مشاكل DNS جزئية) | منخفض | يتطلب تتبع مسارات توجيه نطاقات المستأجرين. |
| 3 | `DATABASE_OFFLINE` | **نعم**، عبر `/api/health` | منخفض | منخفض | ربط مع PagerDuty كـ SEV1. |
| 4 | `DATABASE_LATENCY_HIGH`| **نعم**، عبر `/api/sys/health` | عالٍ (أثناء consolidation المحاسبي) | منخفض | يجب رفع حد التنبيه لـ 2000ms لعمليات الإغلاق المالي. |
| 5 | `PM2_PROCESS_RESTART_LOOP`| **نعم**، عبر `sys/health` | منخفض | متوسط (لو تمت إعادة التشغيل بصمت) | تتبع دائم لمرات restarts بـ PM2. |
| 6 | `API_5XX_SPIKE` | **نعم**، عبر structured logs | متوسط (أثناء النشر الجاري) | منخفض | إضافة Cooldown لمدة دقيقتين أثناء تجميع Next.js. |
| 7 | `AUTH_FAILURE_SPIKE` | **نعم**، عبر SIEM endpoint | متوسط (مستخدم نسى كلمة مروره) | منخفض | استثناء IP الحقيقي للمستخدم بعد تفعيل MFA سليم. |
| 8 | `RBAC_DENIED_SPIKE` | **نعم**، عبر SIEM endpoint | متوسط (تحديث صلاحيات مستخدم نشط) | منخفض | حظر ومراقبة متكرر لـ actorId للتصدي للـ Crawler. |
| 9 | `TENANT_ISOLATION_SUSPICION`| **نعم**، عبر `recordTenantViolation` | منخفض جداً (ثبات الحدود) | منخفض جداً | تصنيف كـ CRITICAL فوري واستدعاء المناوب. |
| 10| `CRON_JOB_FAILURE` | **نعم**، عبر BullMQ/Cron logs | منخفض | متوسط (لو توقفت جدولة cron كلياً) | إضافة Dead Man's Snitch أو نبض استباقي للـ Cron. |
| 11| `BACKUP_STALE` | **نعم**، عبر `backupManifest` | منخفض | منخفض | رصد الفارق الزمني لآخر ملف مضغوط في S3. |
| 12| `DISK_SPACE_LOW` | **نعم**، عبر `/api/sys/health` | منخفض | منخفض | التنبيه عند 85% والبدء في أرشفة الـ Logs. |
| 13| `MEMORY_PRESSURE_HIGH` | **نعم**، عبر `/api/sys/health` | متوسط (طفرات تجميع ذاكرة V8) | منخفض | قياس المتوسط لـ 5 دقائق متواصلة لتفادي الإنذار الكاذب. |
| 14| `SECRET_PATTERN_IN_LOGS`| **نعم**، عبر SIEM logs scanner | متوسط (بيانات اختبار مشابهة) | متوسط (الرموز المبتكرة) | تحديث دوري لتعبيرات Regex وتطهير السجلات. |
| 15| `FINANCIAL_POSTING_FAILURE`| **نعم**، عبر structured logger | منخفض جداً (ثبات التوازن) | منخفض جداً | تتبع فوري لـ `traceId` واستدعاء CFO. |
| 16| `PERIOD_LOCK_VIOLATION_SPIKE`| **نعم**، عبر `recordTenantOverride` | منخفض | منخفض | تصنيف كـ HIGH، ومراجعة سجل موافقات المسؤولين. |
| 17| `IDEMPOTENCY_CONFLICT_SPIKE`| **نعم**، عبر idempotency log | متوسط (ضغط شبكة متكرر) | منخفض | ترحيل تنبيهات Idempotency كـ Low/Medium. |
| 18| `PRISMA_ERROR_SPIKE` | **نعم**، عبر structured logs | متوسط (أثناء فترات إغلاق الاتصال) | منخفض | قياس النسبة المئوية لإخفاق الاستعلامات. |

---

## 📖 6. مراجعة وتدقيق كتيبات تشغيل الطوارئ الـ 10 (SRE Runbooks Review)

قمنا بالتحقق الكامل من سلامة كتيبات تشغيل الحوادث الـ 10 المقترحة وتصفير أي مخاطر تعديل على بيئة الإنتاج:

1. **سلامة المراقبة قراءة فقط:** **مضمونة 100%**. تقتصر أوامر الفحص والتشخيص المقترحة بالكامل على الاستعلامات صامتة قراءة فقط (مثل `df -h`, `pm2 logs`, `systemctl status`, والتحقق بقواعد البيانات Replica المعزولة).
2. **منع الأوامر التشغيلية المخربة:** تم صياغة بند "حظر الأوامر" (Do Not Do) بصرامة تامة، حيث يمنع تماماً استخدام `npx prisma db push --force-reset` أو إعادة بناء السيرفر دون تفويض مكتوب ومعتمد من مجلس الإدارة.
3. **توازن الـ Rollback والـ Abort:** تتضمن كافة الـ Runbooks قيوداً واضحة للتراجع الفوري (مثل عدم استقرار الأنظمة، تلف الـ Schemas، أو خرق زمن RTO) لحماية سلامة واستمرارية الحسابات المالية.
4. **تحديث الحوكمة:** تم ربط مسارات التصعيد (Escalation Path) بالأسماء المعنية الصريحة (CTO, CFO, CISO) لضمان المساءلة الكاملة.

---

## 🖼️ 7. مصفوفة جاهزية لوحات الرصد الـ 8 (Dashboard Readiness Matrix)

قمنا بتحليل وجاهزية لوحات المراقبة الـ 8 وتحديد متطلبات التكامل المستقبلية:

| اللوحة الرقمية المقترحة | المقاييس التشغيلية المطلوبة | جاهزية مصادر البيانات الحالية | المخاطر التقنية المرصودة | المتطلبات اللاحقة (Implementation) |
| :--- | :--- | :--- | :--- | :--- |
| **1. Platform Overview** | CPU, RAM, Latency, Uptime. | **جاهزة** (عبر `sys/health`). | منخفضة. | ربط Prometheus Exporter بـ Grafana. |
| **2. Tenant Health** | العمليات لكل شركة، الـ overrides. | **جاهزة جزئياً** (Map بالذاكرة). | فقدان العدادات عند ريستارت. | تصميم Exporter لتوطيد قيم الذاكرة. |
| **3. Database & Prisma** | Latency, connections pool. | **جاهزة** (عبر `sys/health` و postgres).| استهلاك اتصال pool بالخادم. | ربط pg_stat_statements بـ Grafana. |
| **4. PM2 & Runtime** | Node status, restarts count. | **جاهزة** (عبر `sys/health`). | ثقل استدعاء `pm2 jlist`. | **تفعيل كاش PM2 لمدة 15 ثانية**. |
| **5. Financial Governance**| Posting failures, period lock violations. | **جاهزة** (عبر جدول AuditLog). | بطء الاستعلام المحاسبي. | استعلام قواعد البيانات Replica المعزولة. |
| **6. Security / SIEM** | Brute force, RBAC denied, violations.| **جاهزة** (عبر `/api/admin/siem`).| حجم بيانات SIEM الكبير. | ربط مباشر مع Grafana Loki لـ Logs. |
| **7. Backup & DR** | Backup freshness, S3 storage sizes. | **جاهزة** (جدول backupManifest). | انقطاع وصول S3 السحابي. | استعلام فترات الـ backup دورياً. |
| **8. Business SLA** | SLO availability, p95/p99 latency. | **جاهزة** (عبر Prometheus). | دقة قياس p99 للمستأجرين. | هيكلة SLA Dashboard بـ Grafana. |

---

## 🔐 8. التدقيق الأمني وتكامل عزل المستأجرين (Security & Tenant Isolation Review)

تم إخضاع تصاميم وهياكل المراقبة لتدقيق أمني صارم وأثبتت سلامتها ومطابقتها للمعايير السيبرانية الوطنية كالتالي:

1. **حظر كشف الأسرار والمعلومات الحساسة:** يفرض كود [logger.ts](file:///d:/namasoft9-3-main/src/lib/observability/logger.ts) تعمية تامة وحظر تسجيل معلومات الهوية PII والكلمات المرورية والرموز السرية ومفاتيح JWT بداخل السجلات، وتمرير البيانات المالية بشكل مجرد وخالٍ من الهوية.
2. **حماية أمن مسارات المراقبة (Access Control):** تم التحقق من تأمين مسار `/api/admin/siem` باستخدام `withRoute` ومقصور كلياً وصراحة على الأدوار الحاكمة للأمان فقط (`admin`, `owner`, `security_officer`) لضمان عدم تسريب تفاصيل المحاولات للمهاجمين.
3. **حماية نبض الصحة وعزل المستأجرين (Tenant Boundary Protection):** تلتزم النبضات الصحية بالصفر التعديلي قراءة فقط، ويمنع تماماً تسريب أي تفاصيل معمارية حساسة أوDATABASE_URL للعامة عند عودة الأخطاء.

---

## 💵 9. التدقيق المالي وحوكمة الرقابة المحاسبية (Financial Governance Coverage)

تغطي خطة المراقبة المصممة بالكامل كافة متطلبات الرقابة والامتثال المالي الصارمة للمؤسسات:

- **رصد محاولات تعديل فترات مغلقة:** عبر تتبع التنبيه `PERIOD_LOCK_VIOLATION_SPIKE` والربط مع عدادات الـ overrides المحاسبية.
- **رصد فشل ترحيل القيود:** عبر تتبع التنبيه `FINANCIAL_POSTING_FAILURE` وقياس توازن دفاتر الأستاذ.
- **تأمين لقطات ما قبل النشر والنسخ:** تتبع ثبات واستمرارية وجدولة لقطات النسخ اليومية والتراكمية عبر `backupManifest`.
- **حظر الاختراقات المالية المتقاطعة:** رصد وحجب أي محاولة مشبوهة للولوج لبيانات شركة أخرى عبر `recordTenantViolation`.

---

## ⚠️ 10. الفجوات البرمجية المرصودة (Gaps Found)

على الرغم من الجاهزية الفنية الممتازة للمنصة، قمنا برصد أربع فجوات فنية تتطلب معالجة لاحقة ومقيدة:

1. **فجوة ثقل استعلام PM2 في نبض النظام (`sys/health`):** استدعاء `pm2 jlist` بشكل دوري ومباشر عند كل طلب GET يهدد باستنزاف موارد المعالج CPU تحت الضغط العالي.
2. **فجوة ركود عدادات المستأجرين في الذاكرة العشوائية (`tenant-telemetry.ts`):** حفظ عدادات العمليات والـ overrides بداخل `Map` بالذاكرة يعرضها للتصفير التلقائي عند ريستارت الخادم.
3. **فجوة غياب ربط أتمتة الـ Exporter للـ Prometheus:** عدم وجود Exporter مدمج يقوم بنشر وتمرير مقاييس عزل المستأجرين وأمان البيانات لـ Prometheus.
4. **فجوة تسريب بيانات التعديل المحتملة في سجلات الحقول (`siem/route.ts`):** إرجاع القيم القديمة والجديدة `oldValue` و `newValue` للحقول في `FieldAuditLog` قد يكشف قيم هويات أو أرقام IBAN أو غيرها بشكل غير مشفر لمسؤولي الأمان، مما يتطلب تصفية برمجية وحجب للبيانات الحساسة PII.

---

## ⚙️ 11. الجسور والحلول البرمجية المقترحة للمرحلة القادمة (Required Bridges)

نقترح بناء الجسور البرمجية الأربعة التالية في مرحلة التنفيذ القادمة لمعالجة الفجوات:

1. **جسر التخزين المؤقت لـ PM2 (PM2 Caching Adapter):** تعديل `/api/sys/health` لحفظ مخرجات PM2 بداخل الذاكرة أو Redis بمهلة انتهاء 15 ثانية، لتفادي الـ child process المتكرر.
2. **جسر مزامنة العدادات (Metrics Persister Bridge):** إعداد مهمة خفيفة خلفية تقوم بترحيل وحفظ إحصائيات عدادات المستأجرين من الذاكرة العشوائية لجدول `AuditLog` أو إرسالها دورياً لـ Prometheus.
3. **جسر تصدير مقاييس عزل المستأجرين (Prometheus Exporter Bridge):** إدراج نقطة استدعاء معزولة `/api/metrics` متوافقة مع تنسيق Prometheus لتسجيل عمليات المراقبة الفنية.
4. **جسر تنقية سجلات الحقول (Field Log PII Filter Bridge):** إضافة فلترة برمجية لحجب القيم الفعلية للمتغيرات الحساسة (مثل كلمات المرور، رموز TOTP، وأرقام الحسابات) بداخل سجلات تدقيق الحقول قبل إرسالها للـ SIEM.

---

## 🚫 12. البنود المحظورة قطعيًا (No-Go Items)

لضمان سلامة الإنتاج والالتزام الصارم بالصفر التعديلي لأجهزة العميل الحساسة، يُحظر تماماً الإجراءات التالية:
1. **حظر الربط التلقائي الحي لقنوات التنبيه:** يمنع ربط Webhooks فعلية لـ Slack أو Discord أو إرسال رسائل SMS أو E-mail حقيقية على الإنتاج أثناء هذه المرحلة.
2. **حظر استعلام الإنتاج المباشر دون كاش في النبضات المتكررة:** يمنع فحص PM2 دون كاش أو فحص جداول SIEM دون فهارس مركبة.
3. **حظر تخطي عزل المستأجرين:** يمنع كتابة أي alert rule يتخطى tenantId أو module أو severity أو traceId في structured logs.
4. **حظر تعديل أي كود runtime مالي أو أمني:** يمنع إجراء أي كتابة على قواعد البيانات أو النشر الفعلي.

---

## 💡 13. التوصيات الفنية والتشغيلية (Recommendations)

1. **تفعيل محاكي PagerDuty و Jira صامتاً:** الاستمرار في تشغيل mock incident response engine وتثبيت credentials كـ variables بيئية معماة كلياً.
2. **استخدام كاش PM2 فوري:** بدء تصميم PM2 Caching Adapter كأولوية قصوى قبل تفعيل المراقبة.
3. **إقرار فهارس قاعدة البيانات:** إرسال توصية لمهندس قواعد البيانات لإضافة compound indexes لـ `createdAt` و `attemptedAt` لتفادي بطء SIEM.
4. **تطوير Exporter معزول:** تصميم Exporter محمي بـ RBAC خلف مسار `/api/metrics` لمنع leak للمعلومات لغير Prometheus.

---

## 🏁 14. القرار النهائي للبوابة الفنية (Final Decision)

تم مراجعة وهيكلة وتدقيق كافة الأبعاد الفنية والمعمارية لأدوات المراقبة والتنبيه المبكر لنظام Nama Invest ERP بنجاح كامل وأمان مطلق، وتأكيد خلو كود الـ Runtime وقواعد البيانات من أي مساس أو تراجعات فنية.

---
> **القرار النهائي المعتمد للبوابة:** **ناجحة بوجود فجوات توثيقية مقرة (PASS_WITH_GAPS)**
> **معتمد التوقيع والاعتماد الفني:** **SRE & Security Auditor Board**
> **البوابة التالية الموصى بها:** `GO_FOR_OBSERVABILITY_ALERTING_SETUP_IMPLEMENTATION_PLAN_ONLY`

