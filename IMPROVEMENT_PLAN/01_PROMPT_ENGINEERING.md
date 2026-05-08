# 1️⃣ Prompt Engineering | هندسة البرومبت

## 🔍 الحالة الحالية

### ✅ الموجود
- **Prompt Registry:** [src/lib/prompts/registry.ts](../src/lib/prompts/registry.ts)
- **DB Table:** `promptTemplate` مع versioning و tenantId
- **Admin UI:** [src/app/(dashboard)/admin/prompts/page.tsx](../src/app/(dashboard)/admin/prompts/page.tsx)
- **Token Budget:** [src/lib/token-budget.ts](../src/lib/token-budget.ts)
- **Cost Logging:** `logPromptUsage()` في الـ Registry

### 🔴 الفجوات
| الفجوة | الموقع |
|--------|--------|
| 6+ برومبتات Hardcoded تتجاوز الـ Registry | عدة routes |
| لا A/B Testing | — |
| Token Budget غير مُعمّم | 4/8 routes فقط |
| لا Cost Dashboard per tenant | — |
| لا Eval Suite | — |
| لا Prompt Linter | — |

### 🚨 برومبتات يتيمة (يجب هجرتها)
1. [src/app/api/ai-cfo/route.ts](../src/app/api/ai-cfo/route.ts) — CFO Analysis
2. [src/app/api/ai-cfo/report/route.ts](../src/app/api/ai-cfo/report/route.ts) — CFO Daily Report
3. [src/app/api/purchases/ocr/route.ts](../src/app/api/purchases/ocr/route.ts) — Invoice OCR
4. [src/app/api/ai/fraud-monitoring/route.ts](../src/app/api/ai/fraud-monitoring/route.ts)
5. [src/app/api/ai/copilot/chat/route.ts](../src/app/api/ai/copilot/chat/route.ts)
6. [src/app/api/ai-auditor/route.ts](../src/app/api/ai-auditor/route.ts) (تحقق)

---

## 🎯 الخطة التفصيلية

### المرحلة 1.1 — البنية (5 أيام)
```
src/lib/prompts/
  ├── registry.ts                    [موجود — تحسين]
  ├── library/                       [جديد]
  │   ├── cfo/
  │   │   ├── daily-summary.prompt.ts
  │   │   ├── monthly-analysis.prompt.ts
  │   │   └── alerts.prompt.ts
  │   ├── ocr/
  │   │   └── invoice-extract.prompt.ts
  │   ├── fraud/
  │   │   ├── invoice-anomaly.prompt.ts
  │   │   └── treasury-suspicious.prompt.ts
  │   ├── copilot/
  │   │   └── general-assistant.prompt.ts
  │   ├── nlq/
  │   │   └── query-to-sql.prompt.ts
  │   └── audit/
  │       └── daily-audit.prompt.ts
  ├── eval/                          [جديد]
  │   ├── golden-datasets/
  │   ├── llm-judge.ts
  │   └── ragas-runner.ts
  ├── ab-testing/                    [جديد]
  │   ├── traffic-splitter.ts
  │   └── champion-challenger.ts
  └── cost/                          [جديد]
      ├── tracker.ts
      └── budget-enforcer.ts
```

### المرحلة 1.2 — Migration (4 أيام)
- لكل برومبت hardcoded:
  1. استخراج النص لملف `.prompt.ts`
  2. إضافة `version: '1.0.0'`, `model`, `temperature`, `maxTokens`
  3. تسجيله في الـ Registry
  4. استبدال الكود بـ `await getPrompt('module.action', { vars })`

### المرحلة 1.3 — A/B Testing (3 أيام)
```typescript
// مثال الاستخدام
const result = await getPrompt('cfo.daily_summary', {
  variables: { tenantId, date },
  enableABTest: true,        // 90% champion, 10% challenger
  fallbackOnError: true,
});
```

### المرحلة 1.4 — Cost Dashboard (4 أيام)
- صفحة `/admin/prompts/cost`
- مقاييس: tokens/يوم, cost/يوم per tenant per prompt
- Alerts عند تجاوز الميزانية
- Champion/Challenger comparison charts

### المرحلة 1.5 — Eval Suite (5 أيام)
- 50 golden test case لكل persona
- LLM-as-judge (Gemini-flash يحكم على Gemini-pro)
- RAGAS metrics: faithfulness, relevance, precision
- CI integration: PR لا يُقبل لو الـ score < threshold

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| Hardcoded prompts | 6+ | 0 |
| Prompt versions tracked | 0 | كل البرومبتات |
| A/B Tests فعّالة | 0 | 5+ |
| Cost visibility | لا | per-tenant |
| Eval coverage | 0% | 80% |

---

## ⏱️ الجدول الزمني
- **المدة:** 21 يوم عمل (~4 أسابيع)
- **المطور:** 1 senior + AI specialist part-time
- **الأولوية:** 🟡 متوسطة (بعد الأمن والمحاسبة)

---

## ✅ معايير القبول
- [ ] لا يوجد prompt hardcoded في codebase
- [ ] كل prompt له version + metadata في DB
- [ ] Cost dashboard يعرض real-time data
- [ ] 5 A/B tests فعّالة على الأقل
- [ ] Eval suite يعمل في CI
- [ ] Documentation للمطورين

---

## 📚 مراجع
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [LangSmith Docs](https://docs.smith.langchain.com/)
- [Helicone Cost Tracking](https://www.helicone.ai/)
- [RAGAS Evaluation](https://docs.ragas.io/)
