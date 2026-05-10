## 📋 وصف التغيير | Description

<!-- وصف واضح للتغييرات التي أجريتها -->

## 🔗 Issue ذات صلة | Related Issue

Fixes #<!-- رقم الـ issue -->

## 🧪 نوع التغيير | Type of Change

- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 🔧 Refactoring
- [ ] 📚 Documentation
- [ ] 🔒 Security fix
- [ ] ⚡ Performance improvement
- [ ] 🏗️ Breaking change

## ✅ Checklist

- [ ] `npm run typecheck` ← **0 errors**
- [ ] `npm test` ← **جميع الاختبارات تجتاز**
- [ ] لا `console.log` في الكود الجديد (استخدم `log.*`)
- [ ] كل route جديد يستخدم `withRoute()` أو `try/catch`
- [ ] كل POST/PUT/PATCH يستخدم Zod validation
- [ ] لا secrets في الكود
- [ ] الكود العربي يعمل بشكل صحيح (RTL)
- [ ] تم تحديث الـ CHANGELOG.md

## 🧪 كيفية الاختبار | How to Test

<!-- شرح كيفية اختبار هذا التغيير -->

```bash
# example:
npm run test:unit
curl http://localhost:3000/api/health
```

## 📸 لقطات شاشة | Screenshots

<!-- إذا كانت هناك تغييرات في الـ UI -->
