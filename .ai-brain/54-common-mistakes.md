# 54 - الأخطاء الشائعة وتجنبها (Common Mistakes & Anti-Patterns)

> 50+ خطأ شائع في الاستخدام والتطوير + كيفية تجنبها

---

## 💰 الأخطاء المحاسبية

### 1. كتابة يدوية على الحسابات الرقابية
**❌ خطأ:**
```typescript
// محاسب يكتب JE يدوي على AR:
JE: Dr AR / Cr Customer Discount (50)
```

**✅ الصحيح:**
```typescript
// استخدم Credit Note للعميل
POST /api/sales/credit-note/{invoiceId}
// النظام تلقائياً ينشئ JE صحيح
```

**السبب:** الحسابات الرقابية (AR, AP, Inventory, GR/IR) تتعدل تلقائياً من sub-ledgers. الكتابة اليدوية تكسر التوافق.

---

### 2. تعديل قيد POSTED مباشرة
**❌ خطأ:**
```sql
UPDATE journal_line SET amount = 1500 WHERE id = 999;
```

**✅ الصحيح:**
```typescript
// 1. Reversal Entry للقديم
POST /api/accounting/journal/{id}/reverse

// 2. قيد جديد بالقيمة الصحيحة
POST /api/accounting/journal
```

**السبب:** القيود POSTED لها قيمة قانونية ومحاسبية. التعديل يكسر الـ audit trail و قد يكون مخالفاً قانونياً.

---

### 3. عدم تطبيق Dr = Cr
**❌ خطأ:**
```typescript
JE: Dr Cash 100, Cr Revenue 99  // off by 1
```

**✅ الصحيح:**
```typescript
const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error('JE not balanced');
}
```

**السبب:** يخل بالمعادلة المحاسبية. النظام يرفض أوتوماتيكياً، لكن السكريبتات يجب أن تتأكد.

---

### 4. Float للأموال (Floating Point Errors)
**❌ خطأ:**
```typescript
const vat = total * 0.15;
// 100 * 0.15 = 15.000000000000002 !!
```

**✅ الصحيح:**
```typescript
import { Decimal } from '@/lib/money';

const vat = new Decimal(total).mul(0.15).round(2);
// أو:
const vat = Math.round(total * 0.15 * 100) / 100;
```

**السبب:** JavaScript Float arithmetic غير دقيق. للأموال استخدم Decimal دائماً.

---

### 5. خلط طرق التكلفة
**❌ خطأ:**
- منتج X يحسب FIFO في فاتورة، LIFO في أخرى

**✅ الصحيح:**
- اختر طريقة واحدة في Settings: `costing_method = 'FIFO'`
- استخدمها لكل المنتجات بنفس Tenant
- لا تغيّر بدون الـ revaluation الكامل

**السبب:** يكسر consistency في المحاسبة. هيئة الزكاة قد ترفض.

---

### 6. نسيان VAT في الحسابات
**❌ خطأ:**
```typescript
// فاتورة 100 SAR، يكتب:
JE: Dr Cash 100 / Cr Revenue 100
// نسي VAT!
```

**✅ الصحيح:**
```typescript
JE: Dr Cash 115
       Cr Revenue 100
       Cr VAT Output 15
```

**السبب:** يخل بـ VAT Return الشهري + يتسبب في مشاكل مع ZATCA.

---

## 🇸🇦 أخطاء ZATCA

### 7. تكرار ICV (race condition)
**❌ السبب:**
```typescript
// عمليتان متزامنتان:
const icv = await getSettings('zatca_invoice_counter');
// كلاهما يقرأ نفس القيمة
const newIcv = parseInt(icv) + 1;
// كلاهما يكتب نفس القيمة الجديدة
```

**✅ الصحيح:**
```typescript
await prisma.$transaction(async (tx) => {
    const counter = await tx.setting.findUnique({
        where: { key: 'zatca_invoice_counter' }
    });
    const newIcv = parseInt(counter.value) + 1;
    await tx.setting.update({
        where: { key: 'zatca_invoice_counter' },
        data: { value: newIcv.toString() }
    });
    return newIcv;
}, { isolationLevel: 'Serializable' });
```

**السبب:** ZATCA يطلب ICV متسلسل بدون فجوات. التكرار يكسر الـ chain.

---

### 8. تعديل فاتورة بعد ZATCA Clearance
**❌ خطأ:**
```typescript
// فاتورة CLEARED، نريد تعديل المبلغ:
await prisma.salesInvoice.update({
    where: { id: 999 },
    data: { total: 1500 }
});
```

**✅ الصحيح:**
```typescript
// 1. أصدر Credit Note (لإلغاء الأصل)
POST /api/sales/credit-note/{originalInvoiceId}

// 2. أصدر فاتورة جديدة بالقيمة الصحيحة
POST /api/sales
```

**السبب:** بعد Clearance، ZATCA لديه نسخة موقعة. أي تعديل = إخلال بالنظام.

---

### 9. عدم اختبار في Sandbox أولاً
**❌ خطأ:**
- تحديث ZATCA logic مباشرة للـ production

**✅ الصحيح:**
```bash
# 1. اختبر في sandbox:
ZATCA_ENV=simulation node test-zatca.ts

# 2. تحقق من الـ outputs
# 3. ثم production
```

**السبب:** فشل في Production يعطل الـ business. Sandbox آمن للتجربة.

---

## 🛡 الأخطاء الأمنية

### 10. تخزين Password في Code/Git
**❌ خطأ:**
```typescript
const password = 'admin123';  // hardcoded
```

**✅ الصحيح:**
```typescript
const password = process.env.ADMIN_PASSWORD;
// + scripts/clean-git-secrets.sh للتنظيف
```

---

### 11. JWT بدون Expiry
**❌ خطأ:**
```typescript
jwt.sign(payload, secret); // no expiresIn
```

**✅ الصحيح:**
```typescript
jwt.sign(payload, secret, { expiresIn: '24h' });
```

---

### 12. عدم تحقق من Tenant في API
**❌ خطأ:**
```typescript
// API يقرأ من DB بدون filter:
const data = await prisma.product.findMany();
// يرجع منتجات من كل المستأجرين!
```

**✅ الصحيح:**
```typescript
export const GET = withRoute(async ({ prisma, tenant }) => {
    // prisma client تلقائياً يعزل لكل tenant
    const data = await prisma.product.findMany();
    return NextResponse.json(data);
});
```

---

### 13. SQL Injection
**❌ خطأ:**
```typescript
const result = await prisma.$queryRawUnsafe(
    `SELECT * FROM users WHERE email = '${email}'`
);
```

**✅ الصحيح:**
```typescript
const result = await prisma.user.findFirst({
    where: { email }
});
// أو إذا اضطررت لـ raw:
const result = await prisma.$queryRaw`
    SELECT * FROM users WHERE email = ${email}
`;
// (template literal escapes تلقائياً)
```

---

### 14. XSS عبر dangerouslySetInnerHTML
**❌ خطأ:**
```tsx
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**✅ الصحيح:**
```tsx
// استخدم نص عادي:
<div>{userInput}</div>

// أو مع تعقيم:
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

---

### 15. كشف معلومات حساسة في Errors
**❌ خطأ:**
```typescript
catch (e) {
    return NextResponse.json({ 
        error: e.message,
        stack: e.stack  // ← خطأ!
    }, { status: 500 });
}
```

**✅ الصحيح:**
```typescript
catch (e) {
    logger.error('Internal error', { error: e });
    return NextResponse.json({
        error: process.env.NODE_ENV === 'development' 
            ? e.message 
            : 'Internal server error',
        requestId
    }, { status: 500 });
}
```

---

## 🗄 الأخطاء في قاعدة البيانات

### 16. استدعاء new PrismaClient()
**❌ خطأ:**
```typescript
const prisma = new PrismaClient();
// كل مرة client جديد → memory leak!
```

**✅ الصحيح:**
```typescript
export const GET = withRoute(async ({ prisma }) => {
    // الـ prisma client معزول للـ tenant + cached
});
```

---

### 17. N+1 Queries
**❌ خطأ:**
```typescript
const orders = await prisma.order.findMany();
for (const order of orders) {
    const customer = await prisma.customer.findUnique({
        where: { id: order.customerId }
    });
}
// 1 + N queries!
```

**✅ الصحيح:**
```typescript
const orders = await prisma.order.findMany({
    include: { customer: true }
});
// 1 query فقط
```

---

### 18. Pagination ناقصة
**❌ خطأ:**
```typescript
const allProducts = await prisma.product.findMany();
// قد يرجع 100,000 سجل!
```

**✅ الصحيح:**
```typescript
const products = await prisma.product.findMany({
    skip: (page - 1) * 50,
    take: 50,
    orderBy: { name: 'asc' }
});
```

---

### 19. Hard Delete للسجلات المالية
**❌ خطأ:**
```typescript
await prisma.salesInvoice.delete({ where: { id } });
// يحذف فعلياً!
```

**✅ الصحيح:**
```typescript
// النظام تلقائياً يحوله لـ soft delete (deletedAt)
// عبر prisma-soft-delete middleware

// أو صراحة:
await prisma.salesInvoice.update({
    where: { id },
    data: { deletedAt: new Date() }
});
```

---

### 20. عدم استخدام Transactions
**❌ خطأ:**
```typescript
// إنشاء فاتورة + قيد بدون transaction:
const invoice = await prisma.salesInvoice.create({...});
const je = await prisma.journalEntry.create({...});
// إذا فشل الثاني، الأول موجود!
```

**✅ الصحيح:**
```typescript
await prisma.$transaction(async (tx) => {
    const invoice = await tx.salesInvoice.create({...});
    await tx.journalEntry.create({...});
    return invoice;
});
// كل أو لا شيء (Atomic)
```

---

## 🚀 الأخطاء في النشر

### 21. مسح .next
**❌ خطأ:**
```bash
rm -rf .next
npm run build
# Build طويل جداً!
```

**✅ الصحيح:**
```bash
# الـ Next.js يبني فوق الـ .next
npm run build
# Faster (cache hits)
```

---

### 22. النشر بدون Tests
**❌ خطأ:**
```bash
git push origin main
# Direct to production!
```

**✅ الصحيح:**
```bash
# 1. تأكد:
npm run validate
# = typecheck + lint + tests

# 2. PR review
# 3. CI passes
# 4. ثم merge + deploy
```

---

### 23. تشغيل Migration على الإنتاج بدون Backup
**❌ خطأ:**
```bash
node deploy.js --db-push
# Schema change بدون backup!
```

**✅ الصحيح:**
```bash
# 1. Backup
bash scripts/daily-backup.sh

# 2. Test على staging
NODE_ENV=staging node deploy.js --db-push

# 3. ثم production
node deploy.js --db-push
```

---

### 24. عدم Restart بعد Env Change
**❌ خطأ:**
- تعديل .env ولكن النظام يستخدم القيمة القديمة

**✅ الصحيح:**
```bash
pm2 reload main-site --update-env
# أو
pm2 restart main-site
```

---

## 💼 الأخطاء التشغيلية

### 25. POS Session لا تُغلق
**❌ خطأ:**
- الكاشير يترك الـ session مفتوحة آخر اليوم

**✅ الصحيح:**
- إغلاق إجباري نهاية كل يوم
- النظام يفرض ذلك (لا يمكن فتح session جديدة بدون إقفال القديمة)

---

### 26. عدم مطابقة Bank Recon شهرياً
**❌ خطأ:**
- تأجيل الـ recon لـ 6 أشهر

**✅ الصحيح:**
- شهرياً على الأقل
- ideally أسبوعياً
- الـ unmatched تتراكم وتصبح كابوس

---

### 27. تجاهل تنبيهات الانتهاء
**❌ خطأ:**
- تنبيه: ZATCA CSID ينتهي خلال 7 أيام → تجاهل

**✅ الصحيح:**
- جدد قبل 30 يوم
- لا تنتظر آخر لحظة

---

### 28. عدم Backup قبل Migration
**❌ خطأ:**
- migration كبير بدون backup

**✅ الصحيح:**
- backup كامل قبل أي تغيير schema
- اختبار rollback

---

## 👥 أخطاء HR

### 29. نسيان تسجيل GOSI
**❌ خطأ:**
- موظف سعودي بدون GOSI → غرامات شهرية

**✅ الصحيح:**
- التسجيل فوراً عند التوظيف
- النظام يذكّر تلقائياً

---

### 30. WPS submission متأخر
**❌ خطأ:**
- WPS submission بعد الـ 5 من الشهر

**✅ الصحيح:**
- جدولة الـ payroll في 28
- WPS in 1-3 من الشهر التالي
- قبل deadline by good margin

---

### 31. حساب EOS خطأ
**❌ خطأ:**
- حساب EOS لاستقالة بنفس قواعد التسريح

**✅ الصحيح:**
- استقالة (Article 85):
  - < 2 years: 0
  - 2-5: 1/3
  - 5-10: 2/3
  - 10+: full
- تسريح (Article 84): دائماً full

---

### 32. عدم احتساب الإجازات قبل الـ EOS
**❌ خطأ:**
- موظف يستقيل، ينسى احتساب رصيد الإجازات

**✅ الصحيح:**
- الـ EOS Settlement يحتوي:
  - راتب أيام العمل
  - **رصيد الإجازات السنوية** (× الراتب اليومي)
  - EOS
  - خصم القروض

---

## 🔄 أخطاء الـ Workflow

### 33. تخطي الـ Approval Workflow
**❌ خطأ:**
- المحاسب يرحّل JE 200K بدون approval

**✅ الصحيح:**
- النظام يفرض approval حسب القيمة
- لا تتجاوز الـ workflow
- لو urgent: استخدم الـ escalation path

---

### 34. عدم تسجيل سبب الرفض
**❌ خطأ:**
- رفض request بدون تعليق

**✅ الصحيح:**
- دائماً اذكر السبب
- يساعد الـ requester يفهم
- يُسجل في audit log

---

### 35. تجاوز الـ Period Lock
**❌ خطأ:**
- محاولة تعديل JE في فترة مقفلة

**✅ الصحيح:**
- استخدم reversal في الفترة الحالية
- إذا اضطررت لفتح الفترة: ✅ Owner approval + audit log

---

## 🤖 أخطاء AI

### 36. إرسال بيانات حساسة لـ Gemini
**❌ خطأ:**
```typescript
const prompt = `العميل أحمد (هوية 1234567890، رصيد 50K)`;
await gemini.generate(prompt);
// PII مرسلة لـ Google!
```

**✅ الصحيح:**
```typescript
const filtered = privacyFilter(data);
// "العميل XXX (رصيد 50K)"
await gemini.generate(filtered);
```

---

### 37. الاعتماد 100% على AI
**❌ خطأ:**
- الـ AI Auditor يرفض فاتورة → نرفضها بلا مراجعة

**✅ الصحيح:**
- AI يقترح، البشر يقررون
- خاصة للقرارات المالية
- Human-in-the-loop

---

### 38. عدم Cost Tracking
**❌ خطأ:**
- كل feature يستدعي Gemini بدون تتبع
- نهاية الشهر: $5000 fees!

**✅ الصحيح:**
- AI cost tracker
- per-feature, per-tenant
- alerts عند تجاوز budget

---

## 📝 أخطاء البرمجة

### 39. استخدام `any` في TypeScript
**❌ خطأ:**
```typescript
function process(data: any) { ... }
```

**✅ الصحيح:**
```typescript
function process(data: unknown) {
    if (typeof data === 'string') {
        // ...
    }
}
// أو type narrowing
```

---

### 40. console.log في Production
**❌ خطأ:**
```typescript
console.log('User logged in', user);
```

**✅ الصحيح:**
```typescript
import logger from '@/lib/logger';
logger.info('User logged in', { userId: user.id });
```

---

### 41. عدم استخدام Zod
**❌ خطأ:**
```typescript
const { name, email } = req.body;
// no validation!
```

**✅ الصحيح:**
```typescript
const schema = z.object({
    name: z.string().min(3),
    email: z.string().email()
});

const parsed = schema.safeParse(req.body);
if (!parsed.success) {
    return ValidationError;
}
```

---

### 42. Inline Styles
**❌ خطأ:**
```tsx
<div style={{ color: 'red', padding: '10px' }}>
```

**✅ الصحيح:**
```tsx
<div className="text-red-500 p-2.5">
// Tailwind utilities
```

---

### 43. Hardcoded Strings (i18n)
**❌ خطأ:**
```tsx
<button>حفظ</button>
```

**✅ الصحيح:**
```tsx
<button>{t('save')}</button>
```

---

### 44. تجاهل Error Handling
**❌ خطأ:**
```typescript
const data = await fetch('/api/data').then(r => r.json());
// إذا فشل؟
```

**✅ الصحيح:**
```typescript
try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data;
} catch (e) {
    logger.error('Failed to fetch', e);
    showToast('فشل التحميل');
    return null;
}
```

---

### 45. عدم استخدام React Server Components
**❌ خطأ:**
```tsx
'use client';
// كل صفحة client component!
```

**✅ الصحيح:**
```tsx
// Server Component افتراضياً (لا 'use client')
export default async function Page() {
    const data = await prisma.product.findMany();
    return <ProductList data={data} />;
}
```

---

## 🎨 أخطاء UX

### 46. عدم Loading States
**❌ خطأ:**
- النقر على زر → صفحة فارغة لـ 5 ثوان

**✅ الصحيح:**
```tsx
{isLoading ? <Skeleton /> : <Data />}
```

---

### 47. الـ Forms بدون Validation
**❌ خطأ:**
- Submit form بحقول فارغة → 500 error

**✅ الصحيح:**
- React Hook Form + Zod
- inline validation
- helpful error messages

---

### 48. عدم وجود Confirmations
**❌ خطأ:**
- زر "حذف" مباشرة بدون confirmation

**✅ الصحيح:**
```tsx
<button onClick={() => {
    if (confirm('هل أنت متأكد؟')) {
        deleteItem();
    }
}}>حذف</button>
```

---

### 49. الـ Tables بدون Search/Filter
**❌ خطأ:**
- جدول 1000 صف بدون filter

**✅ الصحيح:**
- TanStack Table مع:
  - Search bar
  - Column filters
  - Pagination
  - Sort

---

### 50. عدم Mobile-Friendly
**❌ خطأ:**
- Form layout للـ desktop فقط

**✅ الصحيح:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// Mobile first
```

---

## 🎯 خلاصة الـ Best Practices

### قواعد ذهبية:
1. ✅ **Read before write** — اقرأ الـ Brain قبل الإنشاء
2. ✅ **Test before deploy**
3. ✅ **Backup before change**
4. ✅ **Audit log everything**
5. ✅ **Approval for critical actions**
6. ✅ **Validate inputs (Zod)**
7. ✅ **Use Decimal for money**
8. ✅ **Multi-tenant isolation**
9. ✅ **Soft delete financial records**
10. ✅ **Documentation**

### Mantras:
> "It works on my machine" — Not enough. Test in staging.
> "I'll backup later" — Backup NOW.
> "Just a small change" — Code review.
> "No one will notice" — Audit log will.
> "It's just a number" — Use Decimal.
> "AI said so" — Verify yourself.
