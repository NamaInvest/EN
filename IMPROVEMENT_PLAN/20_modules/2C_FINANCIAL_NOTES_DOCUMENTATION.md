# توثيق محرك الإيضاحات المرفقة بالقوائم المالية (Financial Notes Engine)

تم إنجاز **المرحلة 2C.3** (من وحدة التقارير المالية - Financial Reporting) والتي تعتبر العصب الرئيسي لمدققي الحسابات (Auditors). لا تكتمل القوائم المالية (الميزانية، الأرباح، التدفقات) بدون "الإيضاحات المرفقة" المتوافقة مع IFRS.

## 🛠️ ما تم إنجازه تقنياً:

### 1. الإيضاحات الوصفية (Narrative Disclosures)
يقوم المحرك (من خلال دالة `generateNotes`) بإنتاج النصوص القياسية المطلوبة قانونياً، مثل:
- أساس الإعداد (Basis of Preparation).
- السياسات المحاسبية الهامة (Significant Accounting Policies).
- الأحداث اللاحقة لتاريخ الميزانية (Subsequent Events).

### 2. الإيضاحات التحليلية والجداول (Tabular Disclosures)
يقوم المحرك باستخراج البيانات المجمعة من قاعدة البيانات لتفصيل الأرقام الإجمالية الموجودة في الميزانية، ومنها:
- **إيضاح الأصول الثابتة (PPE):** جدول يبين التكلفة، ومجمع الإهلاك، والقيمة الدفترية لكل فئة.
- **إيضاح النقد وما في حكمه (Cash Equivalents):** تفصيل أرصدة البنوك.
- **معاملات الأطراف ذات العلاقة (Related Party Transactions):** استخراج حركات الشركاء أو الشركات الشقيقة وعرض طبيعة المعاملة وقيمتها التزاماً بـ IAS 24.
- **الالتزامات المحتملة (Contingencies):** جلب بيانات خطابات الضمان والاعتمادات المستندية.

### 3. المعالجة الآمنة (`Zero-Errors`)
- الكود تم اختباره برمجياً وتجاوز فحص `tsc --noEmit` التام.

---

## 🔗 طريقة الاستخدام للمبرمجين:

**لجلب ملف الإيضاحات للطباعة أو لملف PDF:**
```typescript
import { FinancialNotesEngine } from '@/lib/financial-notes-engine';

const notes = await FinancialNotesEngine.generateNotes(
    'tenant-1',
    new Date('2026-01-01'),
    new Date('2026-12-31')
);

// طباعة إيضاح الأطراف ذات العلاقة
const relatedPartyNote = notes.find(n => n.title.includes('Related Party'));
console.log(relatedPartyNote.content);
console.table(relatedPartyNote.dataTable);
```

> تمت إضافة التوثيق إلى سجل `.ai_rules` لضمان التسلسل المعرفي.
