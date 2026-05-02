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
    INVENTORY: '1300',      // المخزون (المواد الخام)
    IN_TRANSIT: '1310',     // بضاعة بالطريق
    WIP: '1330',            // مخزون تحت التشغيل (Work-in-Process)
    FINISHED_GOODS: '1340', // مخزون البضاعة التامة (Finished Goods)
    VAT_INPUT: '1400',      // ضريبة مدخلات
    PAYABLES: '2100',       // الدائنون (الموردون)
    GRNI: '2110',           // فواتير غير مستلمة (استلام بدون فاتورة)
    VAT_OUTPUT: '2300',     // ضريبة مخرجات
    SALES: '4100',          // المبيعات
    SALES_RETURNS: '4110',  // مرتجعات المبيعات
    SALES_DISCOUNT: '4120', // خصم مسموح به
    OTHER_REVENUE: '4200',  // إيرادات أخرى
    COGS: '5100',           // تكلفة البضاعة المباعة
    PURCHASE_RETURNS: '5110', // مرتجعات المشتريات
    SHRINKAGE: '5120',      // مصروف عجز وتسوية مخزون
    MFG_VARIANCE: '5130',   // انحرافات تكاليف الإنتاج (Manufacturing Variance)
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
    lines: Array<{ accountCode: string; costCenterId?: number; debit: number; credit: number; foreignDebit?: number; foreignCredit?: number; description?: string }>;
    userId?: number;
    branchId?: number | null;
    date?: string;
    currencyId?: number | null;
    exchangeRate?: number;
    status?: string;
}): Promise<{ success: boolean; entryId?: number; error?: string }> {
    try {
        // Validate: total debit must equal total credit
        const totalDebit = params.lines.reduce((sum, l) => sum + l.debit, 0);
        const totalCredit = params.lines.reduce((sum, l) => sum + l.credit, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return { success: false, error: `القيد غير متوازن: مدين ${totalDebit} ≠ دائن ${totalCredit}` };
        }

        // Resolve account IDs
        const resolvedLines: Array<{ accountId: number; costCenterId?: number; debit: number; credit: number; foreignDebit: number; foreignCredit: number; description?: string }> = [];
        for (const line of params.lines) {
            if (line.debit === 0 && line.credit === 0 && (line.foreignDebit || 0) === 0 && (line.foreignCredit || 0) === 0) continue; // skip zero lines
            const accountId = await getAccountId(line.accountCode);
            if (!accountId) {
                return { success: false, error: `حساب غير موجود: ${line.accountCode}` };
            }
            resolvedLines.push({
                accountId,
                costCenterId: line.costCenterId,
                debit: line.debit,
                credit: line.credit,
                foreignDebit: line.foreignDebit || line.debit,
                foreignCredit: line.foreignCredit || line.credit,
                description: line.description,
            });
        }

        const entryNumber = await getNextEntryNumber();
        const entryDate = params.date || new Date().toISOString().split('T')[0];

        // Ensure Fiscal Period is OPEN
        const [year, month] = entryDate.split('-').map(Number);
        if (year && month) {
            const period = await prisma.fiscalPeriod.findUnique({
                where: { year_month: { year, month } }
            });
            if (period && period.status !== 'open') {
                return { success: false, error: `الفترة المالية (${month}/${year}) مغلقة أو مقفلة، لا يمكن إضافة قيود جديدة.` };
            }
        }

        // Create entry + lines in transaction
        const entry = await prisma.journalEntry.create({
            data: {
                entryNumber,
                entryDate,
                description: params.description,
                reference: params.reference,
                totalDebit: Math.round(totalDebit * 100) / 100,
                totalCredit: Math.round(totalCredit * 100) / 100,
                status: params.status || 'draft',
                createdBy: params.userId,

                branchId: params.branchId,
                // @ts-ignore - Local VSCode lock bypass
                currencyId: params.currencyId || null,
                exchangeRate: params.exchangeRate || 1.0,
                lines: {
                    create: resolvedLines.map(l => ({
                        accountId: l.accountId,
                        costCenterId: l.costCenterId || null,
                        debit: Math.round(l.debit * 100) / 100,
                        credit: Math.round(l.credit * 100) / 100,
                        foreignDebit: Math.round(l.foreignDebit * 100) / 100,
                        foreignCredit: Math.round(l.foreignCredit * 100) / 100,
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
    totalCost?: number; // تكلفة البضاعة المباعة
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

    // Cost of Goods Sold (Perpetual Inventory)
    if (invoice.totalCost && invoice.totalCost > 0) {
        // Debit COGS
        lines.push({
            accountCode: ACCOUNTS.COGS,
            debit: invoice.totalCost,
            credit: 0,
            description: `تكلفة بضاعة مباعة فاتورة #${invoice.invoiceNo}`,
        });
        // Credit Inventory
        lines.push({
            accountCode: ACCOUNTS.INVENTORY,
            debit: 0,
            credit: invoice.totalCost,
            description: `صرف مخزون مباع فاتورة #${invoice.invoiceNo}`,
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
    landedCosts?: Array<{ accountCode: string; amountValue: number; description: string }>;
}) {
    const lines: Array<{ accountCode: string; debit: number; credit: number; description?: string }> = [];
    const payAccount = invoice.paymentType === 'cash' ? ACCOUNTS.CASH :
        invoice.paymentType === 'bank' ? ACCOUNTS.BANK :
            ACCOUNTS.PAYABLES;

    let totalLandedCost = 0;
    if (invoice.landedCosts && invoice.landedCosts.length > 0) {
        for (const lc of invoice.landedCosts) {
            totalLandedCost += lc.amountValue;
            // Credit: The clearing account (e.g. Customs Accrual, Transit account)
            lines.push({
                accountCode: lc.accountCode,
                debit: 0,
                credit: lc.amountValue,
                description: `توزيع تكلفة: ${lc.description} لفاتورة #${invoice.invoiceNo}`,
            });
        }
    }

    // Debit: INVENTORY - Base Cost + Landed Costs
    lines.push({
        accountCode: ACCOUNTS.INVENTORY,
        debit: invoice.subtotal + totalLandedCost,
        credit: 0,
        description: `مشتريات فاتورة #${invoice.invoiceNo} ${totalLandedCost > 0 ? '(متضمنة تكاليف الاستيراد)' : ''}`,
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
    costCenterId?: number | null;
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
            { accountCode: expenseAccount, costCenterId: expense.costCenterId || undefined, debit: expense.amount, credit: 0, description: expense.description },
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
    totalCost?: number;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    const netAmount = ret.total - ret.taxValue;
    const lines: Array<{ accountCode: string; debit: number; credit: number; description?: string }> = [
        { accountCode: ACCOUNTS.SALES_RETURNS, debit: netAmount, credit: 0 },
        { accountCode: ACCOUNTS.VAT_OUTPUT, debit: ret.taxValue, credit: 0 },
        { accountCode: ACCOUNTS.CASH, debit: 0, credit: ret.total },
    ];

    if (ret.totalCost && ret.totalCost > 0) {
        // Reverse COGS
        lines.push({ accountCode: ACCOUNTS.INVENTORY, debit: ret.totalCost, credit: 0, description: `استرجاع مخزون - مرتجع #${ret.returnNo}` });
        lines.push({ accountCode: ACCOUNTS.COGS, debit: 0, credit: ret.totalCost, description: `عكس تكلفة بضاعة مباعة - مرتجع #${ret.returnNo}` });
    }

    return createJournalEntry({
        description: `مرتجع مبيعات #${ret.returnNo}`,
        reference: `SRET-${ret.returnNo}`,
        lines,
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
 * قيد تحويل مخزون ذكي (In-Transit WMS)
 */
export async function postStockTransfer(transfer: {
    movementId: number;
    reference: string;
    type: 'transit_out' | 'transit_in';
    totalCost: number;
    productName: string;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    const lines = [];

    if (transfer.type === 'transit_out') {
        // Debit: IN_TRANSIT, Credit: INVENTORY
        lines.push({ accountCode: ACCOUNTS.IN_TRANSIT, debit: transfer.totalCost, credit: 0, description: `إرسال بضاعة للفرع الهدف: ${transfer.productName}` });
        lines.push({ accountCode: ACCOUNTS.INVENTORY, debit: 0, credit: transfer.totalCost, description: `مخزون صادر بالطريق: ${transfer.productName}` });
    } else {
        // Debit: INVENTORY, Credit: IN_TRANSIT
        lines.push({ accountCode: ACCOUNTS.INVENTORY, debit: transfer.totalCost, credit: 0, description: `استلام بضاعة محولة: ${transfer.productName}` });
        lines.push({ accountCode: ACCOUNTS.IN_TRANSIT, debit: 0, credit: transfer.totalCost, description: `إقفال حساب بضاعة بالطريق: ${transfer.productName}` });
    }

    return createJournalEntry({
        description: `حركة تحويل مخزوني رقم #${transfer.movementId} - ${transfer.type === 'transit_out' ? 'إرسال' : 'استلام'}`,
        reference: transfer.reference,
        lines,
        userId: transfer.userId,
        branchId: transfer.branchId,
        date: transfer.date || new Date().toISOString().split('T')[0],
    });
}

/**
 * قيد مرتجع مشتريات
 * مدين: الصندوق/المورد
 * دائن: المخزون/تكلفة المشتريات
 * دائن: ضريبة المدخلات
 */
export async function postPurchaseReturn(ret: {
    returnNo: number;
    subtotal: number;
    taxValue: number;
    total: number;
    paymentType: string;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    const receiveAccount = ret.paymentType === 'cash' ? ACCOUNTS.CASH :
        ret.paymentType === 'bank' ? ACCOUNTS.BANK :
            ACCOUNTS.PAYABLES;

    return createJournalEntry({
        description: `مرتجع مشتريات #${ret.returnNo}`,
        reference: `PRET-${ret.returnNo}`,
        lines: [
            { accountCode: receiveAccount, debit: ret.total, credit: 0, description: `استرداد نقدي لمرتجع مشتريات #${ret.returnNo}` },
            { accountCode: ACCOUNTS.INVENTORY, debit: 0, credit: ret.subtotal, description: `نقص مخزون بسبب الاسترجاع #${ret.returnNo}` },
            { accountCode: ACCOUNTS.VAT_INPUT, debit: 0, credit: ret.taxValue, description: `عكس ضريبة المدخلات لمرتجع #${ret.returnNo}` },
        ],
        userId: ret.userId,
        branchId: ret.branchId,
        date: ret.date,
    });
}

/**
 * قيد تسوية جردية
 */
export async function postInventoryAdjustment(adj: {
    productId: number;
    diffCost: number; // positive = increase stock, negative = shrink
    reason: string;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    const lines = [];
    const absCost = Math.abs(adj.diffCost);

    if (adj.diffCost > 0) {
        // Gain: Dr Inventory, Cr Shrinkage (as income recovery)
        lines.push({ accountCode: ACCOUNTS.INVENTORY, debit: absCost, credit: 0, description: `زيادة تسوية جردية: ${adj.reason}` });
        lines.push({ accountCode: ACCOUNTS.SHRINKAGE, debit: 0, credit: absCost, description: `إيراد عرضي من تسوية مخزون: ${adj.reason}` });
    } else {
        // Loss: Dr Shrinkage, Cr Inventory
        lines.push({ accountCode: ACCOUNTS.SHRINKAGE, debit: absCost, credit: 0, description: `خسارة تسوية عجز: ${adj.reason}` });
        lines.push({ accountCode: ACCOUNTS.INVENTORY, debit: 0, credit: absCost, description: `نقص تسوية جردية: ${adj.reason}` });
    }

    return createJournalEntry({
        description: `تسوية أصدة مستودع (الجرد)`,
        reference: `ADJ-${Date.now()}`,
        lines,
        userId: adj.userId,
        branchId: adj.branchId,
        date: adj.date,
    });
}

/**
 * قيد استلام بضاعة (GRN)
 */
export async function postGRN(grn: {
    grnNo: number;
    totalCost: number;
    supplierName?: string;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    // Dr Inventory
    // Cr GRNI (Goods Received Not Invoiced)
    return createJournalEntry({
        description: `سند إدخال مخزني #${grn.grnNo} من ${grn.supplierName || 'مورد'}`,
        reference: `GRN-${grn.grnNo}`,
        lines: [
            { accountCode: ACCOUNTS.INVENTORY, debit: grn.totalCost, credit: 0, description: `استلام مخزون وارد سند ادخال #${grn.grnNo}` },
            { accountCode: ACCOUNTS.GRNI, debit: 0, credit: grn.totalCost, description: `استحقاق استلام بضاعة غير مفوترة #${grn.grnNo}` },
        ],
        userId: grn.userId,
        branchId: grn.branchId,
        date: grn.date,
    });
}

/**
 * قيد إغلاق أمر التصنيع وإثبات المنتج التام
 * ───────────────────────────────────────────
 * Dr مخزون البضاعة التامة (Finished Goods)         standardCost
 * Cr مخزون تحت التشغيل (WIP)                       actualCost
 * Dr/Cr انحرافات تكاليف الإنتاج (Variance)         |actualCost - standardCost|
 *
 * إن actualCost > standardCost → فرق غير ملائم (Dr Variance — مصروف أكبر)
 * إن actualCost < standardCost → فرق ملائم      (Cr Variance — توفير)
 */
export async function postManufacturingCompletion(params: {
    orderNumber: string;
    standardCost: number;  // التكلفة المعيارية (الأصل من recipe.totalCost × quantity)
    actualCost: number;    // التكلفة الفعلية المُجمَّعة في WIP
    productName?: string;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    const variance = params.actualCost - params.standardCost;

    const lines: Array<{ accountCode: string; debit: number; credit: number; description?: string }> = [
        {
            accountCode: ACCOUNTS.FINISHED_GOODS,
            debit: params.standardCost,
            credit: 0,
            description: `إثبات منتج تام: ${params.productName || ''} - أمر ${params.orderNumber}`,
        },
        {
            accountCode: ACCOUNTS.WIP,
            debit: 0,
            credit: params.actualCost,
            description: `تسوية حساب تحت التشغيل - أمر ${params.orderNumber}`,
        },
    ];

    // Variance line — only when there's a delta (avoid zero-amount line)
    if (Math.abs(variance) > 0.01) {
        lines.push({
            accountCode: ACCOUNTS.MFG_VARIANCE,
            debit: variance > 0 ? variance : 0,   // unfavorable: actual > standard
            credit: variance < 0 ? Math.abs(variance) : 0, // favorable: actual < standard
            description: variance > 0
                ? `انحراف غير ملائم - أمر ${params.orderNumber}`
                : `انحراف ملائم (توفير) - أمر ${params.orderNumber}`,
        });
    }

    return createJournalEntry({
        description: `إغلاق أمر التصنيع ${params.orderNumber} وإثبات المنتج التام`,
        reference: params.orderNumber,
        lines,
        userId: params.userId,
        branchId: params.branchId,
        date: params.date,
    });
}

/**
 * قيد إصدار خامات للإنتاج (Material Issue to WIP)
 * Dr مخزون تحت التشغيل (WIP)
 * Cr المخزون (المواد الخام)
 */
export async function postMaterialIssueToWIP(params: {
    orderNumber: string;
    materialCost: number;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    return createJournalEntry({
        description: `إصدار مواد خام لأمر التصنيع ${params.orderNumber}`,
        reference: params.orderNumber,
        lines: [
            { accountCode: ACCOUNTS.WIP, debit: params.materialCost, credit: 0, description: `سحب مواد - أمر ${params.orderNumber}` },
            { accountCode: ACCOUNTS.INVENTORY, debit: 0, credit: params.materialCost, description: `إخراج مواد خام - أمر ${params.orderNumber}` },
        ],
        userId: params.userId,
        branchId: params.branchId,
        date: params.date,
    });
}

/**
 * Create manual journal entry
 */
export { createJournalEntry, ACCOUNTS };

