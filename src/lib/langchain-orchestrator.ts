/**
 * AI-07/08 — LangChain Orchestrator
 * Dynamic imports to prevent build failures when packages aren't installed.
 *
 * Provides a registry of ERP-aware tools that the LLM can invoke:
 *   getErpMetrics, getCustomerBalance, getInvoiceById, searchProducts,
 *   getAccountBalance, listOpenInvoices, listPendingApprovals, getCashPosition.
 *
 * (audit reference: AUDIT_2026_05_07/07_AI_STACK_AUDIT.md → AI-07)
 */
import { z } from "zod";
import { getPrisma } from '@/lib/prisma';
import { getPrompt, logPromptUsage } from './prompts/registry';

// Lazy-loaded LangChain modules
let _lcModules: any = null;

async function getLcModules() {
    if (!_lcModules) {
        try {
            const [genai, prompts, parsers, runnables, tools] = await Promise.all([
                import("@langchain/google-genai"),
                import("@langchain/core/prompts"),
                import("@langchain/core/output_parsers"),
                import("@langchain/core/runnables"),
                import("@langchain/core/tools"),
            ]);
            _lcModules = {
                ChatGoogleGenerativeAI: genai.ChatGoogleGenerativeAI,
                PromptTemplate: prompts.PromptTemplate,
                StringOutputParser: parsers.StringOutputParser,
                RunnableSequence: runnables.RunnableSequence,
                tool: tools.tool,
            };
        } catch {
            console.warn('⚠️ LangChain not available — using stub orchestrator');
            _lcModules = null;
            return null;
        }
    }
    return _lcModules;
}

// Global cache for models
const models: Record<string, any> = {};

function getModel(lc: any, modelName: string) {
    if (!models[modelName]) {
        models[modelName] = new lc.ChatGoogleGenerativeAI({
            model: modelName,
            apiKey: process.env.GEMINI_API_KEY,
            temperature: 0.3,
            maxOutputTokens: 2048,
        });
    }
    return models[modelName];
}

/**
 * Build the ERP-aware tool catalog.
 * Tools accept string IDs (LLM-friendly) and convert to Int internally.
 * Tenant scoping happens at the Prisma client layer (withTenant middleware).
 */
function buildTools(lc: any) {
    const prisma = getPrisma();

    const toInt = (v: string) => {
        const n = Number(v);
        if (!Number.isFinite(n)) throw new Error(`Invalid numeric ID: ${v}`);
        return Math.trunc(n);
    };

    const getErpMetrics = lc.tool(
        async ({ entity }: { entity: string }) => {
            if (entity === 'sales') return `Sales invoice count: ${await prisma.salesInvoice.count()}`;
            if (entity === 'employees') return `Active employees: ${await prisma.employee.count({ where: { active: true } })}`;
            if (entity === 'customers') return `Active customers: ${await prisma.customer.count({ where: { active: true } })}`;
            if (entity === 'products') return `Active products: ${await prisma.product.count({ where: { active: true } })}`;
            return `Unknown entity: ${entity}`;
        },
        {
            name: "get_erp_metrics",
            description: "Get real-time counts from the ERP database for a given entity.",
            schema: z.object({ entity: z.enum(['sales', 'employees', 'customers', 'products']) }),
        }
    );

    const getCustomerBalance = lc.tool(
        async ({ customerId }: { customerId: string }) => {
            const c = await prisma.customer.findUnique({ where: { id: toInt(customerId) } });
            if (!c) return `Customer ${customerId} not found.`;
            return `Customer ${c.name} balance: ${c.balance ?? 0} SAR (credit limit ${c.creditLimit ?? 0}).`;
        },
        {
            name: "get_customer_balance",
            description: "Get the current outstanding balance for a customer by numeric ID.",
            schema: z.object({ customerId: z.string() }),
        }
    );

    const getInvoiceById = lc.tool(
        async ({ invoiceId }: { invoiceId: string }) => {
            const inv = await prisma.salesInvoice.findUnique({ where: { id: toInt(invoiceId) } });
            if (!inv) return `Invoice ${invoiceId} not found.`;
            return JSON.stringify({
                id: inv.id,
                invoiceNo: inv.invoiceNo,
                date: inv.date,
                customerId: inv.customerId,
                subtotal: inv.subtotal,
                tax: inv.taxValue,
                total: inv.total,
                paid: inv.paid,
                remaining: inv.remaining,
                status: inv.status,
            });
        },
        {
            name: "get_invoice_by_id",
            description: "Look up a sales invoice by its primary-key ID and return key fields.",
            schema: z.object({ invoiceId: z.string() }),
        }
    );

    const searchProducts = lc.tool(
        async ({ query, limit }: { query: string; limit?: number }) => {
            const rows = await prisma.product.findMany({
                where: {
                    OR: [
                        { name: { contains: query } },
                        { nameEn: { contains: query } },
                        { barcode: { contains: query } },
                    ],
                },
                take: limit ?? 10,
                select: { id: true, name: true, barcode: true, sellPrice: true, currentStock: true },
            });
            return JSON.stringify(rows);
        },
        {
            name: "search_products",
            description: "Search products by name (Arabic/English) or barcode. Returns up to `limit` matches.",
            schema: z.object({ query: z.string(), limit: z.number().optional() }),
        }
    );

    const getAccountBalance = lc.tool(
        async ({ accountCode }: { accountCode: string }) => {
            const acc = await prisma.account.findFirst({ where: { code: accountCode } });
            if (!acc) return `Account ${accountCode} not found.`;
            return `Account ${acc.code} (${acc.name}): ${acc.balance} SAR.`;
        },
        {
            name: "get_account_balance",
            description: "Get the current balance of a GL account by code (e.g. '1110' for Cash).",
            schema: z.object({ accountCode: z.string() }),
        }
    );

    const listOpenInvoices = lc.tool(
        async ({ customerId, limit }: { customerId?: string; limit?: number }) => {
            const where: any = customerId ? { customerId: toInt(customerId) } : {};
            const rows = await prisma.salesInvoice.findMany({
                where,
                orderBy: { date: 'desc' },
                take: limit ?? 20,
                select: { id: true, invoiceNo: true, total: true, paid: true, remaining: true, date: true },
            });
            const open = rows.filter((r: any) => Number(r.remaining ?? 0) > 0);
            return JSON.stringify(open);
        },
        {
            name: "list_open_invoices",
            description: "List sales invoices with non-zero remaining balance, optionally filtered by customer ID.",
            schema: z.object({ customerId: z.string().optional(), limit: z.number().optional() }),
        }
    );

    const listPendingApprovals = lc.tool(
        async ({ userId }: { userId: string }) => {
            // ApprovalRequest may or may not exist depending on tenant config.
            try {
                const count = await (prisma as any).approvalRequest?.count?.({
                    where: { status: 'PENDING' },
                });
                return `Pending approvals: ${count ?? 0} (user filter: ${userId}).`;
            } catch {
                return `Approvals subsystem unavailable for user ${userId}.`;
            }
        },
        {
            name: "list_pending_approvals",
            description: "Count pending approval requests, optionally relevant to a user.",
            schema: z.object({ userId: z.string() }),
        }
    );

    const getCashPosition = lc.tool(
        async () => {
            const cash = await prisma.account.findFirst({ where: { code: '1110' } });
            const bank = await prisma.account.findFirst({ where: { code: '1120' } });
            return JSON.stringify({
                cash: { code: cash?.code, name: cash?.name, balance: cash?.balance ?? 0 },
                bank: { code: bank?.code, name: bank?.name, balance: bank?.balance ?? 0 },
                total: Number(cash?.balance ?? 0) + Number(bank?.balance ?? 0),
                currency: 'SAR',
            });
        },
        {
            name: "get_cash_position",
            description: "Get a snapshot of cash (1110) and bank (1120) account balances.",
            schema: z.object({}),
        }
    );

    return [
        getErpMetrics,
        getCustomerBalance,
        getInvoiceById,
        searchProducts,
        getAccountBalance,
        listOpenInvoices,
        listPendingApprovals,
        getCashPosition,
    ];
}

/**
 * Creates a standard LangChain sequence using our centralized prompt registry.
 */
export async function createRegistryChain(promptKey: string, tenantId: string | null = null) {
    const lc = await getLcModules();
    if (!lc) throw new Error('[LangChain] LangChain packages not available on this environment.');

    const promptDef = await getPrompt(promptKey, tenantId);
    if (!promptDef) throw new Error(`[LangChain] Prompt key '${promptKey}' not found.`);

    const fullTemplate = `${promptDef.systemPrompt}\n\nUser: ${promptDef.userTemplate}`;
    const lcPrompt = lc.PromptTemplate.fromTemplate(fullTemplate);
    const model = getModel(lc, promptDef.modelHint || 'gemini-2.5-flash');

    const tools = buildTools(lc);
    const modelWithTools = model.bindTools(tools);

    const chain = lc.RunnableSequence.from([
        lcPrompt,
        modelWithTools,
    ]);

    return { chain, promptDef, tools };
}

/**
 * Extract token counts from a LangChain AIMessage if the provider returned them.
 * Falls back to 0 if the metadata shape is unknown.
 */
function extractTokenUsage(result: any): { promptTokens: number; completionTokens: number } {
    const usage =
        result?.usage_metadata ??
        result?.response_metadata?.tokenUsage ??
        result?.response_metadata?.usage ??
        null;
    if (!usage) return { promptTokens: 0, completionTokens: 0 };
    return {
        promptTokens: Number(usage.input_tokens ?? usage.promptTokens ?? usage.prompt_tokens ?? 0),
        completionTokens: Number(usage.output_tokens ?? usage.completionTokens ?? usage.completion_tokens ?? 0),
    };
}

/**
 * Invoke a chain and track tokens centrally.
 */
export async function invokeChain(promptKey: string, vars: Record<string, any>, tenantId: string | null = null) {
    const startTime = Date.now();
    let promptDef: any;
    let modelName = 'gemini-2.5-flash';

    try {
        const { chain, promptDef: def } = await createRegistryChain(promptKey, tenantId);
        promptDef = def;
        modelName = def.modelHint || modelName;

        const result = await chain.invoke(vars);
        const { promptTokens, completionTokens } = extractTokenUsage(result);

        await logPromptUsage({
            tenantId: tenantId || 'global',
            promptKey,
            promptVersion: promptDef.version,
            model: modelName,
            promptTokens,
            completionTokens,
            latencyMs: Date.now() - startTime,
            success: true
        });

        return typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
    } catch (e: any) {
        if (promptDef) {
            await logPromptUsage({
                tenantId: tenantId || 'global',
                promptKey,
                promptVersion: promptDef.version,
                model: modelName,
                promptTokens: 0,
                completionTokens: 0,
                latencyMs: Date.now() - startTime,
                success: false,
                errorCode: e.message
            });
        }
        throw e;
    }
}
