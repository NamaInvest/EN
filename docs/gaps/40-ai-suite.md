# النقص #40: AI Suite (CFO + Bank + Auditor + Copilot + Demand + Fraud + Sales Coach + SCM) — مواصفات

> **المرجعيات:** OpenAI、Google Gemini、Anthropic Claude、SAP Joule、Salesforce Einstein、Microsoft Copilot

---

## 1. البرومنت

```
وسّع AI Suite بثمانية محركات:

موجود (skeleton): /api/ai/cfo, /ai/bank-reconciliation, /ai-auditor, /ai/copilot, /ai/demand-forecast, /ai/fraud-monitoring, /ai/sales-coach, /ai/predictive-scm

النواقص:
A) AI CFO: cash flow forecasting, anomaly detection, recommendations
B) AI Bank Recon: auto-match transactions, learn rules
C) AI Auditor: risk scoring, control testing, policy violations
D) AI Copilot: conversational assistant, query in natural language
E) AI Demand Forecast: ML models for inventory
F) AI Fraud Monitoring: pattern detection, anomalies
G) AI Sales Coach: opportunity scoring, recommendations
H) AI Predictive SCM: optimization, what-if scenarios
I) AI Document Processing: invoice OCR, contract extraction
J) Governance: prompt logging, hallucination detection, training data control

APIs (35+), UI (15 pages), Tests 60+
```

---

## 2. السيناريوهات (10)

### A — AI CFO
```
- /finance/cfo-ai
- "Why did expenses spike last month?"
- AI analyzes: vendor X invoiced 3× normal
- Drill-down provided
- Recommendations: review contract, alternative vendor
```

### B — AI Bank Reconciliation
```
- 200 transactions to reconcile
- AI suggests matches with confidence
- Learns from accepted matches
- Over time: 95%+ auto-match rate
```

### C — AI Auditor
```
- Continuous monitoring
- Flags: split transactions to avoid approval, unusual hours, etc.
- Score per user/transaction
- Risk dashboard
```

### D — AI Copilot
```
- "Show me top customers by revenue this quarter"
- AI generates SQL → query → formatted answer
- "What's our cash position?"
- "Create invoice for ABC Corp 5000 SAR"
- Multi-turn conversation
```

### E — AI Demand Forecast
```
- 12 months historical data
- AI predicts next 90 days demand per SKU
- Considers: seasonality, trends, promotions
- Suggests reorder qty + dates
- Confidence intervals
```

### F — Fraud Detection
```
- Real-time monitoring
- Pattern: same vendor invoice numbers reused, round numbers, weekend submissions
- Alerts → review queue
- ML improves over time
```

### G — Sales Coach
```
- Analyzes opp data + CRM activity
- Suggests:
  - Best next action (call/email/demo)
  - Probability of winning
  - Risk factors (no activity 14 days)
  - Similar deals won (best practices)
```

### H — Predictive SCM
```
- "What if demand grows 20%?"
- AI simulates: production capacity, supplier risk, working capital impact
- Recommends: increase safety stock, secure secondary suppliers
```

### I — Invoice OCR + Auto-coding
```
- Vendor invoice scanned
- AI extracts: vendor, amount, line items, dates
- Suggests GL accounts based on history
- Flags discrepancies (PO match)
- 80%+ auto-processed
```

### J — Governance
```
- All AI calls logged (input + output + latency)
- Prompt templates versioned
- Hallucination detection (cross-validation)
- Cost tracking per user/department
- Compliance: data residency
```

---

## 3. تدفق البيانات

```
[AI Query]
POST /ai/copilot { prompt, context, history? }
   ↓ enrich with relevant context (RAG)
   ↓ call LLM (Gemini/OpenAI/Claude)
   ↓ parse response
   ↓ if action requested → execute (with permission check)
   ↓ log call (governance)
   ↓ return response

[Continuous Monitoring]
Cron / event-driven:
   ↓ run AI rules (fraud, audit, anomaly)
   ↓ score transactions
   ↓ flag suspicious
   ↓ alert appropriate users
```

---

## 4. Schema

```prisma
model AiModel {
  id              Int       @id @default(autoincrement())
  modelCode       String    @unique
  name            String
  
  type            String    // 'LLM' | 'CLASSIFIER' | 'REGRESSOR' | 'OCR' | 'EMBEDDINGS'
  provider        String    // 'OPENAI' | 'GEMINI' | 'CLAUDE' | 'INTERNAL'
  modelId         String    // 'gpt-4', 'gemini-1.5-pro', 'claude-opus-4'
  
  capabilities    String[]
  
  costPer1kTokens Decimal?  @db.Decimal(20,8)
  
  active          Boolean   @default(true)
}

model AiPromptTemplate {
  id              Int       @id @default(autoincrement())
  templateCode    String    @unique
  
  name            String
  category        String    // 'CFO' | 'COPILOT' | 'AUDIT' | etc.
  
  systemPrompt    String    @db.Text
  userPromptTemplate String @db.Text  // with {{variables}}
  
  modelId         Int
  
  temperature     Decimal?  @db.Decimal(3,2)
  maxTokens       Int?
  
  version         Int       @default(1)
  active          Boolean   @default(true)
}

model AiCall {
  id              BigInt    @id @default(autoincrement())
  
  promptTemplateId Int?
  modelId         Int
  
  userId          String?
  tenantId        Int?
  
  category        String?
  context         Json?     // input data
  
  systemPrompt    String?   @db.Text
  userPrompt      String    @db.Text
  
  response        String?   @db.Text
  responseStructured Json?
  
  inputTokens     Int?
  outputTokens    Int?
  latencyMs       Int?
  cost            Decimal?  @db.Decimal(20,8)
  
  // Quality
  rated           Int?      // 1-5 by user
  flaggedHallucination Boolean @default(false)
  
  // Action
  actionTaken     String?   // if AI suggested action
  
  status          String    @default("SUCCESS")  // SUCCESS | ERROR | TIMEOUT
  errorMessage    String?
  
  occurredAt      DateTime  @default(now())
  
  @@index([userId, occurredAt])
  @@index([tenantId, category, occurredAt])
}

model AiCfoInsight {
  id              Int       @id @default(autoincrement())
  insightType     String    // 'ANOMALY' | 'TREND' | 'OPPORTUNITY' | 'RISK' | 'RECOMMENDATION'
  category        String    // 'CASH' | 'AR' | 'AP' | 'BUDGET' | 'PROFITABILITY'
  
  title           String
  description     String    @db.Text
  
  severity        String    // 'INFO' | 'WARNING' | 'CRITICAL'
  
  data            Json
  
  generatedAt     DateTime  @default(now())
  
  acknowledgedAt  DateTime?
  acknowledgedByUserId String?
  
  resolvedAt      DateTime?
  resolution      String?
}

model AiBankRule {
  id              Int       @id @default(autoincrement())
  bankAccountId   Int?
  
  conditions      Json
  matchTarget     String    // 'JE' | 'PAYMENT' | 'CHECK'
  matchTargetData Json
  
  successCount    Int       @default(0)
  failureCount    Int       @default(0)
  
  active          Boolean   @default(true)
  learnedFromMatchId Int?
  
  createdAt       DateTime  @default(now())
}

model AiAuditAlert {
  id              Int       @id @default(autoincrement())
  alertType       String    // 'SPLIT_TXN' | 'ROUND_AMOUNT' | 'AFTER_HOURS' | 'UNUSUAL_USER' | 'POLICY_VIOLATION'
  
  severity        String    // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  
  entityType      String
  entityId        Int
  userId          String?
  
  description     String    @db.Text
  evidence        Json
  
  riskScore       Int       // 0-100
  
  status          String    @default("OPEN")  // OPEN | INVESTIGATING | DISMISSED | CONFIRMED
  
  reviewedByUserId String?
  reviewedAt      DateTime?
  
  detectedAt      DateTime  @default(now())
}

model AiForecast {
  id              Int       @id @default(autoincrement())
  forecastType    String    // 'DEMAND' | 'CASH_FLOW' | 'REVENUE' | 'CHURN'
  
  scope           Json      // {productId, period, scenario}
  
  forecastData    Json      // [{date, value, lower95, upper95}]
  
  confidence      Decimal?  @db.Decimal(5,2)
  modelVersion    String?
  
  generatedAt     DateTime  @default(now())
  
  actualVsForecast Json?    // updated as actuals come in
  accuracy        Decimal?  @db.Decimal(5,2)
}

model AiCopilotChat {
  id              Int       @id @default(autoincrement())
  userId          String
  
  startedAt       DateTime  @default(now())
  lastMessageAt   DateTime
  
  title           String?   // auto-generated from first message
  
  messages        AiCopilotMessage[]
}

model AiCopilotMessage {
  id              Int       @id @default(autoincrement())
  chatId          Int
  chat            AiCopilotChat @relation(fields: [chatId], references: [id], onDelete: Cascade)
  
  role            String    // 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL'
  content         String    @db.Text
  
  toolCalls       Json?     // function calls
  toolResults     Json?
  
  aiCallId        BigInt?
  
  createdAt       DateTime  @default(now())
}

model AiTrainingExample {
  id              Int       @id @default(autoincrement())
  category        String
  inputData       Json
  expectedOutput  Json
  notes           String?
  qualityScore    Int?
  approvedByUserId String?
}
```

---

## 5. Forms (8)

A: AI Model Configuration
B: Prompt Template Editor
C: AI Call Review (governance)
D: Insight Acknowledgement
E: Bank Rule Approval (from AI suggestion)
F: Audit Alert Investigation
G: Forecast Setup
H: Training Example Submission

---

## 6. Tables (8)

A: AI Calls (governance log)
B: CFO Insights
C: Audit Alerts
D: Forecasts (with accuracy)
E: Copilot Chat History
F: Bank Rules (learned)
G: Cost per Department
H: Hallucination Reports

---

## 7. Buttons (28+)

| Button | Color | Permission |
|--------|-------|------------|
| btn-cfo-ask | اسأل CFO AI | 🟢 finance |
| btn-cfo-explain | اشرح | 🟦 finance |
| btn-cfo-recommend | اقترح | 🟦 finance |
| btn-bank-ai-match | مطابقة بـ AI | 🟦 ar |
| btn-bank-ai-learn-rule | حفظ كقاعدة | 🟢 ar |
| btn-audit-ai-scan | فحص الشذوذ | 🟦 audit |
| btn-audit-alert-investigate | تحقيق | 🟡 audit |
| btn-audit-alert-dismiss | تجاهل | 🔴 audit + reason |
| btn-copilot-open | فتح Copilot | 🟢 anyone |
| btn-copilot-execute-action | تنفيذ الإجراء | 🟢 user (with permission) |
| btn-copilot-rate | تقييم | 🟢 user |
| btn-copilot-flag | إبلاغ خطأ | 🟡 user |
| btn-forecast-generate | توليد توقع | 🟦 planning |
| btn-forecast-compare-actual | مقارنة بالفعلي | ⬜ planning |
| btn-forecast-export | تصدير | ⬜ planning |
| btn-fraud-investigate | تحقيق احتيال | 🟡 audit |
| btn-fraud-confirm | تأكيد | 🔴 audit + cfo |
| btn-fraud-false-positive | إيجابية كاذبة | ⬜ audit |
| btn-sales-coach-suggest | اقتراحات | 🟦 sales |
| btn-sales-coach-feedback | تغذية راجعة | 🟢 sales |
| btn-scm-simulate | محاكاة | 🟦 ops |
| btn-scm-recommend | توصيات | 🟦 ops |
| btn-ocr-process-invoice | معالجة فاتورة | 🟦 ap |
| btn-ocr-correct | تصحيح | 🟢 ap |
| btn-ocr-confirm | تأكيد | 🟢 ap |
| btn-ai-prompt-template-edit | + قالب | 🟢 admin |
| btn-ai-model-switch | تبديل النموذج | 🟦 admin |
| btn-ai-cost-report | تقرير التكلفة | ⬜ cfo |

---

## 8. Search & Filters

- AI Calls: user, category, date, cost, hallucination flag
- Insights: type, severity, status
- Audit Alerts: type, severity, status, user
- Copilot: chat date, user
- Forecasts: type, accuracy

---

## 9. Reports

- AI Usage by Department
- AI Cost Tracking
- AI Accuracy (forecasts vs actual)
- Audit Alert Analysis
- Copilot Adoption
- Fraud Detection Effectiveness
- Bank Rule Effectiveness

---

## 10. Dashboards

- KPIs: AI Calls Today / Cost MTD / Forecast Accuracy / Alerts Open
- Charts: Cost trend, Forecast vs actual
- Lists: Critical insights, Recent alerts

---

## 11. Notifications

- Critical insight detected
- Fraud alert
- Forecast updated
- AI cost approaching budget
- Hallucination flagged
- New training example needed

---

## 12. Permissions

| Action | User | Manager | CFO | Admin |
|--------|------|---------|-----|-------|
| Use Copilot | ✓ | ✓ | ✓ | ✓ |
| View own chats | ✓ | ✓ | ✓ | ✓ |
| View team chats | ✗ | ✓ | ✓ | ✓ |
| View all calls | ✗ | ✗ | ✗ | ✓ |
| Configure prompts | ✗ | ✗ | ✗ | ✓ |
| AI cost reports | ✗ | ✗ | ✓ | ✓ |
| Investigate alerts | ✗ | ✓ | ✓ | ✓ |
| Confirm fraud | ✗ | ✗ | ✓ | ✓ |

---

## 13. Integrations

- OpenAI / Anthropic / Google
- Vector DBs (Pinecone, Weaviate)
- LangChain / LlamaIndex
- Tracing (Langsmith, Helicone)
- Anomaly detection libraries
- ML platforms (Databricks, Sagemaker)

---

## 14. Shortcuts

- `Ctrl+Space` Open Copilot
- `Ctrl+/` Quick AI search

---

## 15. Mobile / Print

- Mobile Copilot (voice + text)
- Print: AI insights reports

---

## 16. Audit / Governance

- Every AI call logged
- Prompt templates versioned
- Sensitive data filtered before LLM
- Hallucination cross-validation
- Cost limits enforced
- PII redaction

---

## 17. Tests

```typescript
describe('Copilot SQL Generation', () => { /* natural lang → query */ })
describe('Forecast Accuracy', () => { /* MAPE, RMSE */ })
describe('Fraud Detection', () => { /* known patterns flagged */ })
describe('Hallucination', () => { /* detection mechanism */ })
describe('Cost Tracking', () => { /* token counting */ })
describe('Permission Check', () => { /* AI respects user permissions */ })
```

---

## 18. Edge Cases

| Case | Behavior |
|------|----------|
| LLM down | fallback to rules-based |
| Cost exceeds budget | throttle or block |
| Hallucination detected | warn user + log |
| User without permission asks AI | AI refuses |
| Multiple AI providers | failover |
| Prompt injection attempt | sanitize + log |

---

**نهاية #40** • 10 سيناريوهات • 11 جداول • 8 forms • 8 grids • 28 button • 7 reports
