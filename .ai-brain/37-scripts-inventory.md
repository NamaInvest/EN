# 37 - فهرس السكريبتات (Scripts Inventory)

> 122+ script في `scripts/` — أدوات النشر، الصيانة، المراجعة، الإصلاح

---

## 📂 التنظيم العام

### الأنواع:
- **deploy/build:** سكريبتات النشر والبناء
- **fix/cleanup:** إصلاح مشاكل شائعة
- **audit:** فحص الكود
- **db:** عمليات قاعدة البيانات
- **migration:** ترحيل البيانات
- **scan/analyze:** تحليل الكود
- **utilities:** أدوات عامة

---

## 🚀 Build & Deploy

| Script | الغرض |
|---|---|
| `deploy.js` (في الجذر) | **النشر الذكي للسيرفر** |
| `after-pack.js` | بعد electron-builder |
| `before-pack.js` | قبل electron-builder |
| `build-on-server.cjs` | البناء على السيرفر |
| `clean-standalone.js` | تنظيف بعد Next.js standalone |
| `protect-code.js` | obfuscation للـ Electron |
| `prebuild.js` | تحضير قبل البناء |
| `bytecode-compile.js` | تحويل JS لـ bytecode |

### المهام الفرعية:
| Script | الغرض |
|---|---|
| `daily-backup.sh` | Cron daily backup |
| `start-desktop.js` | بدء Electron + Next.js |

---

## 🔧 Fix Scripts (الإصلاحات الجماعية)

### Syntax Fixes:
| Script | الغرض |
|---|---|
| `fix-all-catch-errors.cjs` | إصلاح catch syntax |
| `fix-catch-err-refs.cjs` | تصحيح catch references |
| `fix-silent-catches-safe.cjs` | إضافة logging لـ catches فارغة |
| `fix-route-syntax.cjs` | إصلاح syntax المسارات |
| `fix-implicit-any.mjs` | إزالة implicit any |
| `fix-missing-imports.mjs` | إضافة imports ناقصة |
| `fix-duplicates.cjs` | إزالة التكرار |
| `fix-duplicate-take.cjs` | إصلاح `take` المكرر |

### Build Errors:
| Script | الغرض |
|---|---|
| `fix-build-errors.cjs` | إصلاحات شائعة للـ build |
| `fix-console-logs.cjs` | تحويل console.log إلى logger |
| `fix-pagination-final.cjs` | إصلاح pagination |
| `fix-pagination-global.cjs` | عام |

### DB Fixes:
| Script | الغرض |
|---|---|
| `fix-all-db-urls.cjs` | إصلاح DATABASE_URL |
| `fix-db-permissions.cjs` | صلاحيات DB |
| `fix-db-tcp.cjs` | مشاكل TCP |
| `fix-localhost-to-ip.cjs` | localhost → 127.0.0.1 |
| `fix-main-site-env.cjs` | إصلاح env للموقع الرئيسي |
| `fix-schema-and-passwords.cjs` | schema + passwords |

### Specific:
| Script | الغرض |
|---|---|
| `fix-auth-param.js` | إصلاح auth parameter |
| `fix-company-name.js` | اسم الشركة في البيانات |
| `fix-encoding.py` | مشاكل UTF-8 |
| `fix-mojibake-layout.py` | إصلاح mojibake (تشفير خاطئ) |
| `fix-password-safe.cjs` | إعادة تعيين passwords |
| `fix-alerts.cjs` | تنبيهات التطبيق |

---

## 🧹 Cleanup Scripts

| Script | الغرض |
|---|---|
| `cleanup-routes.js` | تنظيف المسارات |
| `clean-ar-routes.mjs` | تنظيف مسارات AR |
| `clean-git-secrets.sh` | حذف الأسرار من Git history |
| `final-dedup-cleanup.cjs` | إزالة التكرارات النهائية |
| `final-fix-and-build.cjs` | تنظيف + بناء |
| `final-audit.cjs` | مراجعة نهائية |

---

## 📊 Audit Scripts

| Script | الغرض |
|---|---|
| `audit-routes.ts` | فحص كل route.ts |
| `audit-zod.js` | فحص استخدام Zod في كل route |
| `check-env.cjs` | التحقق من ENV variables |
| `check-models.js` | فحص Prisma models |
| `deep-scan.cjs` | فحص عميق للكود |
| `diagnose-login.cjs` | تشخيص مشاكل تسجيل الدخول |

---

## 🗄 Database Scripts

### Migration:
| Script | الغرض |
|---|---|
| `add-compound-indexes.js` | إضافة indexes مركبة |
| `add-soft-deletes.js` | إضافة deletedAt للجداول |
| `add-pagination.cjs` | إضافة pagination للـ routes |
| `add-zod-safeParse.js` | تحويل parse → safeParse |
| `add-log-decl.cjs` | إضافة logger declarations |
| `batch-logger-migration.cjs` | ترحيل console.log → logger |
| `add-try-catch.cjs` | إضافة error handling |

### Data Operations:
| Script | الغرض |
|---|---|
| `copy-core-data.cjs` | نسخ بيانات أساسية |
| `copy-users-pgdump.cjs` | نسخ المستخدمين بـ pg_dump |
| `copy-users-to-staging.cjs` | نسخ للـ staging |
| `create-staging-db-tcp.cjs` | إنشاء staging DB |
| `debug-staging.cjs` | تشخيص staging |

---

## 🇸🇦 ZATCA Scripts

### في `src/scripts/`:
| Script | الغرض |
|---|---|
| `test-zatca-compliance.ts` | اختبار التوافق |
| `test-zatca-csr.ts` | اختبار CSR generation |
| `test-zatca-sdk.ts` | اختبار الـ SDK |
| `zatca-sign-invoice.js` | اختبار التوقيع |

---

## 🤖 OpenAPI Generation

| Script | الغرض |
|---|---|
| `generate-openapi.js` | توليد OpenAPI spec من Zod schemas |
| `audit-zod.js` | فحص استخدام Zod |

### الـ Flow:
```
1. كل route يستخدم Zod schemas
2. الـ script يفحص كل route
3. يستخرج الـ schemas
4. يولّد OpenAPI 3.0 spec
5. ينشره على /api/docs (Swagger UI)
```

---

## 🛠 Utility Scripts

### في `src/scripts/`:
| Script | الغرض |
|---|---|
| `append_models.ts` | إضافة models لـ Prisma |
| `benchmark-vector.ts` | بنشمارك pgvector |
| `check-audit-logs.ts` | فحص AuditLog |
| `migrate-audit-logs.ts` | ترحيل audit logs |
| `start_workers.ts` | بدء BullMQ workers |
| `telegram-poll.ts` | polling لـ Telegram |
| `find-untranslated.ts` | البحث عن نصوص غير مترجمة |

### Python Scripts:
| Script | الغرض |
|---|---|
| `build_wiki_html.py` | بناء HTML للـ wiki |
| `extract_graph_insights.py` | استخراج insights |
| `fix-encoding.py` | إصلاح ترميز UTF-8 |
| `fix-mojibake-layout.py` | إصلاح mojibake |

---

## 📋 Best Practices

### عند إضافة Script جديد:
1. ✅ **اسم وصفي:** `fix-{what}.cjs` أو `add-{what}.cjs`
2. ✅ **Comment header** يشرح الغرض
3. ✅ **Dry-run mode** قبل التطبيق:
   ```javascript
   const DRY_RUN = process.argv.includes('--dry-run');
   if (!DRY_RUN) {
       await applyChanges();
   } else {
       console.log('Would apply:', changes);
   }
   ```
4. ✅ **Backup قبل التعديل** على ملفات حساسة
5. ✅ **Log كل تعديل** بـ logger
6. ✅ **Tests:** اختبر على ملف واحد قبل التشغيل العام

### Naming Convention:
- `.cjs` — CommonJS (لـ scripts بسيطة)
- `.mjs` — ES Modules
- `.ts` — TypeScript (يحتاج tsx)
- `.js` — Auto-detect (يفضل تحديد extension)
- `.sh` — Shell (Linux/Mac)
- `.py` — Python

---

## 🎯 Scripts الشائعة الاستخدام

### اليومية:
```bash
# اختبر environment
node scripts/check-env.cjs

# نشر سريع
node deploy.js src/lib/x.ts --files-only

# نشر مع بناء
node deploy.js --build
```

### الأسبوعية:
```bash
# audit الكود
node scripts/audit-routes.ts
node scripts/audit-zod.js

# توليد OpenAPI
npm run openapi

# typecheck شامل
npm run validate
```

### عند الحاجة:
```bash
# تنظيف الأسرار من git
bash scripts/clean-git-secrets.sh

# إصلاح encoding
python scripts/fix-encoding.py

# تشغيل workers
npm run worker
```

---

## ⚠️ Scripts الخطيرة

### تتطلب موافقة:
| Script | الخطر |
|---|---|
| `clean-git-secrets.sh` | يعيد كتابة Git history |
| `fix-schema-and-passwords.cjs` | يغير DB schema |
| `copy-users-pgdump.cjs` | يكشف passwords |
| `final-dedup-cleanup.cjs` | قد يحذف ملفات بالخطأ |

### قاعدة ذهبية:
- ✅ **اقرأ الـ script أولاً** قبل التشغيل
- ✅ **شغّل في staging** قبل production
- ✅ **Backup قبل أي destructive operation**

---

## 📊 الإحصائيات

- **إجمالي scripts:** 122+
- **CJS:** ~50
- **MJS/JS:** ~30
- **TS:** ~15 (في src/scripts/)
- **Shell:** ~5
- **Python:** ~5
- **معظمها:** للإصلاحات الجماعية (one-off)
- **القليل منها:** للاستخدام المستمر (deploy, workers)

---

## 🔍 ملاحظات

- معظم scripts كانت لـ migrations معينة (one-off)
- بعضها معطّل أو deprecated
- يفضل توحيد الأدوات الدائمة (deploy.js, workers) ومسح الباقي
- الـ scripts التي تعدل الكود الجماعي → خطيرة، اختبرها قبل
