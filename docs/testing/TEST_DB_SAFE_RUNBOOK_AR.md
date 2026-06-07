# Runbook تشغيل Test DB بأمان

## المرحلة 1: تجهيز المتغيرات محليًا
- لا تكتب القيم في Git.
- لا تضع القيم في docs.
- استخدم session-level env variables.
- تأكد أن TEST_MODE=true.

## المرحلة 2: تشغيل Readiness Gate
أوامر مسموحة لأنها لا تطبع القيم:
if ($env:TEST_MODE) { "TEST_MODE_PRESENT" } else { "TEST_MODE_MISSING" }
if ($env:TEST_DATABASE_URL) { "TEST_DATABASE_URL_PRESENT" } else { "TEST_DATABASE_URL_MISSING" }

## المرحلة 3: تشغيل guard tests
npx vitest run tests/db-safety.test.ts
npx vitest run tests/finance-harness-safety.test.ts

## المرحلة 4: لا تشغل DB integration إلا بعد:
- readiness PASS
- guard PASS
- no production-like URL
- rollback strategy ready
- seed strategy ready

## المرحلة 5: أول اختبار مسموح لاحقًا
- finance-isolated-db-smoke.test.ts
- يجب أن يعمل skip إذا DB غير جاهزة
- لا يكتب DB في أول نسخة إلا rollback transaction
