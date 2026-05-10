# Contributing to NamaInvest ERP

شكراً لاهتمامك بالمساهمة! هذا الدليل يشرح كيفية المشاركة في تطوير النظام.

## 🚀 Quick Start

```bash
git clone <repo>
cd namasoft-erp
npm ci
cp .env.example .env
npm run db:push && npm run db:seed
npm run dev
```

## 🔄 Workflow

1. **Fork** المستودع
2. أنشئ **branch** باسم وصفي: `feat/zatca-signature`, `fix/payroll-gosi`, `chore/update-deps`
3. اكتب **tests** لأي كود جديد
4. شغّل `npm run validate` قبل الـ commit
5. افتح **Pull Request** واملأ القالب

## 📋 Standards

### Code Quality
- ✅ **TypeScript strict** — لا `any` بلا تبرير
- ✅ **0 TS errors** — `npm run typecheck` يجب أن ينجح
- ✅ **Structured logging** — استخدم `log.info/warn/error` لا `console.log`
- ✅ **Zod validation** — لكل POST/PUT/PATCH
- ✅ **withRoute HOF** — لكل API route جديد
- ✅ **try/catch** — كل Prisma call يجب أن يكون محاطاً بـ try/catch

### Testing
- اكتب **unit tests** لكل service/engine جديد
- ضع الاختبارات في: `src/lib/[name]/__tests__/[name].test.ts`
- شغّل: `npm test` (يجب أن تنجح جميع الاختبارات)

### Arabic/RTL
- النصوص العربية في الـ API responses مقبولة
- الـ UI يجب أن يدعم RTL

### Commit Messages
```
feat: إضافة محرك GOSI الجديد
fix: إصلاح حساب WPS للموظفين المؤقتين
chore: تحديث Prisma إلى 5.22
docs: توثيق API محرك المخزون
refactor: توحيد منطق إغلاق الفترة
test: إضافة اختبارات وحدة لـ leave-engine
```

## 🏗️ Architecture Rules

| القاعدة | التفاصيل |
|---------|---------|
| API Routes | يجب أن تستخدم `withRoute()` أو `try/catch` صريح |
| Services | في `src/lib/` — لا business logic في routes |
| Multi-tenant | استخدم `getPrisma(request)` لا `new PrismaClient()` |
| Journals | أي عملية مالية تمر عبر `auto-journal.ts` |
| Logger | `logger.child({ service: 'name' })` في كل ملف |

## 🔒 Security Checklist for PRs

- [ ] لا secrets في الكود
- [ ] لا `console.log` في API routes
- [ ] PII masked في جميع logs
- [ ] Rate limiting مفعّل للـ endpoint الجديد
- [ ] Auth check موجود لكل route يتطلبه

## 📞 Questions?

افتح Discussion أو تواصل عبر Telegram Bot.
