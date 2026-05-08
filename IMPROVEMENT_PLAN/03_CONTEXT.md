# 3️⃣ Context | إدارة السياق

## 🔍 الحالة الحالية

### ✅ الموجود
- `getPrisma(req)` يستخرج tenantId في 439/661 route
- Clerk session متاحة في كل route عبر `auth()`
- Copilot يخزن المحادثات في DB

### 🔴 الفجوات
| الفجوة | الخطورة |
|--------|--------|
| 222 route بدون tenant context واضح | 🔴 |
| لا حقن للسياق الأعمالي (الفترة، الفروع) | 🟠 |
| لا Conversation Memory Manager | 🟠 |
| لا Context Window Compaction | 🟡 |
| MCP server موجود لكن غير متصل | 🟡 |

---

## 🎯 الخطة التفصيلية

### البنية المقترحة
```
src/lib/context/
  ├── business-context.ts        [يبني السياق الكامل]
  ├── tenant-context.ts          [tenant + branches + period]
  ├── user-context.ts            [user + role + permissions]
  ├── conversation-memory.ts     [sliding window manager]
  ├── compactor.ts               [يلخّص المحادثات الطويلة]
  ├── mcp-bridge.ts              [يربط MCP بالـ Orchestrator]
  └── injector.ts                [يحقن السياق في البرومبت]
```

---

## 📝 BusinessContext API

```typescript
// src/lib/context/business-context.ts
export interface BusinessContext {
  tenant: {
    id: string;
    name: string;
    plan: 'starter' | 'pro' | 'enterprise';
    features: string[];
  };
  user: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
  branch: {
    id: string;
    name: string;
    isMain: boolean;
  };
  fiscal: {
    yearId: string;
    periodId: string;
    isClosed: boolean;
    startDate: Date;
    endDate: Date;
  };
  settings: {
    currency: 'SAR' | 'USD';
    vatRate: number;
    locale: 'ar' | 'en';
    zatcaEnvironment: 'sandbox' | 'production';
  };
  meta: {
    requestId: string;
    timestamp: Date;
    userAgent: string;
    ip: string;
  };
}

export async function buildBusinessContext(req: NextRequest): Promise<BusinessContext> {
  const { userId, sessionClaims } = await auth();
  const tenantId = req.headers.get('x-tenant-id') || sessionClaims?.tenantId;
  const prisma = getPrisma(tenantId);

  const [tenant, user, branch, fiscal, settings] = await Promise.all([
    prisma.tenantAccount.findUnique({ where: { id: tenantId } }),
    prisma.user.findUnique({ where: { id: userId }, include: { permissions: true } }),
    prisma.branch.findFirst({ where: { isDefault: true } }),
    getCurrentFiscalPeriod(prisma),
    getTenantSettings(prisma),
  ]);

  return { tenant, user, branch, fiscal, settings, meta: extractMeta(req) };
}
```

---

## 🔄 Conversation Memory Manager

```typescript
// src/lib/context/conversation-memory.ts
export class ConversationMemory {
  constructor(
    private maxTokens: number = 4000,
    private model: 'gemini-flash' | 'gemini-pro' = 'gemini-flash'
  ) {}

  async getRelevantHistory(
    sessionId: string,
    currentQuery: string,
    options: { tokenBudget?: number } = {}
  ): Promise<Message[]> {
    const all = await prisma.copilotMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });

    let budget = options.tokenBudget || this.maxTokens;
    const result: Message[] = [];

    for (const msg of all) {
      const tokens = countTokens(msg.content);
      if (tokens > budget) {
        const summary = await this.summarize(all.slice(result.length));
        result.unshift({ role: 'system', content: `[تلخيص للمحادثة الأقدم]: ${summary}` });
        break;
      }
      budget -= tokens;
      result.unshift(msg);
    }

    return result;
  }

  private async summarize(messages: Message[]): Promise<string> {
    return await getPrompt('system.summarize_conversation', {
      variables: { messages: JSON.stringify(messages) },
    });
  }
}
```

---

## 🔌 MCP Bridge

```typescript
// src/lib/context/mcp-bridge.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class MCPBridge {
  private client: Client;

  async connect() {
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['mcp-server.mjs'],
    });
    this.client = new Client({ name: 'namasoft-erp', version: '1.0.0' });
    await this.client.connect(transport);
  }

  async callTool(name: string, args: any) {
    return await this.client.callTool({ name, arguments: args });
  }

  async listTools() {
    return await this.client.listTools();
  }
}

// تكامل مع Orchestrator
export async function getCombinedTools(): Promise<Tool[]> {
  const builtinTools = await getOrchestratorTools(); // 8 tools
  const mcpBridge = new MCPBridge();
  await mcpBridge.connect();
  const mcpTools = await mcpBridge.listTools(); // 3 MCP tools

  return [
    ...builtinTools,
    ...mcpTools.map(t => convertMCPToLangChainTool(t, mcpBridge)),
  ];
}
```

---

## 🔧 withContext() Middleware

```typescript
// src/middleware.ts (جزء)
export async function withContext<T>(
  handler: (ctx: BusinessContext, req: NextRequest) => Promise<T>,
  options: { requireTenant?: boolean; requirePeriod?: boolean } = {}
) {
  return async (req: NextRequest) => {
    try {
      const ctx = await buildBusinessContext(req);

      if (options.requireTenant && !ctx.tenant) {
        return NextResponse.json({ error: 'Tenant required' }, { status: 401 });
      }

      if (options.requirePeriod && ctx.fiscal.isClosed) {
        return NextResponse.json({ error: 'Fiscal period closed' }, { status: 423 });
      }

      return await handler(ctx, req);
    } catch (error) {
      logger.error('Context build failed', { error });
      return NextResponse.json({ error: 'Context error' }, { status: 500 });
    }
  };
}

// الاستخدام:
export const POST = withContext(async (ctx, req) => {
  // ctx.tenant, ctx.user, ctx.branch جاهزين
  // ...
}, { requireTenant: true, requirePeriod: true });
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| Routes بـ context كامل | ~40% | 100% |
| MCP tools متاحة للـ AI | 0 | 3 |
| Conversation memory window | لا | 4K tokens |
| Compaction | لا | تلقائي |
| Fiscal period enforcement | لا | على routes حرجة |

---

## ⏱️ الجدول الزمني
- **المدة:** 12 يوم عمل
- **المطور:** 1 senior backend
- **الأولوية:** 🔴 عالية (يسبق Workflow Engine)

---

## ✅ معايير القبول
- [x] `withContext()` middleware يعمل ومُختبر
- [x] BusinessContext يحتوي 6 طبقات (tenant, user, branch, fiscal, settings, meta)
- [x] ConversationMemory يدير المحادثات > 4K tokens
- [x] MCP Bridge يربط 3 tools للـ Orchestrator
- [x] Compactor يلخّص المحادثات تلقائياً
- [x] Tests للسيناريوهات الحرجة (closed period, missing tenant)
