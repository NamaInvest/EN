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


    // ── P3.10: Extended ERP Tools (17 additional) ──────────────────────────────

    const getEmployeeInfo = lc.tool(
        async ({ employeeId }: { employeeId: string }) => {
            const e = await (prisma as any).employee?.findUnique({
                where: { id: toInt(employeeId) },
                select: { id: true, name: true, position: true, department: true, salary: true, active: true },
            }).catch(() => null);
            if (!e) return `Employee ${employeeId} not found.`;
            return JSON.stringify(e);
        },
        { name: 'get_employee_info', description: 'Get employee details by ID.', schema: z.object({ employeeId: z.string() }) }
    );

    const listLowStockProducts = lc.tool(
        async ({ threshold }: { threshold?: number }) => {
            const rows = await prisma.product.findMany({
                where: { active: true, currentStock: { lte: threshold ?? 10 } },
                take: 20,
                select: { id: true, name: true, currentStock: true, minQuantity: true },
            });
            return JSON.stringify(rows);
        },
        { name: 'list_low_stock_products', description: 'List products below a stock threshold (default 10 units).', schema: z.object({ threshold: z.number().optional() }) }
    );

    const getTrialBalance = lc.tool(
        async () => {
            const accounts = await prisma.account.findMany({
                where: { parentId: 0, isActive: true },
                select: { code: true, name: true, balance: true, type: true },
                orderBy: { code: 'asc' },
                take: 50,
            });
            const totalDebit  = accounts.filter((a: any) => ['asset','expense'].includes((a.type ?? '').toLowerCase())).reduce((s: number, a: any) => s + Number(a.balance ?? 0), 0);
            const totalCredit = accounts.filter((a: any) => ['liability','equity','revenue'].includes((a.type ?? '').toLowerCase())).reduce((s: number, a: any) => s + Number(a.balance ?? 0), 0);
            return JSON.stringify({ accounts, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 });
        },
        { name: 'get_trial_balance', description: 'Get trial balance with debit/credit totals.', schema: z.object({}) }
    );

    const getZatcaStatus = lc.tool(
        async ({ invoiceId }: { invoiceId: string }) => {
            const inv = await prisma.salesInvoice.findUnique({
                where:  { id: toInt(invoiceId) },
                select: { id: true, invoiceNo: true, zatcaStatus: true, zatcaHash: true, zatcaUuid: true, cleared: true },
            });
            if (!inv) return `Invoice ${invoiceId} not found.`;
            return JSON.stringify(inv);
        },
        { name: 'get_zatca_status', description: 'Check ZATCA compliance status for a sales invoice.', schema: z.object({ invoiceId: z.string() }) }
    );

    const getSupplierBalance = lc.tool(
        async ({ supplierId }: { supplierId: string }) => {
            const s = await (prisma as any).supplier?.findUnique({
                where: { id: toInt(supplierId) },
                select: { id: true, name: true, balance: true, creditLimit: true },
            }).catch(() => null);
            if (!s) return `Supplier ${supplierId} not found.`;
            return `Supplier ${s.name}: balance ${s.balance ?? 0} SAR, credit limit ${s.creditLimit ?? 0} SAR.`;
        },
        { name: 'get_supplier_balance', description: 'Get supplier outstanding balance and credit limit.', schema: z.object({ supplierId: z.string() }) }
    );

    const getBudgetStatus = lc.tool(
        async ({ year, month }: { year: string; month?: string }) => {
            const budgets = await (prisma as any).budget?.findMany({
                where: { year: Number(year), ...(month ? { month: Number(month) } : {}) },
                take: 20,
                select: { accountCode: true, budgetAmount: true, actualAmount: true },
            }).catch(() => []) ?? [];
            const total = budgets.reduce((s: any, b: any) => ({
                budget: s.budget + Number(b.budgetAmount ?? 0),
                actual: s.actual + Number(b.actualAmount ?? 0),
            }), { budget: 0, actual: 0 });
            return JSON.stringify({ lines: budgets, ...total, variance: total.budget - total.actual });
        },
        { name: 'get_budget_status', description: 'Get budget vs actual for a given year (and optionally month).', schema: z.object({ year: z.string(), month: z.string().optional() }) }
    );

    const listRecentJournals = lc.tool(
        async ({ limit }: { limit?: number }) => {
            const journals = await (prisma as any).journalEntry?.findMany({
                orderBy: { date: 'desc' },
                take: limit ?? 10,
                select: { id: true, date: true, reference: true, description: true, totalDebit: true, status: true },
            }).catch(() => []) ?? [];
            return JSON.stringify(journals);
        },
        { name: 'list_recent_journals', description: 'List the most recent journal entries with key fields.', schema: z.object({ limit: z.number().optional() }) }
    );

    const getPayrollSummary = lc.tool(
        async ({ month, year }: { month: string; year: string }) => {
            const payrolls = await (prisma as any).payroll?.findMany({
                where: { month: Number(month), year: Number(year) },
                select: { totalBasic: true, totalAllowances: true, totalDeductions: true, netPayable: true, status: true },
            }).catch(() => []) ?? [];
            const total = payrolls.reduce((s: any, p: any) => ({
                basic: s.basic + Number(p.totalBasic ?? 0),
                net:   s.net   + Number(p.netPayable ?? 0),
            }), { basic: 0, net: 0 });
            return `Payroll ${month}/${year}: total net ${total.net} SAR for ${payrolls.length} employees.`;
        },
        { name: 'get_payroll_summary', description: 'Get total payroll cost for a given month and year.', schema: z.object({ month: z.string(), year: z.string() }) }
    );

    const getExpensesByCategory = lc.tool(
        async ({ category, month }: { category?: string; month?: string }) => {
            const where: any = {};
            if (category) where.category = { contains: category };
            if (month)    where.date = { gte: new Date(`${new Date().getFullYear()}-${month}-01`) };
            const rows = await (prisma as any).expense?.findMany({
                where, take: 30,
                select: { category: true, amount: true, date: true, description: true },
            }).catch(() => []) ?? [];
            const total = rows.reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
            return JSON.stringify({ expenses: rows, total });
        },
        { name: 'get_expenses_by_category', description: 'Get expenses filtered by category and/or month (MM format).', schema: z.object({ category: z.string().optional(), month: z.string().optional() }) }
    );

    const searchCustomers = lc.tool(
        async ({ query, limit }: { query: string; limit?: number }) => {
            const rows = await prisma.customer.findMany({
                where: { OR: [{ name: { contains: query } }, { phone: { contains: query } }] },
                take: limit ?? 10,
                select: { id: true, name: true, phone: true, balance: true, active: true },
            });
            return JSON.stringify(rows);
        },
        { name: 'search_customers', description: 'Search customers by name, phone, or email.', schema: z.object({ query: z.string(), limit: z.number().optional() }) }
    );

    const getPurchaseOrderStatus = lc.tool(
        async ({ poId }: { poId: string }) => {
            const po = await (prisma as any).purchaseOrder?.findUnique({
                where: { id: toInt(poId) },
                select: { id: true, poNumber: true, status: true, total: true, received: true, supplierId: true },
            }).catch(() => null);
            if (!po) return `PO ${poId} not found.`;
            return JSON.stringify(po);
        },
        { name: 'get_purchase_order_status', description: 'Get the status and amounts of a purchase order by ID.', schema: z.object({ poId: z.string() }) }
    );

    const getProductStock = lc.tool(
        async ({ productId }: { productId: string }) => {
            const stocks = await (prisma as any).productStock?.findMany({
                where: { productId: toInt(productId) },
                include: { stock: { select: { name: true } } },
            }).catch(() => []) ?? [];
            const total = stocks.reduce((s: number, r: any) => s + Number(r.quantity ?? 0), 0);
            return JSON.stringify({ stocks, totalQuantity: total });
        },
        { name: 'get_product_stock', description: 'Get stock levels per warehouse for a product.', schema: z.object({ productId: z.string() }) }
    );

    const getAgingReport = lc.tool(
        async ({ type }: { type: 'receivable' | 'payable' }) => {
            if (type === 'receivable') {
                const rows = await prisma.customer.findMany({
                    where: { balance: { gt: 0 } }, take: 20,
                    select: { id: true, name: true, balance: true },
                    orderBy: { balance: 'desc' },
                });
                const total = rows.reduce((s: number, r: any) => s + Number(r.balance ?? 0), 0);
                return JSON.stringify({ type: 'receivable', total, customers: rows });
            }
            const rows = await (prisma as any).supplier?.findMany({
                where: { balance: { gt: 0 } }, take: 20,
                select: { id: true, name: true, balance: true },
                orderBy: { balance: 'desc' },
            }).catch(() => []) ?? [];
            const total = rows.reduce((s: number, r: any) => s + Number(r.balance ?? 0), 0);
            return JSON.stringify({ type: 'payable', total, suppliers: rows });
        },
        { name: 'get_aging_report', description: 'Get accounts receivable or payable aging report.', schema: z.object({ type: z.enum(['receivable', 'payable']) }) }
    );

    const createJournalEntry = lc.tool(
        async ({ description, debitAccount, creditAccount, amount, reference }: { description: string; debitAccount: string; creditAccount: string; amount: string; reference?: string }) => {
            // AI creates journal entries only if explicitly permitted
            const permitted = process.env.AI_CAN_CREATE_JOURNALS === 'true';
            if (!permitted) return 'إنشاء قيود محاسبية بواسطة الذكاء الاصطناعي غير مفعّل. يرجى الموافقة اليدوية.';
            return JSON.stringify({
                preview: true,
                description,
                debit:  { account: debitAccount,  amount: Number(amount) },
                credit: { account: creditAccount, amount: Number(amount) },
                reference,
                note: 'يجب مراجعة هذا القيد وتأكيده يدوياً قبل الترحيل.',
            });
        },
        { name: 'create_journal_entry', description: 'Preview (NOT post) a journal entry for human review.', schema: z.object({ description: z.string(), debitAccount: z.string(), creditAccount: z.string(), amount: z.string(), reference: z.string().optional() }) }
    );

    const getSalesReport = lc.tool(
        async ({ period, groupBy }: { period: 'today' | 'week' | 'month' | 'year'; groupBy?: 'customer' | 'product' | 'day' }) => {
            const now = new Date();
            const from = period === 'today' ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
                       : period === 'week'  ? new Date(now.getTime() - 7  * 86400000)
                       : period === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1)
                       : new Date(now.getFullYear(), 0, 1);
            const agg = await prisma.salesInvoice.aggregate({
                where: { date: { gte: from }, deletedAt: null },
                _sum: { total: true, taxValue: true, paid: true },
                _count: true,
            });
            return JSON.stringify({
                period, from: from.toISOString().split('T')[0],
                invoiceCount: agg._count,
                totalRevenue: Number(agg._sum.total   ?? 0),
                totalTax:     Number(agg._sum.taxValue ?? 0),
                totalPaid:    Number(agg._sum.paid     ?? 0),
                outstanding:  Number(agg._sum.total    ?? 0) - Number(agg._sum.paid ?? 0),
            });
        },
        { name: 'get_sales_report', description: 'Get aggregated sales report for a period (today/week/month/year).', schema: z.object({ period: z.enum(['today','week','month','year']), groupBy: z.enum(['customer','product','day']).optional() }) }
    );

    const listOverdueInvoices = lc.tool(
        async ({ daysOverdue }: { daysOverdue?: number }) => {
            const cutoff = new Date(Date.now() - (daysOverdue ?? 30) * 86400000);
            const rows = await prisma.salesInvoice.findMany({
                where: { date: { lte: cutoff }, remaining: { gt: 0 }, deletedAt: null },
                take: 20,
                select: { id: true, invoiceNo: true, date: true, remaining: true, customerId: true },
                orderBy: { date: 'asc' },
            });
            return JSON.stringify({ overdueCount: rows.length, totalOverdue: rows.reduce((s: number, r: any) => s + Number(r.remaining ?? 0), 0), invoices: rows });
        },
        { name: 'list_overdue_invoices', description: 'List invoices overdue by N days (default 30).', schema: z.object({ daysOverdue: z.number().optional() }) }
    );

    const getKpiDashboard = lc.tool(
        async () => {
            const today = new Date();
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const [revenue, expenses, receivable, payable, pendingApprovals] = await Promise.all([
                prisma.salesInvoice.aggregate({ where: { date: { gte: monthStart }, deletedAt: null }, _sum: { total: true } }),
                (prisma as any).expense?.aggregate({ where: { date: { gte: monthStart } }, _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })),
                prisma.customer.aggregate({ where: { balance: { gt: 0 } }, _sum: { balance: true } }),
                (prisma as any).supplier?.aggregate({ where: { balance: { gt: 0 } }, _sum: { balance: true } }).catch(() => ({ _sum: { balance: 0 } })),
                (prisma as any).approvalRequest?.count({ where: { status: 'PENDING' } }).catch(() => 0),
            ]);
            return JSON.stringify({
                monthRevenue:     Number(revenue._sum.total ?? 0),
                monthExpenses:    Number(expenses._sum.amount ?? 0),
                totalReceivable:  Number(receivable._sum.balance ?? 0),
                totalPayable:     Number(payable._sum.balance ?? 0),
                pendingApprovals,
                profit:           Number(revenue._sum.total ?? 0) - Number(expenses._sum.amount ?? 0),
                currency:         'SAR',
                period:           { from: monthStart.toISOString().split('T')[0], to: today.toISOString().split('T')[0] },
            });
        },
        { name: 'get_kpi_dashboard', description: 'Get a full KPI snapshot: revenue, expenses, receivable, payable, approvals.', schema: z.object({}) }
    );

    return [
        // Original 8
        getErpMetrics, getCustomerBalance, getInvoiceById, searchProducts,
        getAccountBalance, listOpenInvoices, listPendingApprovals, getCashPosition,
        // Extended 17 (P3.10)
        getEmployeeInfo, listLowStockProducts, getTrialBalance, getZatcaStatus,
        getSupplierBalance, getBudgetStatus, listRecentJournals, getPayrollSummary,
        getExpensesByCategory, searchCustomers, getPurchaseOrderStatus, getProductStock,
        getAgingReport, createJournalEntry, getSalesReport, listOverdueInvoices,
        getKpiDashboard,
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
