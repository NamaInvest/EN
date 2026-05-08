# 5️⃣ LangChain | لانج تشين

## 🔍 الحالة الحالية

### ✅ الموجود
- **Orchestrator:** [src/lib/langchain-orchestrator.ts](../src/lib/langchain-orchestrator.ts)
- **8 ERP Tools** مسجّلة:
  - `get_erp_metrics`
  - `get_customer_balance`
  - `get_invoice_by_id`
  - `search_products`
  - `get_account_balance`
  - `list_open_invoices`
  - `list_pending_approvals`
  - `get_cash_position`
- **Vector Store integration:** [src/lib/vector-store.ts](../src/lib/vector-store.ts)

### 🔴 الفجوات
| الفجوة | الخطورة |
|--------|--------|
| Orchestrator مستخدم في route واحد فقط ([/api/ai/rag](../src/app/api/ai/rag)) | 🔴 |
| ai-cfo, copilot, fraud-monitoring لا تستخدمه | 🔴 |
| لا Streaming Support (SSE) | 🟠 |
| لا Tool Permissions / RBAC | 🔴 |
| لا Cost tracking per tool call | 🟠 |
| 8 tools فقط لنظام ERP بـ 157 model | 🟠 |

---

## 🎯 الخطة التفصيلية

### المرحلة 5.1 — توسيع Tools إلى 25 (5 أيام)

#### Tools إضافية مقترحة:
```typescript
// src/lib/orchestrator/tools/
  ├── financial/
  │   ├── create_journal_entry.tool.ts        [مع dry-run]
  │   ├── forecast_cash_flow.tool.ts          [90 يوم]
  │   ├── compute_aging_report.tool.ts
  │   ├── budget_vs_actual.tool.ts
  │   └── fx_revaluation_simulator.tool.ts
  ├── sales/
  │   ├── generate_zatca_invoice.tool.ts
  │   ├── apply_credit_note.tool.ts
  │   ├── customer_credit_check.tool.ts
  │   └── pricing_recommendation.tool.ts
  ├── purchases/
  │   ├── recommend_purchase_quantity.tool.ts [EOQ-based]
  │   ├── three_way_match.tool.ts
  │   └── vendor_performance.tool.ts
  ├── inventory/
  │   ├── stock_revaluation.tool.ts
  │   ├── slow_moving_report.tool.ts
  │   └── reorder_suggestion.tool.ts
  ├── hr/
  │   ├── analyze_employee_performance.tool.ts
  │   ├── leave_balance.tool.ts
  │   └── payroll_simulator.tool.ts
  ├── ai/
  │   ├── detect_anomalies.tool.ts            [في الفواتير]
  │   ├── suggest_cost_center.tool.ts         [تصنيف ذكي]
  │   └── extract_invoice_ocr.tool.ts
  └── reporting/
      ├── generate_pdf_report.tool.ts
      └── send_email_summary.tool.ts
```

---

### المرحلة 5.2 — Tool Permissions / RBAC (3 أيام)

```typescript
// src/lib/orchestrator/tool-registry.ts
export interface ToolDefinition<T = any, R = any> {
  name: string;
  description: string;
  schema: z.ZodSchema<T>;
  handler: (args: T, ctx: BusinessContext) => Promise<R>;
  permissions: string[];           // مثل ['accounting:read', 'invoice:create']
  cost: 'low' | 'medium' | 'high'; // لتتبع التكلفة
  dryRunSupported?: boolean;
  rateLimit?: { calls: number; per: number }; // مثل 10 calls/min
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  async getAllowedTools(ctx: BusinessContext): Promise<ToolDefinition[]> {
    return Array.from(this.tools.values()).filter(tool =>
      tool.permissions.every(p => ctx.user.permissions.includes(p))
    );
  }

  async execute(name: string, args: any, ctx: BusinessContext): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool not found: ${name}`);

    // Validate permissions
    if (!tool.permissions.every(p => ctx.user.permissions.includes(p))) {
      throw new Error(`Permission denied for tool: ${name}`);
    }

    // Validate arguments
    const validated = tool.schema.parse(args);

    // Rate limiting
    if (tool.rateLimit) {
      await rateLimitTool(ctx.tenant.id, name, tool.rateLimit);
    }

    // Execute with cost tracking
    const startTime = Date.now();
    try {
      const result = await tool.handler(validated, ctx);
      await logToolUsage({
        tenantId: ctx.tenant.id,
        userId: ctx.user.id,
        toolName: name,
        latencyMs: Date.now() - startTime,
        success: true,
      });
      return result;
    } catch (error) {
      await logToolUsage({
        tenantId: ctx.tenant.id,
        toolName: name,
        latencyMs: Date.now() - startTime,
        success: false,
        error: error.message,
      });
      throw error;
    }
  }
}

export const toolRegistry = new ToolRegistry();
```

---

### المرحلة 5.3 — Streaming Support (2 أيام)

```typescript
// src/lib/orchestrator/streaming.ts
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export async function streamChain(
  chainName: string,
  input: any,
  ctx: BusinessContext
): Promise<ReadableStream> {
  const model = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    streaming: true,
  });

  const tools = await toolRegistry.getAllowedTools(ctx);
  const agent = await createReactAgent({ llm: model, tools });

  const stream = await agent.stream(input);

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`)
        );
      }
      controller.close();
    },
  });
}

// الاستخدام في API:
// src/app/api/ai/copilot/chat/route.ts
export async function POST(req: NextRequest) {
  const ctx = await buildBusinessContext(req);
  const { message } = await req.json();

  const stream = await streamChain('copilot.chat', { message }, ctx);

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

---

### المرحلة 5.4 — Adoption Plan (5 أيام)

#### Migration Checklist
- [ ] `/api/ai-cfo` → `invokeChain('cfo.daily_summary')`
- [ ] `/api/ai-cfo/report` → `invokeChain('cfo.monthly_report')`
- [ ] `/api/ai/copilot/chat` → `streamChain('copilot.general')`
- [ ] `/api/ai/fraud-monitoring` → `invokeChain('fraud.scan')`
- [ ] `/api/ai-auditor` → `invokeChain('audit.daily')`
- [ ] `/api/purchases/ocr` → `invokeChain('ocr.invoice_extract')`
- [ ] `/api/ai/nlq` → `invokeChain('nlq.query_to_sql')`

---

### المرحلة 5.5 — LangSmith Integration (2 أيام)

```typescript
// .env
LANGSMITH_API_KEY=ls__xxx
LANGSMITH_PROJECT=namasoft-erp-prod
LANGCHAIN_TRACING_V2=true

// src/lib/orchestrator/index.ts
import { Client } from 'langsmith';

const langsmithClient = new Client({ apiKey: process.env.LANGSMITH_API_KEY });

// كل invoke يُسجّل تلقائياً في LangSmith
// نحصل على: traces, costs, errors, latency
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| ERP Tools | 8 | 25 |
| Routes تستخدم Orchestrator | 1 | 7+ |
| Streaming support | لا | نعم |
| Tool RBAC | لا | كامل |
| Cost tracking | لا | per tool call |
| LangSmith tracing | لا | 100% |

---

## ⏱️ الجدول الزمني
- **المدة:** 17 يوم عمل
- **الفريق:** 1 senior + AI specialist
- **الأولوية:** 🟡 متوسطة

---

## ✅ معايير القبول
- [ ] 25 ERP tool مسجّل ومُختبر
- [ ] Tool Registry مع RBAC
- [ ] Streaming يعمل في copilot
- [ ] 7 routes هاجرت لـ Orchestrator
- [ ] LangSmith dashboard يعرض traces
- [ ] Cost report per tenant per day
