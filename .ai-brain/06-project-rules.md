# 06 - قواعد المشروع وأسلوب البرمجة (Project Rules)

> الدستور البرمجي لـ Namasoft ERP. يستند إلى `CLAUDE.md` + التحسينات الفعلية من مراجعة الكود.

---

## 🛑 القاعدة الأولى: عقلية المطور الخبير

أنت تعمل بصفة **Senior Full-Stack Developer** و **Security Auditor**:
- ❌ لا حلول وسطى أو أكواد ناقصة
- ❌ لا `any` في TypeScript — استخدم `unknown` ثم تحقق
- ❌ لا "وكذلك بقية الكود..." — اكتب الكود كاملاً
- ✅ راجع كل سطر قبل التسليم
- ✅ اشرح سبب التعديل عند الضرورة

---

## 1️⃣ المعمارية (Architecture Rules)

### 1.1 Multi-Tenancy
- ✅ **استخدم `getPrisma(req)` فقط** — لا `new PrismaClient()` يدوياً
- ✅ **النظام في Phase 2** — قاعدة فيزيائية لكل مستأجر
- ✅ **Pool Key لكل DB URL** — منع تسريب بيانات
- ❌ لا تستدعي Master DB من tenant API
- ❌ لا تفترض RLS فقط — الـ Phase 2 هو الافتراضي

### 1.2 API Routing
- ✅ **كل مسار جديد بـ `withRoute`** — لا `withGuard` (Legacy)
- ✅ **اختر Rate Limit المناسب:**
  - `FINANCIAL` للعمليات المالية
  - `AI` لاستدعاءات Gemini
  - `UPLOAD` لرفع ملفات
- ✅ **Zod validation** للمدخلات
- ✅ **التحقق من الصلاحية في الـ Backend** — لا تعتمد على الـ Frontend

### 1.3 قاعدة البيانات
- ✅ **`prisma.$transaction`** للعمليات متعددة الجداول
- ✅ **`Serializable` isolation** للترقيم والـ counters
- ✅ **Decimal(18,4)** للمبالغ المالية — لا Float
- ✅ **Indexes للحقول المُفلترة**
- ❌ لا تكسر migrations موجودة
- ❌ لا `prisma migrate dev` — استخدم `prisma db push`
- ❌ لا Hard Delete للسجلات المالية

---

## 2️⃣ الأمان والموثوقية (Security & Reliability)

### 2.1 المصادقة
- ✅ JWT في cookie httpOnly + secure + sameSite=lax
- ✅ bcrypt cost ≥ 10
- ✅ MFA إجباري للأدوار الحرجة
- ❌ لا تخزن أسرار في الكود
- ❌ لا تستخدم default JWT_SECRET في الإنتاج

### 2.2 الحذف
- ✅ **Soft Delete إجباري** للسجلات المالية
- ✅ `deletedAt: DateTime?` field
- ✅ يتم تلقائياً عبر middleware
- ❌ لا Hard Delete لـ: SalesInvoice, JournalEntry, Customer, Employee, Product, إلخ

### 2.3 التدقيق
- ✅ كل CREATE/UPDATE/DELETE يُسجل في `AuditLog`
- ✅ يتم تلقائياً عبر middleware
- ✅ AuditLog لا يُحذف أبداً (للأبد)
- ❌ لا تتجاوز Audit Middleware

### 2.4 الواجهة
- ✅ تجنب `dangerouslySetInnerHTML` (إلا مع تعقيم)
- ✅ Sanitize كل user input قبل العرض
- ✅ CSP headers مفعّلة في `next.config.ts`
- ❌ لا تكشف معلومات حساسة في errors بـ production

---

## 3️⃣ المحاسبة (Accounting Rules)

### 3.1 القيود التلقائية
- ✅ **كل ميزة محاسبية تستخدم `src/lib/auto-journal.ts`**
- ✅ Dr = Cr ± 0.01 tolerance
- ✅ كل قيد له source يحدد أصله
- ❌ لا SQL مباشر لإنشاء قيود
- ❌ لا تعديل قيد POSTED — استخدم Reversal Entry

### 3.2 الحسابات الرقابية
- ❌ **لا تكتب يدوياً على:**
  - RECEIVABLES (1210)
  - PAYABLES (2110)
  - INVENTORY (1330)
  - GR/IR (2120)
  - GOSI Payable (2340)
  - VAT Output/Input (2310/1340)
- ✅ هذه تتعدل فقط عبر sub-ledgers
- ✅ Recon تلقائي

### 3.3 الفترات المحاسبية
- ✅ بعد إقفال فترة، لا يمكن التعديل
- ✅ Period Close بـ 16 خطوة
- ❌ لا تعديل قيود في فترة مقفلة (إلا بصلاحية owner)

---

## 4️⃣ ZATCA (E-Invoicing)

- ✅ استخدم `/api/zatca` الموجود — لا تعيد كتابة XML signing
- ✅ ICV و PIH متسلسلان (بدون فجوات)
- ✅ Settings.zatca_invoice_counter يدار تلقائياً
- ✅ اختبر في sandbox قبل production
- ❌ لا تعدل فاتورة بعد ZATCA clearance — أصدر credit note

---

## 5️⃣ الكود (Code Style)

### 5.1 TypeScript
- ✅ Strict mode (موجود في tsconfig.json)
- ✅ `unknown` بدل `any`
- ✅ Type narrowing قبل الاستخدام
- ✅ Type-safe Prisma queries

### 5.2 React
- ✅ Server Components افتراضياً
- ✅ `'use client'` فقط عند الحاجة
- ✅ React Hook Form للنماذج
- ✅ TanStack Query للـ data fetching
- ✅ Suspense + ErrorBoundary

### 5.3 الـ Naming
- ✅ camelCase للمتغيرات والدوال
- ✅ PascalCase للـ Components والأنواع
- ✅ kebab-case لأسماء الملفات
- ✅ SCREAMING_SNAKE_CASE للـ Constants

### 5.4 التعليقات
- ✅ التعليقات للـ "لماذا"، ليس "ماذا"
- ✅ بالإنجليزي للوضوح التقني
- ❌ لا تعليقات تشرح ما يفعله الكود الواضح

---

## 6️⃣ النشر (Deployment)

### 6.1 الذكي
- `node deploy.js file.ts --build` — للـ UI/components
- `node deploy.js --files-only file.ts` — للـ API/lib
- `node deploy.js --restart-only` — restart بدون تعديل
- `node deploy.js --db-push` — تحديث Schema

### 6.2 قواعد
- ❌ **لا تمسح `.next`** أبداً — يُبنى فوقه
- ✅ Restart يكفي لـ API/lib
- ✅ Build فقط لـ UI/config
- ✅ `--build` لا `rm -rf .next`

### 6.3 قاعدة البيانات
- استخدم `prisma db push` فقط
- استخدم `prisma@5.22.0` صراحة في scripts (منع تباين الإصدارات)
- اختبر على staging قبل production

---

## 7️⃣ الواجهة (UI/UX)

- ✅ **i18n إجباري** — كل نص عبر `useTranslation` و `t('key')`
- ✅ **RTL تلقائي** بناءً على اللغة
- ✅ **Responsive** للموبايل والديسكتوب
- ✅ **Premium Design** — ظلال، حواف دائرية، ألوان متناسقة
- ✅ **shadcn/ui patterns** متبعة
- ✅ **التقويم الهجري** عند الحاجة (`HijriDate` component)
- ❌ لا تصميمات قديمة أو بدائية

---

## 8️⃣ دورة التطوير (Workflow)

### للميزة الجديدة:
```
1. اقرأ الـ Gap Analysis
2. اقرأ/ارسم الـ Business Flow
3. تحقق من المنطق المحاسبي مع CPA
4. صمم Schema changes
5. حدد API endpoints
6. اكتب tests أولاً (TDD)
7. اكتب الكود
8. اختبارات تكاملية
9. وثّق في README
10. اعرض diff قبل commit
```

### للـ bug:
```
1. أعد إنتاج الـ bug
2. اكتب test يكشفه (failing test)
3. أصلح الكود
4. تأكد أن الـ test يمر
5. تأكد من عدم كسر اختبارات أخرى
6. وثّق في commit message
```

---

## 9️⃣ Git

### Commit message format:
```
feat|fix|refactor|docs|test(module): description

# أمثلة:
feat(sales): add restocking fee to returns
fix(zatca): correct ICV increment race condition
refactor(prisma): extract pool resolution to helper
docs(api): document withRoute options
test(eos): add Article 84-85 boundary cases
```

### قواعد:
- ❌ لا commit مباشر على `main`
- ❌ لا push --force لـ main
- ❌ لا تتجاوز hooks بـ --no-verify
- ✅ branch لكل ميزة/bug
- ✅ كل commit مرتبط بـ task
- ✅ قبل push: `npm run lint && npm run typecheck`

---

## 🔟 متى تسأل المستخدم؟

### اسأل دائماً قبل:
- تعديل أكثر من 5 ملفات في PR واحد
- تغيير schema (Prisma migration)
- إضافة dependency جديد
- تعديل المنطق المحاسبي
- تعديل ZATCA logic
- حذف كود قديم
- Refactor كبير

### نفّذ مباشرة (مع تلخيص):
- typos و bugs صغيرة
- إضافة tests
- تحسين تعليقات
- تحديث documentation
- تحسين أداء بسيط
- إصلاح تنسيق

---

## 1️⃣1️⃣ الفلسفة

> **"البرمجة 25% من العمل. الباقي: تصميم + توثيق + اختبار + امتثال."**

> **القاعدة الذهبية:** "اقرأ الفلو، استشر المحاسب، اكتب الـ test، ثم اكتب الكود."

> **هدف المشروع:** الوصول إلى مستوى SAP/Oracle/NetSuite في 12-18 شهراً.

---

## 1️⃣2️⃣ تذكير دائم

- 📖 **اقرأ `CLAUDE.md` قبل أي قرار**
- 🔍 **افحص الـ Gap Analysis** للموديول
- 📐 **ارجع للـ Business Flow** في الـ Guide
- ✅ **استخدم Specialized Agents** عند الحاجة
- 💼 **استشر المحاسب** للمنطق المالي
- 🇸🇦 **تحقق من الامتثال السعودي**
- 🧪 **اختبر دائماً** قبل النشر
