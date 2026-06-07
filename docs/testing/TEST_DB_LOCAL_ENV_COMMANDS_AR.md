# تعليمات وأوامر تهيئة بيئة الاختبار المحلية (TEST_DB_LOCAL_ENV_COMMANDS_AR)

يوفر هذا المستند الأوامر الإرشادية اللازمة للمسؤول لإعداد متغيرات بيئة جلسة الاختبار محلياً وبطريقة آمنة تماماً.

---

## 💻 PowerShell Session Variables

تشغيل الأوامر التالية داخل نافذة الـ PowerShell الخاصة بجلسة الاختبار فقط (منع تخزينها بشكل دائم):

```powershell
$env:TEST_MODE = "true"
$env:TEST_DATABASE_URL = "<PUT_TEST_DATABASE_URL_HERE_DO_NOT_COMMIT>"
```

## 🔍 التحقق بدون طباعة القيم

للتحقق من إعداد المتغيرات بشكل صحيح وبدون إظهار أو طباعة قيمها في الطرفية أو ملفات التقارير:

```powershell
if ($env:TEST_MODE) { "TEST_MODE_PRESENT" } else { "TEST_MODE_MISSING" }
if ($env:TEST_DATABASE_URL) { "TEST_DATABASE_URL_PRESENT" } else { "TEST_DATABASE_URL_MISSING" }
```

## 🐋 Docker Postgres مثال إرشادي (غير منفذ)

تشغيل حاوية اختبار PostgreSQL مؤقتة محلياً (إرشاد فقط، لا تشغله في الإنتاج):

```powershell
# Example only - do not commit real credentials
# docker run --name nama-test-postgres -e POSTGRES_PASSWORD=<local-test-password> -e POSTGRES_DB=nama_test_disposable -p 55432:5432 -d postgres:16
```

## 🗄️ Local Postgres مثال إرشادي (غير منفذ)

- أنشئ database باسم يحتوي `test` أو `disposable`.
- استخدم user خاص بالاختبار فقط.
- لا تستخدم production user.
- لا تستخدم production database.

## ⛔ ممنوعات السلامة وحماية الحوكمة

- لا تضع القيم الفعلية أبداً داخل Git.
- لا تضعها داخل ملفات docs.
- لا تطبعها في الطرفية.
- لا تستخدم ملف `.env` الإنتاجي أو تعدل عليه نهائياً.
