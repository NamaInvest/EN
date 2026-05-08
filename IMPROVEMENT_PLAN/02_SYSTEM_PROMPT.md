# 2️⃣ System Prompt | البرومبت الأساسي

## 🔍 الحالة الحالية

### 🔴 الفجوات الكاملة
- **لا personas موحّدة:** كل route يبني System Prompt منفرد
- **3 نسخ مختلفة لـ CFO Assistant** عبر `/api/ai-cfo`, `/api/ai/cfo`, `/api/ai-cfo/report`
- **لا Few-shot Examples Library**
- **لا Output Schema Enforcement** (بعض routes تستخدم Zod للـ output، الأغلبية لا)
- **لا Refusal Patterns** للأسئلة الحساسة
- **لا PII Guardrails** (يمكن للـ AI كشف IBAN, SSN, إلخ)

---

## 🎯 الخطة التفصيلية

### البنية المقترحة
```
src/lib/prompts/system/
  ├── personas/
  │   ├── base.persona.ts                 [الأساس المشترك]
  │   ├── cfo.persona.ts                  [المدير المالي]
  │   ├── auditor.persona.ts              [المراجع الداخلي]
  │   ├── copilot.persona.ts              [المساعد العام]
  │   ├── nlq.persona.ts                  [محوّل اللغة]
  │   ├── fraud-detector.persona.ts       [كاشف الاحتيال]
  │   ├── ocr-extractor.persona.ts        [مستخرج الفواتير]
  │   ├── procurement.persona.ts          [مساعد المشتريات]
  │   └── hr-assistant.persona.ts         [مساعد الموارد البشرية]
  ├── guardrails/
  │   ├── output-schemas.ts               [Zod schemas]
  │   ├── refusal-patterns.ts             [متى يرفض]
  │   ├── pii-redactor.ts                 [إخفاء IBAN/SSN]
  │   ├── safety-rules.ts                 [قواعد الأمان]
  │   └── content-filter.ts               [فلترة المحتوى]
  ├── few-shot/
  │   ├── cfo-examples.json               [20 مثال]
  │   ├── ocr-examples.json               [30 مثال]
  │   ├── nlq-examples.json               [50 مثال]
  │   ├── fraud-examples.json             [25 مثال]
  │   └── audit-examples.json             [15 مثال]
  └── compose.ts                          [يبني System Prompt كامل]
```

---

## 📝 مثال — base.persona.ts

```typescript
export const BASE_PERSONA = `
أنت مساعد ذكاء اصطناعي متخصص في نظام Namasoft ERP السعودي.

## القواعد الأساسية:
1. تجاوب باللغة العربية افتراضياً، إلا لو طُلب الإنجليزية صراحة.
2. التزم بمعايير SOCPA و IFRS و ZATCA Phase 2.
3. لا تكشف معلومات تنتمي لمستأجر آخر (cross-tenant leak).
4. لا تكشف PII (الرقم الوطني، IBAN، أرقام البطاقات).
5. لو سُئلت عن شيء خارج نطاقك، اعتذر بوضوح.
6. كل رقم مالي يُعرض بصيغة تجارية: ١٢,٣٤٥.٦٧ ريال.
7. لو كان السؤال يتطلب تنفيذ عملية حرجة (إنشاء قيد، تعديل فاتورة)، اطلب تأكيد صريح أولاً.

## السياق المتاح لك:
- المستأجر: {{tenantName}}
- المستخدم: {{userName}} ({{userRole}})
- الفرع: {{branchName}}
- الفترة المحاسبية: {{fiscalPeriod}}
- التاريخ: {{currentDate}}
`;
```

---

## 📝 مثال — cfo.persona.ts

```typescript
export const CFO_PERSONA = `
${BASE_PERSONA}

## دورك المحدد:
أنت المدير المالي الافتراضي. تركيزك على:
- تحليل التدفق النقدي (Cash Flow)
- الذمم المدينة والدائنة (AR/AP)
- مؤشرات الربحية (Margins, EBITDA)
- التنبؤ بالعجز النقدي
- اقتراح إجراءات تحصيل/سداد

## نبرة الصوت:
- مهني، مختصر، عملي
- أرقام دائماً + سياق
- تنبيهات حمراء/صفراء/خضراء واضحة

## أمثلة (Few-Shot):
${FEW_SHOT_CFO_EXAMPLES}

## مخطط الإخراج (JSON Schema):
${CFO_OUTPUT_SCHEMA}
`;
```

---

## 📝 Output Schema Example

```typescript
// guardrails/output-schemas.ts
import { z } from 'zod';

export const CFOAlertSchema = z.object({
  level: z.enum(['critical', 'warning', 'info']),
  category: z.enum(['cash', 'ar', 'ap', 'profit', 'compliance']),
  title: z.string().max(100),
  message: z.string().max(500),
  affectedAmount: z.number().optional(),
  recommendation: z.string().max(300),
  actions: z.array(z.object({
    label: z.string(),
    route: z.string(),
  })).max(3),
});

export const CFOResponseSchema = z.object({
  summary: z.string().max(1000),
  alerts: z.array(CFOAlertSchema),
  metrics: z.record(z.string(), z.number()),
  generatedAt: z.string().datetime(),
});
```

---

## 🛡️ Guardrails (PII Redaction)

```typescript
// guardrails/pii-redactor.ts
const PATTERNS = {
  IBAN_SA: /SA\d{22}/g,
  NATIONAL_ID: /[12]\d{9}/g,
  PHONE_SA: /(\+966|05)\d{8}/g,
  CARD: /\d{16}/g,
};

export function redactPII(text: string): string {
  return Object.entries(PATTERNS).reduce(
    (acc, [type, pattern]) => acc.replace(pattern, `[${type}_REDACTED]`),
    text
  );
}
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| Personas موحّدة | 0 | 8 |
| Few-shot examples | 0 | 140+ |
| Output schemas | متفرقة | كل persona |
| PII leaks risk | عالي | محمي |
| Refusal patterns | لا | 30+ pattern |

---

## ⏱️ الجدول الزمني
- **المدة:** 14 يوم عمل
- **المطور:** 1 senior + لغوي/مالي للمراجعة
- **الأولوية:** 🟡 متوسطة (مكمّل لـ Prompt Engineering)

---

## ✅ معايير القبول
- [x] 8 personas مكتوبة + موثّقة
- [x] 140+ few-shot examples من بيانات حقيقية
- [x] Output schema لكل persona مع Zod
- [x] PII redactor مفعّل قبل كل LLM call
- [x] Refusal tests (لو سُئل عن tenant آخر، يرفض)
- [x] دليل المطور لإضافة persona جديدة
