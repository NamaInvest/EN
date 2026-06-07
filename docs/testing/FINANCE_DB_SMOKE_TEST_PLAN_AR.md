# خطة Finance DB Smoke Test (FINANCE_DB_SMOKE_TEST_PLAN_AR)

## الهدف
تأكيد أن Test DB المعزولة يمكن استخدامها لاختبارات مالية آمنة.

## قواعد السلامة
- لا production.
- لا طباعة env values.
- لا migrations.
- لا db push.
- لا SQL مباشر.
- rollback أو disposable فقط.
- لا live posting.
- لا external integrations.

## أول smoke test مسموح
- يتحقق من توفر test DB readiness.
- يتحقق من tenant seed plan فقط.
- يتحقق من rollback readiness.
- لا ينشئ journal حقيقي في أول نسخة إلا إذا transaction rollback مؤكد.

## شروط تشغيل smoke test
- `TEST_MODE=true`.
- `TEST_DATABASE_URL` آمن ومطابق للحراسة المبرمجة.
- مرور اختبارات `guard pass` بنجاح.
- عدم وجود أي رابط يشبه روابط الإنتاج `no production-like URL`.
- توفر استراتيجية التراجع `rollback strategy available`.
