/**
 * Auto-Journal Entry Library
 * يقوم بإنشاء قيود محاسبية تلقائية عند حفظ الفواتير والمصروفات
 * 
 * مبدأ القيد المزدوج: المدين = الدائن دائماً
 */

import prisma from './prisma';

// أكواد الحسابات الافتراضية
const ACCOUNTS = {
    CASH: '1110',           // الصندوق
    BANK: '1120',           // البنك
    RECEIVABLES: '1200',    // المدينون (العملاء)
    INVENTORY: '1300',      // المخزون
    VAT_INPUT: '1400',      // ضريبة مدخلات
    PAYABLES: '2100',       // الدائنون (الموردون)
    VAT_OUTPUT: '2300',     // ضريبة مخرجات
    SALES: '4100',          // المبيعات
    SALES_RETURNS: '4110',  // مرتجعات المبيعات
    SALES_DISCOUNT: '4120', // خصم مسموح به
    OTHER_REVENUE: '4200',  // إيرادات أخرى
    COGS: '5100',           // تكلفة البضاعة المباعة
    PURCHASE_RETURNS: '5110', // مرتجعات المشتريات
    SALARIES: '5200',       // الرواتب
};

// Get account ID by code
async function getAccountId(code: string): Promise<number | null> {
    const account = await prisma.account.findFirst({ where: { code } });
    return account?.id || null;
}

// Generate next entry number
async function getNextEntryNumber(): Promise<string> {
    const last = await prisma.journalEntry.findFirst({
        orderBy: { id: 'desc' },
    });
    const lastNum = last ? parseInt(last.entryNumber.replace('JE', '')) : 0;
    return `JE${(lastNum + 1).toString().padStart(6, '0')}`;
}

/**
 * Create a journal entry with lines
 */
async function createJournalEntry(params: {
    description: string;
    reference?: string;
    lines: Array<{ accountCode: string; debit: number; credit: number; description?: string }>;
    userId?: number;
    branchId?: number | null;
    date?: string;
}): Promise<{ success: boolean; entryId?: number; error?: string }> {
    try {
        // Validate: total debit must equal total credit
        const totalDebit = params.lines.reduce((sum, l) => sum + l.debit, 0);
        const totalCredit = params.lines.reduce((sum, l) => sum + l.credit, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return { success: false, error: `القيد غير متوازن: مدين ${totalDebit} ≠ دائن ${totalCredit}` };
        }

        // Resolve account IDs
        const resolvedLines: Array<{ accountId: number; debit: number; credit: number; description?: string }> = [];
        for (const line of params.lines) {
            if (line.debit === 0 && line.credit === 0) continue; // skip zero lines
            const accountId = await getAccountId(line.accountCode);
            if (!accountId) {
                return { success: false, error: `حساب غير موجود: ${line.accountCode}` };
            }
            resolvedLines.push({
                accountId,
                debit: line.debit,
                credit: line.credit,
                description: line.description,
            });
        }

        const entryNumber = await getNextEntryNumber();
        const entryDate = params.date || new Date().toISOString().split('T')[0];

        // Create entry + lines in transaction
        const entry = await prisma.journalEntry.create({
            data: {
                entryNumber,
                entryDate,
                description: params.description,
                reference: params.reference,
                totalDebit: Math.round(totalDebit * 100) / 100,
                totalCredit: Math.round(totalCredit * 100) / 100,
                status: 'posted',
                createdBy: params.userId,
                branchId: params.branchId,
                lines: {
                    create: resolvedLines.map(l => ({
                        accountId: l.accountId,
                        debit: Math.round(l.debit * 100) / 100,
                        credit: Math.round(l.credit * 100) / 100,
                        description: l.description,
                    })),
                },
            },
        });

        // Update account balances
        for (const line of resolvedLines) {
            const account = await prisma.account.findUnique({ where: { id: line.accountId } });
            if (account) {
                let balanceChange = 0;
                // Assets & Expenses: debit increases, credit decreases
                // Liabilities, Equity & Revenue: credit increases, debit decreases
                if (['asset', 'expense'].includes(account.type)) {
                    balanceChange = line.debit - line.credit;
                } else {
                    balanceChange = line.credit - line.debit;
                }
                await prisma.account.update({
                    where: { id: line.accountId },
                    data: { balance: { increment: Math.round(balanceChange * 100) / 100 } },
                });
            }
        }

        return { success: true, entryId: entry.id };
    } catch (error) {
        console.error('Auto-journal error:', error);
        return { success: false, error: String(error) };
    }
}

// ============ Auto-posting functions ============

/**
 * قيد بيع نقدي
 * مدين: الصندوق (الإجمالي مع الضريبة)
 * دائن: المبيعات (المبلغ قبل الضريبة)
 * دائن: ضريبة مخرجات (مبلغ الضريبة)
 */
export async function postSalesInvoice(invoice: {
    invoiceNo: number;
    subtotal: number;
    taxValue: number;
    total: number;
    paymentType: string;
    splitCash?: number;
    splitCard?: number;
    userId?: number;
    branchId?: number | null;
    date?: string;
    discountValue?: number;
}) {
    const lines: Array<{ accountCode: string; debit: number; credit: number; description?: string }> = [];

    // Debit: cash/bank/receivables (or split)
    if (invoice.paymentType === 'split') {
        if (invoice.splitCash && invoice.splitCash > 0) {
            lines.push({
                accountCode: ACCOUNTS.CASH,
                debit: invoice.splitCash,
                credit: 0,
                description: `تحصيل نقدي - فاتورة بيع #${invoice.invoiceNo}`,
            });
        }
        if (invoice.splitCard && invoice.splitCard > 0) {
            lines.push({
                accountCode: ACCOUNTS.BANK,
                debit: invoice.splitCard,
                credit: 0,
                description: `تحصيل شبكة - فاتورة بيع #${invoice.invoiceNo}`,
            });
        }
    } else {
        const cashAccount = invoice.paymentType === 'cash' ? ACCOUNTS.CASH :
            invoice.paymentType === 'bank' ? ACCOUNTS.BANK :
                ACCOUNTS.RECEIVABLES;
        lines.push({
            accountCode: cashAccount,
            debit: invoice.total,
            credit: 0,
            description: `تحصيل فاتورة بيع #${invoice.invoiceNo}`,
        });
    }

    // Credit: Sales (subtotal - discount)
    const netSales = invoice.subtotal - (invoice.discountValue || 0);
    lines.push({
        accountCode: ACCOUNTS.SALES,
        debit: 0,
        credit: netSales,
        description: `مبيعات فاتورة #${invoice.invoiceNo}`,
    });

    // Credit: VAT Output
    if (invoice.taxValue > 0) {
        lines.push({
            accountCode: ACCOUNTS.VAT_OUTPUT,
            debit: 0,
            credit: invoice.taxValue,
            description: `ضريبة مبيعات فاتورة #${invoice.invoiceNo}`,
        });
    }

    // Debit: Sales Discount
    if (invoice.discountValue && invoice.discountValue > 0) {
        lines.push({
            accountCode: ACCOUNTS.SALES_DISCOUNT,
            debit: invoice.discountValue,
            credit: 0,
            description: `خصم فاتورة بيع #${invoice.invoiceNo}`,
        });
    }

    return createJournalEntry({
        description: `فاتورة بيع #${invoice.invoiceNo}`,
        reference: `SALE-${invoice.invoiceNo}`,
        lines,
        userId: invoice.userId,
        branchId: invoice.branchId,
        date: invoice.date,
    });
}

/**
 * قيد شراء
 * مدين: تكلفة البضاعة (المبلغ قبل الضريبة)
 * مدين: ضريبة مدخلات (مبلغ الضريبة)
 * دائن: الصندوق/الدائنون
 */
export async function postPurchaseInvoice(invoice: {
    invoiceNo: number;
    subtotal: number;
    taxValue: number;
    total: number;
    paymentType: string;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    const lines: Array<{ accountCode: string; debit: number; credit: number; description?: string }> = [];
    const payAccount = invoice.paymentType === 'cash' ? ACCOUNTS.CASH :
        invoice.paymentType === 'bank' ? ACCOUNTS.BANK :
            ACCOUNTS.PAYABLES;

    // Debit: COGS
    lines.push({
        accountCode: ACCOUNTS.COGS,
        debit: invoice.subtotal,
        credit: 0,
        description: `مشتريات فاتورة #${invoice.invoiceNo}`,
    });

    // Debit: VAT Input
    if (invoice.taxValue > 0) {
        lines.push({
            accountCode: ACCOUNTS.VAT_INPUT,
            debit: invoice.taxValue,
            credit: 0,
            description: `ضريبة مشتريات فاتورة #${invoice.invoiceNo}`,
        });
    }

    // Credit: Cash/Bank/Payables
    lines.push({
        accountCode: payAccount,
        debit: 0,
        credit: invoice.total,
        description: `سداد فاتورة شراء #${invoice.invoiceNo}`,
    });

    return createJournalEntry({
        description: `فاتورة شراء #${invoice.invoiceNo}`,
        reference: `PUR-${invoice.invoiceNo}`,
        lines,
        userId: invoice.userId,
        branchId: invoice.branchId,
        date: invoice.date,
    });
}

/**
 * قيد مصروف
 * مدين: حساب المصروف
 * دائن: الصندوق
 */
export async function postExpense(expense: {
    id: number;
    category: string;
    amount: number;
    description: string;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    // Map expense category to account code
    const categoryMap: Record<string, string> = {
        'رواتب': ACCOUNTS.SALARIES,
        'إيجار': '5300',
        'كهرباء': '5400',
        'اتصالات': '5500',
        'صيانة': '5600',
        'تسويق': '5700',
        'إدارية': '5800',
    };

    const expenseAccount = categoryMap[expense.category] || '5950'; // default: متنوعة

    return createJournalEntry({
        description: `مصروف: ${expense.description}`,
        reference: `EXP-${expense.id}`,
        lines: [
            { accountCode: expenseAccount, debit: expense.amount, credit: 0, description: expense.description },
            { accountCode: ACCOUNTS.CASH, debit: 0, credit: expense.amount, description: `سداد مصروف #${expense.id}` },
        ],
        userId: expense.userId,
        branchId: expense.branchId,
        date: expense.date,
    });
}

/**
 * قيد مرتجع مبيعات
 */
export async function postSalesReturn(ret: {
    returnNo: number;
    total: number;
    taxValue: number;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    const netAmount = ret.total - ret.taxValue;
    return createJournalEntry({
        description: `مرتجع مبيعات #${ret.returnNo}`,
        reference: `SRET-${ret.returnNo}`,
        lines: [
            { accountCode: ACCOUNTS.SALES_RETURNS, debit: netAmount, credit: 0 },
            { accountCode: ACCOUNTS.VAT_OUTPUT, debit: ret.taxValue, credit: 0 },
            { accountCode: ACCOUNTS.CASH, debit: 0, credit: ret.total },
        ],
        userId: ret.userId,
        branchId: ret.branchId,
        date: ret.date,
    });
}

/**
 * قيد راتب
 */
export async function postSalary(salary: {
    employeeName: string;
    netSalary: number;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    return createJournalEntry({
        description: `راتب ${salary.employeeName}`,
        reference: `SAL-${Date.now()}`,
        lines: [
            { accountCode: ACCOUNTS.SALARIES, debit: salary.netSalary, credit: 0, description: `راتب ${salary.employeeName}` },
            { accountCode: ACCOUNTS.CASH, debit: 0, credit: salary.netSalary, description: `سداد راتب ${salary.employeeName}` },
        ],
        userId: salary.userId,
        branchId: salary.branchId,
        date: salary.date,
    });
}

/**
 * Create manual journal entry
 */
export { createJournalEntry };
