---
version: 1.0
last_updated: 2026-05-12
---

# LangChain Chains & Orchestration

> توثيق لكل الـ chains المستخدمة في AI workflows لـ نماسوفت.

## التطبيقات في `src/lib/`
- `langchain-chains.ts` — تعاريف الـ chains
- `langchain-orchestrator.ts` — runner
- `prompt-registry.ts` — central prompt library
- `prompt-cache.ts` — caching layer
- `llm-client.ts` — provider abstraction

## الـ Chains المعرّفة

### 1. `journal-validation-chain`

**الهدف:** التحقق من صحة قيد قبل posting

```typescript
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatAnthropic } from "@langchain/anthropic";

export const journalValidationChain = RunnableSequence.from([
  // Step 1: Format input
  (input: { journal: JournalEntry; lines: JournalLine[] }) => ({
    summary: summarizeJournal(input.journal, input.lines),
    rules: getAccountingRulesFor(input.journal.scenario),
  }),
  // Step 2: LLM check
  PromptTemplate.fromTemplate(`
You are a SOCPA-certified CPA reviewing a journal entry.

JOURNAL: {summary}
RULES: {rules}

Check:
1. Is the entry balanced (debit = credit)?
2. Are the accounts appropriate for the scenario?
3. Are VAT/WHT amounts correct?
4. Are cost centers / profit centers required and present?
5. Any red flags (control account, period locked, etc.)?

Output JSON: { ok: boolean, errors: string[], warnings: string[] }
`),
  new ChatAnthropic({ model: "claude-opus-4-7", temperature: 0 }),
  (output) => JSON.parse(output.content),
]);
```

### 2. `cfo-insights-chain`

**الهدف:** توليد رؤى CFO من البيانات المالية

```typescript
export const cfoInsightsChain = RunnableSequence.from([
  // Step 1: Fetch metrics
  async (input: { tenantId: string; asOf: Date }) => {
    return {
      pnl: await fetchPnL(input.tenantId, input.asOf),
      cashFlow: await fetchCashFlow(input.tenantId, input.asOf),
      receivables: await fetchAging(input.tenantId, 'AR'),
      payables: await fetchAging(input.tenantId, 'AP'),
      kpis: await fetchKPIs(input.tenantId, input.asOf),
    };
  },
  // Step 2: Generate insights
  PromptTemplate.fromTemplate(`
You are a Saudi CFO advisor for an SME.

DATA:
- P&L: {pnl}
- Cash Flow: {cashFlow}
- AR Aging: {receivables}
- AP Aging: {payables}
- KPIs: {kpis}

Generate 5 actionable insights in Arabic. Each:
- Title (short)
- Description (2-3 sentences)
- Severity (info/warning/critical)
- Suggested action

Format as JSON array.
`),
  new ChatAnthropic({ model: "claude-opus-4-7", temperature: 0.3 }),
  (output) => JSON.parse(output.content),
]);
```

### 3. `document-extraction-chain`

**الهدف:** استخراج بيانات من فواتير PDF/صور

```typescript
export const documentExtractionChain = RunnableSequence.from([
  // Step 1: OCR (multimodal LLM with vision)
  async (input: { fileUrl: string; expectedType: string }) => {
    const visionResponse = await callVisionLLM({
      imageUrl: input.fileUrl,
      prompt: `Extract structured data from this ${input.expectedType}.`,
    });
    return { rawOcr: visionResponse };
  },
  // Step 2: Structured extraction
  PromptTemplate.fromTemplate(`
RAW OCR: {rawOcr}

Extract as JSON matching schema:
{{
  "vendorName": string,
  "vendorVatNumber": string,
  "invoiceNumber": string,
  "invoiceDate": "YYYY-MM-DD",
  "currency": string,
  "lines": [{{ "description": string, "qty": number, "unitPrice": number, "vatRate": number, "amount": number }}],
  "subtotal": number,
  "vatTotal": number,
  "grandTotal": number
}}
`),
  new ChatAnthropic({ model: "claude-opus-4-7", temperature: 0 }),
  (output) => JSON.parse(output.content),
  // Step 3: Validate
  async (extracted) => {
    const isValid = await validateInvoiceData(extracted);
    return { ...extracted, _validation: isValid };
  },
]);
```

### 4. `natural-language-query-chain` (NLQ)

**الهدف:** ترجمة سؤال طبيعي إلى SQL + تنفيذ

```typescript
export const nlqChain = RunnableSequence.from([
  // Step 1: Schema retrieval
  async (input: { question: string; tenantId: string }) => {
    const relevantTables = await retrieveSchemaContext(input.question);
    return { ...input, schema: relevantTables };
  },
  // Step 2: SQL generation
  PromptTemplate.fromTemplate(`
You are a Postgres SQL expert. Generate a SELECT query for the question.

QUESTION: {question}
SCHEMA: {schema}
TENANT FILTER: tenantId = '{tenantId}' (MUST be in every WHERE)

Rules:
- Read-only (SELECT only — never INSERT/UPDATE/DELETE)
- Always include tenantId filter
- LIMIT 1000

Output only the SQL.
`),
  new ChatAnthropic({ model: "claude-opus-4-7", temperature: 0 }),
  // Step 3: Validate SQL
  async (sql) => {
    if (!isReadOnly(sql) || !hasTenantFilter(sql)) {
      throw new Error("Unsafe SQL");
    }
    return sql;
  },
  // Step 4: Execute
  async (sql, input) => {
    return await prisma.$queryRawUnsafe(sql);
  },
]);
```

### 5. `anomaly-explanation-chain`

**الهدف:** شرح anomaly مكتشفة بلغة طبيعية

```typescript
export const anomalyExplanationChain = RunnableSequence.from([
  async (input: { anomaly: AuditFinding; relatedRecords: any[] }) => ({
    finding: input.anomaly,
    context: input.relatedRecords,
  }),
  PromptTemplate.fromTemplate(`
A fraud detection system flagged this:

FINDING: {finding}
RELATED RECORDS: {context}

Explain in Arabic:
1. What pattern was detected
2. Why it's suspicious (with reference to similar fraud cases)
3. What action the auditor should take

Tone: professional, evidence-based, not accusatory.
`),
  new ChatAnthropic({ model: "claude-opus-4-7", temperature: 0.2 }),
]);
```

## Orchestrator

```typescript
// src/lib/langchain-orchestrator.ts
export class ChainOrchestrator {
  async run(chainName: string, input: any) {
    const cached = await promptCache.get(chainName, input);
    if (cached) return cached;

    const chain = this.registry[chainName];
    const startedAt = Date.now();
    
    try {
      const output = await chain.invoke(input);
      await this.logRun(chainName, input, output, Date.now() - startedAt, 'success');
      await promptCache.set(chainName, input, output);
      return output;
    } catch (err) {
      await this.logRun(chainName, input, null, Date.now() - startedAt, 'error', err);
      throw err;
    }
  }

  private async logRun(name, input, output, duration, status, error?) {
    await prisma.promptUsageLog.create({
      data: {
        chainName: name,
        inputJson: input,
        outputJson: output,
        durationMs: duration,
        status,
        errorMessage: error?.message,
      },
    });
  }
}
```

## Saga Orchestration (Multi-Step Distributed Transactions)

```typescript
// src/lib/saga-orchestrator.ts
export class Saga {
  steps: SagaStep[] = [];
  
  addStep(step: SagaStep) {
    this.steps.push(step);
    return this;
  }
  
  async execute(context: any) {
    const completed: SagaStep[] = [];
    try {
      for (const step of this.steps) {
        await step.execute(context);
        completed.push(step);
      }
    } catch (err) {
      // Compensate in reverse order
      for (const step of completed.reverse()) {
        await step.compensate(context).catch(console.error);
      }
      throw err;
    }
  }
}

// Example: Procurement saga
const procurementSaga = new Saga()
  .addStep({
    execute: (ctx) => createPurchaseRequisition(ctx),
    compensate: (ctx) => deletePR(ctx),
  })
  .addStep({
    execute: (ctx) => runApproval(ctx),
    compensate: (ctx) => cancelApproval(ctx),
  })
  .addStep({
    execute: (ctx) => convertToPO(ctx),
    compensate: (ctx) => cancelPO(ctx),
  })
  .addStep({
    execute: (ctx) => notifyVendor(ctx),
    compensate: (ctx) => sendCancellation(ctx),
  });
```

## Event Bus

```typescript
// src/lib/event-bus.ts
type EventName =
  | 'invoice.created'
  | 'invoice.posted'
  | 'invoice.cleared'
  | 'po.acknowledged'
  | 'grn.received'
  | 'payment.processed'
  | 'period.closed'
  | 'anomaly.detected';

class EventBus {
  private subs = new Map<EventName, Handler[]>();
  
  on(event: EventName, handler: Handler) {
    if (!this.subs.has(event)) this.subs.set(event, []);
    this.subs.get(event)!.push(handler);
  }
  
  async emit(event: EventName, payload: any) {
    const handlers = this.subs.get(event) ?? [];
    await Promise.allSettled(handlers.map(h => h(payload)));
    await prisma.eventLog.create({
      data: { event, payload, emittedAt: new Date() },
    });
  }
}

export const events = new EventBus();

// Wiring (in startup)
events.on('invoice.cleared', async (inv) => {
  await sendInvoiceEmail(inv);
});
events.on('invoice.cleared', async (inv) => {
  await updateCreditUsage(inv.customerId, inv.grandTotal);
});
```
