/**
 * LangChain ERP Tools
 * ──────────────────────────────────────────────────────────
 * 25 structured tools for AI agents to interact with the ERP.
 * Each tool has: name, description (Arabic), parameters, execute function.
 */

import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ route: 'ERPTools' });

export interface ERPTool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

function prisma() { return getPrisma() as any; }

export const erpTools: ERPTool[] = [
  // ── Sales ──
  {
    name: 'get_sales_summary',
    description: 'الحصول على ملخص المبيعات لفترة محددة',
    parameters: { dateFrom: { type: 'string', description: 'تاريخ البداية', required: true }, dateTo: { type: 'string', description: 'تاريخ النهاية', required: true } },
    execute: async (p) => {
      const result = await prisma().salesInvoice.aggregate({ where: { date: { gte: new Date(p.dateFrom as string), lte: new Date(p.dateTo as string) } }, _sum: { total: true, paid: true }, _count: true });
      return { totalSales: Number(result._sum.total || 0), totalPaid: Number(result._sum.paid || 0), invoiceCount: result._count };
    },
  },
  {
    name: 'get_top_products',
    description: 'الحصول على أكثر المنتجات مبيعاً',
    parameters: { limit: { type: 'number', description: 'عدد المنتجات' } },
    execute: async (p) => {
      const details = await prisma().salesInvoiceDetail.groupBy({ by: ['productId'], _sum: { quantity: true, total: true }, orderBy: { _sum: { total: 'desc' } }, take: Number(p.limit) || 10 });
      return details;
    },
  },
  {
    name: 'get_top_customers',
    description: 'الحصول على أفضل العملاء حسب المبيعات',
    parameters: { limit: { type: 'number', description: 'عدد العملاء' } },
    execute: async (p) => {
      const result = await prisma().salesInvoice.groupBy({ by: ['customerId'], _sum: { total: true }, orderBy: { _sum: { total: 'desc' } }, take: Number(p.limit) || 10 });
      return result;
    },
  },
  {
    name: 'get_invoice_details',
    description: 'الحصول على تفاصيل فاتورة محددة',
    parameters: { invoiceId: { type: 'number', description: 'رقم الفاتورة', required: true } },
    execute: async (p) => prisma().salesInvoice.findUnique({ where: { id: Number(p.invoiceId) }, include: { details: true, customer: true } }),
  },

  // ── Accounting ──
  {
    name: 'get_trial_balance',
    description: 'الحصول على ميزان المراجعة',
    parameters: {},
    execute: async () => {
      const accounts = await prisma().account.findMany({ select: { id: true, name: true, code: true, balance: true, type: true } });
      const totalDebit = accounts.filter((a: any) => Number(a.balance) > 0).reduce((s: number, a: any) => s + Number(a.balance), 0);
      const totalCredit = accounts.filter((a: any) => Number(a.balance) < 0).reduce((s: number, a: any) => s + Math.abs(Number(a.balance)), 0);
      return { accounts: accounts.length, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 };
    },
  },
  {
    name: 'get_account_balance',
    description: 'الحصول على رصيد حساب محدد',
    parameters: { accountCode: { type: 'string', description: 'رمز الحساب', required: true } },
    execute: async (p) => prisma().account.findFirst({ where: { code: p.accountCode as string }, select: { name: true, code: true, balance: true, type: true } }),
  },
  {
    name: 'get_journal_entries',
    description: 'الحصول على آخر القيود المحاسبية',
    parameters: { limit: { type: 'number', description: 'عدد القيود' } },
    execute: async (p) => prisma().journalEntry.findMany({ take: Number(p.limit) || 20, orderBy: { id: 'desc' }, include: { lines: true } }),
  },
  {
    name: 'get_receivables',
    description: 'الحصول على الذمم المدينة (المبالغ المستحقة من العملاء)',
    parameters: {},
    execute: async () => {
      const result = await prisma().salesInvoice.aggregate({ where: { remaining: { gt: 0 } }, _sum: { remaining: true }, _count: true });
      return { totalReceivables: Number(result._sum.remaining || 0), count: result._count };
    },
  },
  {
    name: 'get_payables',
    description: 'الحصول على الذمم الدائنة (المبالغ المستحقة للموردين)',
    parameters: {},
    execute: async () => {
      const result = await prisma().purchaseInvoice.aggregate({ where: { remaining: { gt: 0 } }, _sum: { remaining: true }, _count: true });
      return { totalPayables: Number(result._sum.remaining || 0), count: result._count };
    },
  },

  // ── Inventory ──
  {
    name: 'get_stock_levels',
    description: 'الحصول على مستويات المخزون',
    parameters: { lowStockOnly: { type: 'boolean', description: 'عرض المنتجات منخفضة المخزون فقط' } },
    execute: async (p) => {
      const where = p.lowStockOnly ? { stockQuantity: { lte: prisma().product.fields?.reorderPoint || 10 } } : {};
      return prisma().product.findMany({ where, select: { id: true, name: true, barcode: true, stockQuantity: true, price: true }, take: 50 });
    },
  },
  {
    name: 'get_inventory_value',
    description: 'حساب القيمة الإجمالية للمخزون',
    parameters: {},
    execute: async () => {
      const products = await prisma().product.findMany({ select: { stockQuantity: true, cost: true } });
      const totalValue = products.reduce((s: number, p: any) => s + (Number(p.stockQuantity) * Number(p.cost || 0)), 0);
      return { totalProducts: products.length, totalValue: Math.round(totalValue * 100) / 100 };
    },
  },

  // ── HR ──
  {
    name: 'get_employee_count',
    description: 'الحصول على عدد الموظفين',
    parameters: {},
    execute: async () => {
      const [total, active] = await Promise.all([prisma().employee.count(), prisma().employee.count({ where: { active: true } })]);
      return { total, active, inactive: total - active };
    },
  },
  {
    name: 'get_payroll_summary',
    description: 'ملخص الرواتب لشهر محدد',
    parameters: { month: { type: 'number', description: 'الشهر', required: true }, year: { type: 'number', description: 'السنة', required: true } },
    execute: async (p) => {
      const salaries = await prisma().salary.findMany({ where: { month: Number(p.month), year: Number(p.year) } });
      const totalNet = salaries.reduce((s: number, r: any) => s + Number(r.netSalary || 0), 0);
      return { month: p.month, year: p.year, employeesPaid: salaries.length, totalNet };
    },
  },
  {
    name: 'get_employee_details',
    description: 'تفاصيل موظف محدد',
    parameters: { employeeId: { type: 'number', description: 'رقم الموظف', required: true } },
    execute: async (p) => prisma().employee.findUnique({ where: { id: Number(p.employeeId) }, include: { salaries: { take: 3, orderBy: { id: 'desc' } } } }),
  },

  // ── Customers ──
  {
    name: 'get_customer_balance',
    description: 'الحصول على رصيد عميل',
    parameters: { customerId: { type: 'number', description: 'رقم العميل', required: true } },
    execute: async (p) => {
      const agg = await prisma().salesInvoice.aggregate({ where: { customerId: Number(p.customerId) }, _sum: { total: true, paid: true } });
      return { totalSales: Number(agg._sum.total || 0), totalPaid: Number(agg._sum.paid || 0), balance: Number(agg._sum.total || 0) - Number(agg._sum.paid || 0) };
    },
  },
  {
    name: 'search_customers',
    description: 'البحث عن عملاء',
    parameters: { query: { type: 'string', description: 'كلمة البحث', required: true } },
    execute: async (p) => prisma().customer.findMany({ where: { name: { contains: p.query as string } }, take: 20 }),
  },

  // ── Products ──
  {
    name: 'search_products',
    description: 'البحث عن منتجات',
    parameters: { query: { type: 'string', description: 'اسم أو باركود المنتج', required: true } },
    execute: async (p) => prisma().product.findMany({ where: { OR: [{ name: { contains: p.query as string } }, { barcode: { contains: p.query as string } }] }, take: 20 }),
  },
  {
    name: 'get_product_sales_history',
    description: 'تاريخ مبيعات منتج',
    parameters: { productId: { type: 'number', description: 'رقم المنتج', required: true } },
    execute: async (p) => prisma().salesInvoiceDetail.findMany({ where: { productId: Number(p.productId) }, include: { invoice: { select: { date: true, invoiceNo: true } } }, take: 20, orderBy: { id: 'desc' } }),
  },

  // ── Reports ──
  {
    name: 'get_daily_sales',
    description: 'مبيعات اليوم',
    parameters: {},
    execute: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const result = await prisma().salesInvoice.aggregate({ where: { date: { gte: today } }, _sum: { total: true, paid: true }, _count: true });
      return { date: today.toISOString().split('T')[0], total: Number(result._sum.total || 0), invoices: result._count };
    },
  },
  {
    name: 'get_monthly_comparison',
    description: 'مقارنة شهرية',
    parameters: { year: { type: 'number', description: 'السنة' } },
    execute: async (p) => {
      const year = Number(p.year) || new Date().getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31);
      const invoices = await prisma().salesInvoice.findMany({
        where: { date: { gte: startOfYear, lte: endOfYear } },
        select: { date: true, total: true },
      });
      const monthly: Record<number, number> = {};
      invoices.forEach((inv: any) => {
        const month = new Date(inv.date).getMonth() + 1;
        monthly[month] = (monthly[month] || 0) + Number(inv.total);
      });
      return { year, monthly };
    },
  },

  // ── System ──
  {
    name: 'get_system_health',
    description: 'حالة النظام',
    parameters: {},
    execute: async () => {
      const mem = process.memoryUsage();
      return { uptime: Math.round(process.uptime()), memoryMb: Math.round(mem.heapUsed / 1024 / 1024), nodeVersion: process.version };
    },
  },
  {
    name: 'get_audit_log',
    description: 'سجل التدقيق',
    parameters: { limit: { type: 'number', description: 'عدد السجلات' } },
    execute: async (p) => prisma().auditLog.findMany({ take: Number(p.limit) || 20, orderBy: { date: 'desc' } }),
  },
  {
    name: 'count_records',
    description: 'إحصائيات عامة عن عدد السجلات',
    parameters: {},
    execute: async () => {
      const [invoices, customers, products, employees, journals] = await Promise.all([
        prisma().salesInvoice.count(), prisma().customer.count(), prisma().product.count(),
        prisma().employee.count(), prisma().journalEntry.count(),
      ]);
      return { invoices, customers, products, employees, journals };
    },
  },

  // ── Expenses ──
  {
    name: 'get_expenses_summary',
    description: 'ملخص المصروفات',
    parameters: { dateFrom: { type: 'string', description: 'من تاريخ' }, dateTo: { type: 'string', description: 'إلى تاريخ' } },
    execute: async (p) => {
      const where: any = {};
      if (p.dateFrom) where.date = { gte: new Date(p.dateFrom as string) };
      if (p.dateTo) where.date = { ...where.date, lte: new Date(p.dateTo as string) };
      const result = await prisma().expense.aggregate({ where, _sum: { amount: true }, _count: true });
      return { totalExpenses: Number(result._sum.amount || 0), count: result._count };
    },
  },

  // ── Cash Flow ──
  {
    name: 'get_cash_position',
    description: 'الوضع النقدي الحالي',
    parameters: {},
    execute: async () => {
      const cashAccount = await prisma().account.findFirst({ where: { code: '1100' }, select: { balance: true } });
      const bankAccount = await prisma().account.findFirst({ where: { code: '1200' }, select: { balance: true } });
      return { cash: Number(cashAccount?.balance || 0), bank: Number(bankAccount?.balance || 0), total: Number(cashAccount?.balance || 0) + Number(bankAccount?.balance || 0) };
    },
  },
];

/** Get tool by name */
export function getTool(name: string): ERPTool | undefined {
  return erpTools.find(t => t.name === name);
}

/** Execute a tool by name */
export async function executeTool(name: string, params: Record<string, unknown>): Promise<unknown> {
  const tool = getTool(name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  log.info(`Executing tool: ${name}`, { params });
  return tool.execute(params);
}

/** List all tools (for LLM function calling) */
export function listTools(): { name: string; description: string; parameters: Record<string, unknown> }[] {
  return erpTools.map(t => ({ name: t.name, description: t.description, parameters: t.parameters }));
}
