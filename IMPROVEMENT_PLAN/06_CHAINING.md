# 6️⃣ Chaining | تسلسل النماذج

## 🔍 الحالة الحالية

### 🔴 الفجوات الكاملة
- لا Sequential Chains منظّمة
- لا Parallel Chains
- لا Router Chains
- لا Conditional Chains
- لا ReAct (Reasoning + Acting) loop
- لا Chain-of-Thought (CoT)
- لا Self-Correction (Reflexion)
- Tool-Calling في Orchestrator فقط، غير مُعمّم

---

## 🎯 الخطة التفصيلية

### البنية المقترحة
```
src/lib/chains/
  ├── base/
  │   ├── chain.interface.ts
  │   ├── chain-registry.ts
  │   └── chain-runner.ts
  ├── sequential/
  │   ├── invoice-process.chain.ts          [OCR → Validate → Match → Post]
  │   ├── month-close.chain.ts              [FX → Accruals → Reports]
  │   ├── payroll-run.chain.ts              [Calc → GOSI → WPS → Post]
  │   ├── customer-onboarding.chain.ts      [Verify → Create → Welcome]
  │   └── period-close.chain.ts
  ├── router/
  │   ├── intent-router.chain.ts            [يحدد الـ chain حسب نية المستخدم]
  │   └── domain-router.chain.ts            [accounting | sales | hr]
  ├── parallel/
  │   ├── multi-report.chain.ts             [يولّد 5 تقارير بالتوازي]
  │   └── multi-source-search.chain.ts      [يبحث في مصادر متعددة]
  ├── conditional/
  │   ├── approval.chain.ts                 [يتفرّع حسب المبلغ/النوع]
  │   └── compliance-check.chain.ts
  ├── react/
  │   ├── react-agent.ts                    [Thought → Action → Observation loop]
  │   └── tool-selector.ts
  └── reflexion/
      └── self-corrector.ts                 [يراجع إجابته ويصحّحها]
```

---

## 📝 Chain Interface

```typescript
// src/lib/chains/base/chain.interface.ts
export interface Chain<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<TInput>;
  outputSchema: z.ZodSchema<TOutput>;
  execute(input: TInput, ctx: BusinessContext): Promise<TOutput>;
  estimatedCost?: number;
  estimatedLatencyMs?: number;
}

export class ChainRunner {
  async run<I, O>(chain: Chain<I, O>, input: I, ctx: BusinessContext): Promise<O> {
    const validated = chain.inputSchema.parse(input);
    const start = Date.now();

    try {
      const output = await chain.execute(validated, ctx);
      const validatedOutput = chain.outputSchema.parse(output);

      await this.logExecution({
        chainName: chain.name,
        tenantId: ctx.tenant.id,
        latencyMs: Date.now() - start,
        success: true,
      });

      return validatedOutput;
    } catch (error) {
      await this.logExecution({
        chainName: chain.name,
        tenantId: ctx.tenant.id,
        latencyMs: Date.now() - start,
        success: false,
        error: error.message,
      });
      throw error;
    }
  }
}
```

---

## 📝 Sequential Chain Example

```typescript
// src/lib/chains/sequential/invoice-process.chain.ts
export const invoiceProcessChain: Chain<InvoiceInput, InvoiceOutput> = {
  name: 'invoice.process',
  description: 'OCR → Validate → Match PO → Post JE',
  inputSchema: z.object({ imageUrl: z.string().url() }),
  outputSchema: z.object({
    invoiceId: z.string(),
    status: z.enum(['posted', 'pending_review']),
    journalEntryId: z.string().optional(),
    matchedPO: z.string().optional(),
    issues: z.array(z.string()),
  }),

  async execute(input, ctx) {
    // Step 1: OCR
    const extracted = await invokeChain('ocr.invoice_extract', {
      imageUrl: input.imageUrl,
    }, ctx);

    // Step 2: Validate against business rules
    const validation = await validateInvoice(extracted, ctx);
    if (!validation.valid) {
      return { status: 'pending_review', issues: validation.issues };
    }

    // Step 3: Three-way match with PO + GRN
    const match = await threeWayMatch({
      invoice: extracted,
      poNumber: extracted.poNumber,
    }, ctx);

    if (!match.success) {
      return { status: 'pending_review', issues: match.discrepancies };
    }

    // Step 4: Create invoice + post JE (transactional)
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.purchaseInvoice.create({ data: extracted });
      const je = await postPurchaseInvoiceJE(invoice, tx);
      return { invoice, je };
    });

    return {
      invoiceId: result.invoice.id,
      status: 'posted',
      journalEntryId: result.je.id,
      matchedPO: match.poId,
      issues: [],
    };
  },
};
```

---

## 📝 Router Chain

```typescript
// src/lib/chains/router/intent-router.chain.ts
export const intentRouterChain: Chain<{ message: string }, ChainResult> = {
  name: 'router.intent',
  description: 'يصنّف نية المستخدم ويوجّهه للـ chain المناسب',
  // ...

  async execute(input, ctx) {
    // 1. صنّف النية
    const intent = await invokeChain('classification.user_intent', {
      message: input.message,
      categories: ['question', 'action', 'report', 'analysis'],
    }, ctx);

    // 2. وجّه
    switch (intent.category) {
      case 'question':
        return await invokeChain('rag.assistant', { query: input.message }, ctx);
      case 'action':
        return await invokeChain('react.tool_user', { task: input.message }, ctx);
      case 'report':
        return await invokeChain('reporting.generator', { request: input.message }, ctx);
      case 'analysis':
        return await invokeChain('analysis.cfo', { question: input.message }, ctx);
      default:
        return { text: 'لم أفهم طلبك، يرجى إعادة الصياغة.' };
    }
  },
};
```

---

## 📝 Parallel Chain

```typescript
// src/lib/chains/parallel/multi-report.chain.ts
export const multiReportChain: Chain = {
  name: 'parallel.multi_report',

  async execute(input, ctx) {
    const [pl, bs, cf, ar, ap] = await Promise.all([
      invokeChain('reports.profit_loss', input, ctx),
      invokeChain('reports.balance_sheet', input, ctx),
      invokeChain('reports.cash_flow', input, ctx),
      invokeChain('reports.ar_aging', input, ctx),
      invokeChain('reports.ap_aging', input, ctx),
    ]);

    // اجمع في PDF واحد
    return await generateConsolidatedPDF({ pl, bs, cf, ar, ap });
  },
};
```

---

## 🤖 ReAct Agent

```typescript
// src/lib/chains/react/react-agent.ts
export class ReActAgent {
  constructor(
    private model: ChatGoogleGenerativeAI,
    private tools: ToolDefinition[],
    private maxIterations: number = 10
  ) {}

  async run(task: string, ctx: BusinessContext): Promise<string> {
    const trace: ReActStep[] = [];

    for (let i = 0; i < this.maxIterations; i++) {
      // Thought
      const thought = await this.model.invoke([
        new SystemMessage(REACT_PROMPT),
        new HumanMessage(`Task: ${task}\n\nHistory:\n${this.formatTrace(trace)}\n\nWhat should I do next?`),
      ]);

      const parsed = this.parseThought(thought.content);
      trace.push({ thought: parsed.thought });

      // Final answer?
      if (parsed.finalAnswer) {
        return parsed.finalAnswer;
      }

      // Action
      const tool = this.tools.find(t => t.name === parsed.action);
      if (!tool) {
        trace.push({ observation: `Tool not found: ${parsed.action}` });
        continue;
      }

      try {
        const observation = await toolRegistry.execute(parsed.action, parsed.actionInput, ctx);
        trace.push({ action: parsed.action, observation: JSON.stringify(observation) });
      } catch (error) {
        trace.push({ action: parsed.action, observation: `Error: ${error.message}` });
      }
    }

    throw new Error('Max iterations reached');
  }

  private formatTrace(trace: ReActStep[]): string {
    return trace.map((s, i) =>
      `Step ${i + 1}:\n` +
      (s.thought ? `Thought: ${s.thought}\n` : '') +
      (s.action ? `Action: ${s.action}\n` : '') +
      (s.observation ? `Observation: ${s.observation}\n` : '')
    ).join('\n');
  }
}
```

---

## 🔄 Self-Correction (Reflexion)

```typescript
// src/lib/chains/reflexion/self-corrector.ts
export async function selfCorrect<T>(
  chain: Chain<any, T>,
  input: any,
  ctx: BusinessContext,
  options: { maxAttempts?: number; criticPrompt?: string } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  let attempt = 0;
  let lastResult: T | null = null;
  let lastCritique: string | null = null;

  while (attempt < maxAttempts) {
    // 1. Generate
    const enrichedInput = lastCritique
      ? { ...input, previousAttempt: lastResult, critique: lastCritique }
      : input;

    lastResult = await chain.execute(enrichedInput, ctx);

    // 2. Critique
    const critique = await invokeChain('critic.review', {
      task: input,
      result: lastResult,
      prompt: options.criticPrompt,
    }, ctx);

    if (critique.acceptable) return lastResult;
    lastCritique = critique.feedback;
    attempt++;
  }

  return lastResult!;
}
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| Chains منظّمة | 0 | 15+ |
| Sequential chains | 0 | 5 |
| Parallel chains | 0 | 2 |
| Router chains | 0 | 2 |
| ReAct loop | لا | نعم |
| Self-correction | لا | على chains حرجة |

---

## ⏱️ الجدول الزمني
- **المدة:** 16 يوم عمل
- **الفريق:** 1 senior + AI specialist
- **الأولوية:** 🟡 متوسطة

---

## ✅ معايير القبول
- [x] Chain Registry + Runner
- [x] 5 sequential chains رئيسية
- [x] 2 router + 2 parallel chains
- [x] ReAct agent يعمل مع 25 tool
- [x] Self-correction على invoice-process + month-close
- [x] كل chain له tests + cost estimation
