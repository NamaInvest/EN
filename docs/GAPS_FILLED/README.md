# Gap-Filling Implementations

> 10 ميزات حقيقية تم بناؤها لسد الفجوات مقابل SAP / Oracle / NetSuite / Odoo.
> ملفات الإنجين والـ API و الاختبارات تحت `src/lib/gaps/` و `src/app/api/gaps/`.
> ⚠️ لم يُعدّل أي ملف موجود — كل الإضافات في مجلدات جديدة.

## ملخص ما تم بناؤه

| # | الميزة | المحرك | API | الاختبارات |
|---|---|---|---|---|
| 1 | Anomaly Detection (10 detectors) | [anomaly-detection-engine.ts](../../src/lib/gaps/anomaly-detection-engine.ts) | [/api/gaps/anomaly](../../src/app/api/gaps/anomaly/route.ts) | ✅ |
| 2 | AI Anomaly Explanation | [anomaly-explanation.ts](../../src/lib/gaps/anomaly-explanation.ts) | ↑ | ✅ |
| 3 | Demand Forecast v2 (P50/P90/P99) | [demand-forecast-v2-engine.ts](../../src/lib/gaps/demand-forecast-v2-engine.ts) | [/api/gaps/forecast-v2](../../src/app/api/gaps/forecast-v2/route.ts) | ✅ |
| 4 | ESG / Sustainability | [esg-engine.ts](../../src/lib/gaps/esg-engine.ts) | [/api/gaps/esg](../../src/app/api/gaps/esg/route.ts) | ✅ |
| 5 | EVM (Earned Value Mgmt) | [evm-engine.ts](../../src/lib/gaps/evm-engine.ts) | [/api/gaps/evm](../../src/app/api/gaps/evm/route.ts) | ✅ |
| 6 | ABC Costing + TDABC | [abc-costing-engine.ts](../../src/lib/gaps/abc-costing-engine.ts) | [/api/gaps/abc-costing](../../src/app/api/gaps/abc-costing/route.ts) | ✅ |
| 7 | OLAP Cube | [olap-cube-engine.ts](../../src/lib/gaps/olap-cube-engine.ts) | (helper) | ✅ |
| 8 | Customer Portal v2 | [customer-portal-v2-engine.ts](../../src/lib/gaps/customer-portal-v2-engine.ts) | (helper) | — |
| 9 | Vendor Portal v2 / SRM | [vendor-portal-v2-engine.ts](../../src/lib/gaps/vendor-portal-v2-engine.ts) | (helper) | — |
| 10 | Document AI Extraction | [document-ai-extraction.ts](../../src/lib/gaps/document-ai-extraction.ts) | (helper) | — |

## بنية الإضافات

```
src/lib/gaps/
├── index.ts                          # barrel export
├── anomaly-detection-engine.ts       # 10 detectors
├── anomaly-explanation.ts            # AI explanations
├── demand-forecast-v2-engine.ts      # Holt-Winters + bootstrap
├── esg-engine.ts                     # Scope 1/2/3 emissions
├── evm-engine.ts                     # PMI EVM standard
├── abc-costing-engine.ts             # Activity-Based Costing
├── olap-cube-engine.ts               # multi-dim aggregation
├── customer-portal-v2-engine.ts      # full B2B self-service
├── vendor-portal-v2-engine.ts        # full SRM
├── document-ai-extraction.ts         # vision LLM extraction
└── __tests__/engines.test.ts         # unit tests

src/app/api/gaps/
├── anomaly/route.ts                  # GET + POST
├── forecast-v2/route.ts              # GET
├── esg/route.ts                      # GET + POST
├── evm/route.ts                      # POST
└── abc-costing/route.ts              # POST with ?action

docs/GAPS_FILLED/
├── README.md (this file)
├── SCHEMA_DELTA_PROPOSAL.md          # schema additions needed
├── 01-anomaly-detection.md           # prompt + scenario + flow
├── 02-demand-forecast.md
├── 03-esg.md
├── 04-evm.md
├── 05-abc-costing.md
├── 06-olap-cube.md
├── 07-customer-portal.md
├── 08-vendor-portal.md
└── 09-document-ai.md
```

## كيفية التشغيل

### 1. تثبيت الـ pgvector (إن لزم لـ RAG لاحقاً)
لا حاجة الآن — الإضافات الحالية لا تستخدم vector.

### 2. تطبيق Schema Delta
راجع [SCHEMA_DELTA_PROPOSAL.md](SCHEMA_DELTA_PROPOSAL.md) واطبق ما يلزم:
```bash
npx prisma migrate dev --name gaps_filling_2026_05
```

### 3. تشغيل الاختبارات
```bash
npm run test -- src/lib/gaps
# أو
npx vitest run src/lib/gaps
```

### 4. اختبار الـ APIs محلياً
```bash
npm run dev

# Anomaly detection
curl "http://localhost:3000/api/gaps/anomaly?tenantId=YOUR_ID&windowDays=30"

# Demand forecast
curl "http://localhost:3000/api/gaps/forecast-v2?tenantId=ID&productId=P1&warehouseId=W1"

# ESG calculation
curl -X POST http://localhost:3000/api/gaps/esg -H "Content-Type: application/json" -d '{
  "entries": [
    { "date": "2026-05-01T00:00:00Z", "scope": 1, "factorKey": "DIESEL_LITER", "qty": 500 },
    { "date": "2026-05-01T00:00:00Z", "scope": 2, "factorKey": "ELECTRICITY_KWH_SA", "qty": 12000 }
  ],
  "revenue": 2000000,
  "employeeCount": 75
}'

# EVM
curl -X POST http://localhost:3000/api/gaps/evm -H "Content-Type: application/json" -d @sample-evm.json

# ABC Costing
curl -X POST 'http://localhost:3000/api/gaps/abc-costing?action=allocate' -H "Content-Type: application/json" -d @sample-abc.json
```

### 5. ربط Cron Jobs
أضف لـ scheduler:
```typescript
// scripts/cron-anomaly.ts
import { prisma } from '@/lib/prisma';
import { runAnomalyDetection } from '@/lib/gaps';
const tenants = await prisma.tenantAccount.findMany({ select: { id: true } });
for (const t of tenants) {
  await runAnomalyDetection({
    tenantId: t.id, prisma,
    windowDays: 30, scoreThreshold: 80, autoCreateFindings: true,
  });
}
```

ثم في cron-guard أو scheduled-action-engine، استدعِ هذا السكربت يومياً.

## ما لم نضفه (لم يكن ضمن الـ Top 10)

تلك الفجوات تظل بحاجة لمعالجة لاحقة:
- Mobile Apps (React Native) — يحتاج repo منفصل
- SARIE / Open Banking — يحتاج اتفاق مع البنك
- NPHIES (Saudi Health) — يحتاج تكامل CCHI
- IFRS 17 Insurance — لا حاجة الآن إلا لعميل تأمين
- Saudi Gov Integrations (Najiz, Etimad, Balady) — يحتاج credentials
- IoT + Predictive Maintenance — يحتاج TimescaleDB + ML service
- Marketing Journey Builder UI — يحتاج React Flow + design work

## كيف تستخدم AI Builder لإكمال الباقي

أنشئ أي ميزة جديدة في `src/lib/gaps/` بنفس النمط:

1. اكتب الـ engine TypeScript أولاً (pure logic، no DB أو DB optional)
2. اكتب unit tests فوراً (نفس الـ pattern)
3. أضف API route تحت `src/app/api/gaps/{feature}/route.ts`
4. أنشئ doc تحت `docs/GAPS_FILLED/NN-{feature}.md` مع: prompt + scenario + flow
5. أضف للـ index.ts
6. لو يحتاج schema: ضف لـ SCHEMA_DELTA_PROPOSAL.md بدلاً من التعديل على schema.prisma
