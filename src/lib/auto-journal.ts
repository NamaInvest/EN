/**
 * Auto-Journal Entry Library
 * يقوم بإنشاء قيود محاسبية تلقائية عند حفظ الفواتير والمصروفات
 * 
 * مبدأ القيد المزدوج: المدين = الدائن دائماً
 */

import { prisma, resolveTenant, withTenant } from './prisma';
import { getNextNumber } from './numbering';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'auto-journal' });

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
    PPV: '5140',            // انحراف أسعار المشتريات (Purchase Price Variance)
    SALARIES: '5200',       // الرواتب
    WAGES_PAYABLE: '2200',      // أجور مستحقة الدفع
    GOSI_PAYABLE: '2210',       // تأمينات اجتماعية مستحقة
    LOAN_DEDUCTION: '1250',     // ذمم موظفين (سلف)
    WHT_PAYABLE: '2220',        // ضريبة استقطاع مستحقة
    EMPLOYER_GOSI_EXP: '5210',  // مصروف التأمينات (حصة صاحب العمل)
    EOS_LIABILITY: '2230',      // مخصص مكافأة نهاية الخدمة
    EOS_EXPENSE: '5220',        // مصروف مكافأة نهاية الخدمة
    FIXED_ASSET: '1500',        // أصول ثابتة
    ACCUM_DEPRECIATION: '1510', // مجمع الإهلاك
    DEPRECIATION_EXP: '5900',   // مصروف الإهلاك
    DISPOSAL_GAIN: '4300',      // أرباح رأسمالية (استبعاد أصول)
    DISPOSAL_LOSS: '5910',      // خسائر رأسمالية (استبعاد أصول)
    ACCRUED_EXPENSE: '2240',    // مصروفات مستحقة الدفع
    PREPAID_EXPENSE: '1420',    // مصروفات مدفوعة مقدماً
};

// Get account ID by code
async function getAccountId(code: string, tx: any = prisma): Promise<number | null> {
    const account = await tx.account.findFirst({ where: { code } });
    return account?.id || null;
}

// Generate next entry number
async function getNextEntryNumber(tx: any = prisma): Promise<string> {
    const seqResult = await getNextNumber(tx, 'JE');
    return seqResult.formatted;
}

/**
 * Create a journal entry with lines
 */
async function createJournalEntry(params: {
    description: string;
    reference?: string;
    lines: Array<{ accountCode: string; costCenterId?: number; debit: number; credit: number; foreignDebit?: number; foreignCredit?: number; description?: string; profitCenterId?: number; projectId?: number; segmentId?: number; productId?: number; customerId?: number; vendorId?: number; employeeId?: number; assetId?: number; bookId?: number; fxRate?: number; quantity?: number; uom?: string }>;
    userId?: number;
    branchId?: number | null;
    date?: string;
    currencyId?: number | null;
    exchangeRate?: number;
    status?: string;
    txClient?: any;
}): Promise<{ success: boolean; entryId?: number; error?: string }> {
    // 🛡️ 1. Capture tenant BEFORE any await to prevent context leakage
    const activeTenant = resolveTenant();
    
    // 🛡️ 2. Wrap all DB interactions in withTenant
    return withTenant(activeTenant, async () => {
        try {
            const executeLogic = async (tx: any) => {
        // Validate: total debit must equal total credit
        const totalDebit = params.lines.reduce((sum: any, l: any) => sum + l.debit, 0);
        const totalCredit = params.lines.reduce((sum: any, l: any) => sum + l.credit, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`القيد غير متوازن: مدين ${totalDebit} ≠ دائن ${totalCredit}`);
        }

        // Resolve account IDs
        const resolvedLines: Array<{ accountId: number; costCenterId?: number; debit: number; credit: number; foreignDebit: number; foreignCredit: number; description?: string; profitCenterId?: number; projectId?: number; segmentId?: number; productId?: number; customerId?: number; vendorId?: number; employeeId?: number; assetId?: number; bookId?: number; fxRate?: number; quantity?: number; uom?: string }> = [];
        for (const line of params.lines) {
            if (line.debit === 0 && line.credit === 0 && (line.foreignDebit || 0) === 0 && (line.foreignCredit || 0) === 0) continue; // skip zero lines
            const accountId = await getAccountId(line.accountCode, tx);
            if (!accountId) {
                throw new Error(`حساب غير موجود: ${line.accountCode}`);
            }
            resolvedLines.push({
                accountId,
                costCenterId: line.costCenterId,
                debit: line.debit,
                credit: line.credit,
                foreignDebit: line.foreignDebit || line.debit,
                foreignCredit: line.foreignCredit || line.credit,
                description: line.description,
                // Universal Journal Dimensions
                profitCenterId: line.profitCenterId,
                projectId: line.projectId,
                segmentId: line.segmentId,
                productId: line.productId,
                customerId: line.customerId,
                vendorId: line.vendorId,
                employeeId: line.employeeId,
                assetId: line.assetId,
                bookId: line.bookId,
                fxRate: line.fxRate,
                quantity: line.quantity,
                uom: line.uom,
            });
        }

        const entryNumber = await getNextEntryNumber(tx);
        const entryDate = params.date || new Date().toISOString().split('T')[0];

        // Ensure Fiscal Period is OPEN
        const [year, month] = entryDate.split('-').map(Number);
        if (year && month) {
            const period = await tx.fiscalPeriod.findUnique({
                where: { year_month: { year, month } }
            });
            if (period && period.status !== 'open') {
                throw new Error(`الفترة المالية (${month}/${year}) مغلقة أو مقفلة، لا يمكن إضافة قيود جديدة.`);
            }
        }

        // [EG-03 FIX] Create entry + lines + update balances ALL inside a single transaction
        // This prevents inconsistency if the process crashes between JE creation and balance update.
        
            const finalStatus = params.status || 'posted';
            
            const je = await tx.journalEntry.create({
                data: {
                    entryNumber,
                    entryDate,
                    description: params.description,
                    reference: params.reference,
                    totalDebit: Math.round(totalDebit * 100) / 100,
                    totalCredit: Math.round(totalCredit * 100) / 100,
                    status: finalStatus,
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
                            // Universal Journal Dimensions (pass-through, all nullable)
                            profitCenterId: l.profitCenterId || null,
                            projectId: l.projectId || null,
                            segmentId: l.segmentId || null,
                            productId: l.productId || null,
                            customerId: l.customerId || null,
                            vendorId: l.vendorId || null,
                            employeeId: l.employeeId || null,
                            assetId: l.assetId || null,
                            bookId: l.bookId || null,
                            fxRate: l.fxRate || null,
                            quantity: l.quantity || null,
                            uom: l.uom || null,
                        })),
                    },
                },
            });

            // [EG-03 FIX] Update account balances INSIDE the same transaction ONLY IF POSTED
            // Using Math.round to mitigate Float precision drift
            if (finalStatus === 'posted') {
                for (const line of resolvedLines) {
                    const account = await tx.account.findUnique({ where: { id: line.accountId } });
                    if (account) {
                        let balanceChange = 0;
                        // Assets & Expenses: debit increases, credit decreases
                        // Liabilities, Equity & Revenue: credit increases, debit decreases
                        if (['asset', 'expense'].includes(account.type)) {
                            balanceChange = line.debit - line.credit;
                        } else {
                            balanceChange = line.credit - line.debit;
                        }
                        await tx.account.update({
                            where: { id: line.accountId },
                            data: { balance: { increment: Math.round(balanceChange * 100) / 100 } },
                        });
                    }
                }
            }

            return je;
        };

        const entry = params.txClient 
            ? await executeLogic(params.txClient) 
            : await prisma.$transaction(executeLogic);

        return { success: true, entryId: entry.id };
    } catch (error: any) {
        log.error('Auto-journal error:', error);
        return { success: false, error: String(error.message || error) };
    }
    });
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
    txClient?: any;
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
        txClient: invoice.txClient,
    });
}

/**
 * قيد شراء
 * ─────────────────────────────────────────────────────
 * [EG-02 FIX] 3-Way Match Logic:
 *   If GRN exists (hasGRN=true):   Dr GRNI (clearing) / Cr AP
 *   If no GRN (direct purchase):    Dr Inventory / Cr Cash|Bank|AP
 * ─────────────────────────────────────────────────────
 * مدين: GRNI (لو استلام سابق) أو المخزون (مشتريات مباشرة)
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
    ppvAmount?: number; // Purchase Price Variance
    hasGRN?: boolean; // [EG-02] true = GRN exists, clear GRNI; false = direct to Inventory
    txClient?: any;
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

    const ppv = invoice.ppvAmount || 0;
    const inventoryBase = invoice.subtotal - ppv;

    // [EG-03 FIX] Phase 1.5.2B: Purchase invoices ALWAYS debit GRNI.
    // This enforces the 3-Way Match standard:
    // 1. Invoice: Dr GRNI / Cr AP
    // 2. Receipt (GRN): Dr INVENTORY / Cr GRNI
    const debitAccount = ACCOUNTS.GRNI;
    const debitDescription = `استحقاق المورد (GRNI) - فاتورة مشتريات #${invoice.invoiceNo} ${totalLandedCost > 0 ? '(متضمنة تكاليف الاستيراد)' : ''} ${ppv !== 0 ? '(بالسعر المعياري)' : ''}`;

    lines.push({
        accountCode: debitAccount,
        debit: inventoryBase + totalLandedCost,
        credit: 0,
        description: debitDescription,
    });

    // Debit/Credit: PPV (Purchase Price Variance)
    if (Math.abs(ppv) > 0.01) {
        lines.push({
            accountCode: ACCOUNTS.PPV,
            debit: ppv > 0 ? ppv : 0,           // Unfavorable (Paid more)
            credit: ppv < 0 ? Math.abs(ppv) : 0, // Favorable (Paid less)
            description: ppv > 0 ? `انحراف أسعار غير ملائم - فاتورة #${invoice.invoiceNo}` : `انحراف أسعار ملائم (توفير) - فاتورة #${invoice.invoiceNo}`,
        });
    }

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
        description: `فاتورة شراء #${invoice.invoiceNo}${invoice.hasGRN ? ' (3-way match)' : ''}`,
        reference: `PUR-${invoice.invoiceNo}`,
        lines,
        userId: invoice.userId,
        branchId: invoice.branchId,
        date: invoice.date,
        txClient: invoice.txClient,
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
    txClient?: any;
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
        txClient: ret.txClient,
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
    txClient?: any;
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
        txClient: ret.txClient,
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
    txClient?: any;
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
        description: `تسوية أرصدة مستودع (الجرد)`,
        reference: `ADJ-${Date.now()}`,
        lines,
        userId: adj.userId,
        branchId: adj.branchId,
        date: adj.date,
        txClient: adj.txClient,
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
    txClient?: any;
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
        txClient: grn.txClient,
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

// ============ Payroll & HR Auto-Journals ============

/**
 * قيد استحقاق الرواتب (Wage Payroll Accrual)
 * DR  Wage Expense (Gross)
 * CR  Wages Payable (Net)
 * CR  GOSI Payable (Employee share)
 * CR  Loan Deduction / Other
 */
export async function postWagePayrollAccrual(params: {
    payrollId: string;
    grossAmount: number;
    netAmount: number;
    gosiEmployeeShare: number;
    loanDeductions?: number;
    whtDeductions?: number;
    otherDeductions?: number;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    const lines = [];

    // DR: Gross Salary Expense
    lines.push({ accountCode: ACCOUNTS.SALARIES, debit: params.grossAmount, credit: 0, description: `استحقاق الرواتب - مسير #${params.payrollId}` });

    // CR: Net Payable
    lines.push({ accountCode: ACCOUNTS.WAGES_PAYABLE, debit: 0, credit: params.netAmount, description: `صافي الرواتب المستحقة - مسير #${params.payrollId}` });

    // CR: GOSI Payable (Employee Share)
    if (params.gosiEmployeeShare > 0) {
        lines.push({ accountCode: ACCOUNTS.GOSI_PAYABLE, debit: 0, credit: params.gosiEmployeeShare, description: `استقطاع التأمينات (حصة الموظف) - مسير #${params.payrollId}` });
    }

    // CR: Loans Deducted
    if (params.loanDeductions && params.loanDeductions > 0) {
        lines.push({ accountCode: ACCOUNTS.LOAN_DEDUCTION, debit: 0, credit: params.loanDeductions, description: `استقطاع سلف الموظفين - مسير #${params.payrollId}` });
    }

    // CR: WHT
    if (params.whtDeductions && params.whtDeductions > 0) {
        lines.push({ accountCode: ACCOUNTS.WHT_PAYABLE, debit: 0, credit: params.whtDeductions, description: `استقطاع ضريبة - مسير #${params.payrollId}` });
    }

    return createJournalEntry({
        description: `قيد استحقاق رواتب مسير #${params.payrollId}`,
        reference: `PAY-${params.payrollId}`,
        lines,
        userId: params.userId,
        branchId: params.branchId,
        date: params.date,
    });
}

/**
 * قيد استحقاق التأمينات (حصة الشركة) - Employer GOSI Accrual
 * DR  Employer GOSI Expense
 * CR  GOSI Payable
 */
export async function postEmployerGOSIAccrual(params: {
    payrollId: string;
    employerGosiAmount: number;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    return createJournalEntry({
        description: `استحقاق التأمينات الاجتماعية (حصة الشركة) - مسير #${params.payrollId}`,
        reference: `GOSI-${params.payrollId}`,
        lines: [
            { accountCode: ACCOUNTS.EMPLOYER_GOSI_EXP, debit: params.employerGosiAmount, credit: 0, description: `مصروف التأمينات (حصة الشركة)` },
            { accountCode: ACCOUNTS.GOSI_PAYABLE, debit: 0, credit: params.employerGosiAmount, description: `تأمينات مستحقة الدفع` },
        ],
        userId: params.userId,
        branchId: params.branchId,
        date: params.date,
    });
}

/**
 * قيد دفع الرواتب عبر نظام حماية الأجور (WPS)
 * DR  Wages Payable
 * CR  Bank
 */
export async function postWpsPayment(params: {
    paymentId: string;
    totalPaid: number;
    bankAccountCode?: string; // Default to standard BANK
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    return createJournalEntry({
        description: `صرف رواتب عبر حماية الأجور (WPS) - ملف #${params.paymentId}`,
        reference: `WPS-${params.paymentId}`,
        lines: [
            { accountCode: ACCOUNTS.WAGES_PAYABLE, debit: params.totalPaid, credit: 0, description: `تسديد رواتب مستحقة` },
            { accountCode: params.bankAccountCode || ACCOUNTS.BANK, debit: 0, credit: params.totalPaid, description: `تحويل بنكي WPS` },
        ],
        userId: params.userId,
        branchId: params.branchId,
        date: params.date,
    });
}

/**
 * قيد مخصص مكافأة نهاية الخدمة (EOS Accrual)
 * DR  EOS Expense
 * CR  EOS Liability
 */
export async function postEOSAccrual(params: {
    period: string; // e.g. "2026-05"
    accrualAmount: number;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    return createJournalEntry({
        description: `تكوين مخصص نهاية الخدمة لشهر ${params.period}`,
        reference: `EOS-${params.period}`,
        lines: [
            { accountCode: ACCOUNTS.EOS_EXPENSE, debit: params.accrualAmount, credit: 0, description: `مصروف نهاية الخدمة المكون` },
            { accountCode: ACCOUNTS.EOS_LIABILITY, debit: 0, credit: params.accrualAmount, description: `مخصص نهاية الخدمة` },
        ],
        userId: params.userId,
        branchId: params.branchId,
        date: params.date,
    });
}

// ============ Universal Journal Dimension Helpers ============

/** Dimension fields type for convenience */
export type JournalDimensions = {
    profitCenterId?: number;
    projectId?: number;
    segmentId?: number;
    productId?: number;
    customerId?: number;
    vendorId?: number;
    employeeId?: number;
    assetId?: number;
    bookId?: number;
    fxRate?: number;
    quantity?: number;
    uom?: string;
};

/**
 * inheritDimensions — copies dimension fields from a source document to JE lines.
 * Use when auto-posting from invoices, POs, GRNs etc.
 * Priority: line-level override > header-level default.
 */
export function inheritDimensions(
    headerDims: Partial<JournalDimensions>,
    lineDims?: Partial<JournalDimensions>
): JournalDimensions {
    return {
        profitCenterId: lineDims?.profitCenterId ?? headerDims.profitCenterId,
        projectId: lineDims?.projectId ?? headerDims.projectId,
        segmentId: lineDims?.segmentId ?? headerDims.segmentId,
        productId: lineDims?.productId ?? headerDims.productId,
        customerId: lineDims?.customerId ?? headerDims.customerId,
        vendorId: lineDims?.vendorId ?? headerDims.vendorId,
        employeeId: lineDims?.employeeId ?? headerDims.employeeId,
        assetId: lineDims?.assetId ?? headerDims.assetId,
        bookId: lineDims?.bookId ?? headerDims.bookId,
        fxRate: lineDims?.fxRate ?? headerDims.fxRate,
        quantity: lineDims?.quantity ?? headerDims.quantity,
        uom: lineDims?.uom ?? headerDims.uom,
    };
}

/**
 * validateDimensionRules — validates that mandatory dimensions are present for a given account.
 * Returns { valid: true } or { valid: false, missing: string[] }.
 * In future, Account model can have a `requiredDimensions` JSON field.
 * For now, enforces basic rules:
 *   - Revenue accounts (4xxx) require customerId
 *   - COGS/Expense accounts (5xxx) require costCenterId or profitCenterId
 */
export function validateDimensionRules(
    accountCode: string,
    dims: Partial<JournalDimensions>,
    costCenterId?: number
): { valid: boolean; missing?: string[] } {
    const missing: string[] = [];

    // Revenue accounts should have customer context
    if (accountCode.startsWith('4') && !dims.customerId) {
        // Warning only — not enforced yet (soft validation)
        // missing.push('customerId');
    }

    // Expense accounts benefit from cost center or profit center
    if (accountCode.startsWith('5') && !costCenterId && !dims.profitCenterId) {
        // Warning only — not enforced yet (soft validation)
        // missing.push('costCenterId or profitCenterId');
    }

    return missing.length > 0 ? { valid: false, missing } : { valid: true };
}

// ============ Fixed Assets & Period-End Auto-Journals ============

/**
 * قيد الاستحواذ على أصل ثابت (Asset Acquisition)
 * DR  Fixed Asset
 * DR  VAT Input (if recoverable)
 * CR  Bank/AP
 */
export async function postAssetAcquisition(params: {
    assetId: string;
    assetName: string;
    cost: number;
    vatAmount: number;
    paymentType: 'cash' | 'bank' | 'credit';
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    const lines = [];

    // DR: Fixed Asset Cost
    lines.push({ accountCode: ACCOUNTS.FIXED_ASSET, debit: params.cost, credit: 0, description: `شراء أصل ثابت: ${params.assetName} #${params.assetId}` });

    // DR: VAT Input
    if (params.vatAmount > 0) {
        lines.push({ accountCode: ACCOUNTS.VAT_INPUT, debit: params.vatAmount, credit: 0, description: `ضريبة قيمة مضافة - أصل #${params.assetId}` });
    }

    // CR: Payment
    const total = params.cost + params.vatAmount;
    const payAccount = params.paymentType === 'cash' ? ACCOUNTS.CASH : params.paymentType === 'bank' ? ACCOUNTS.BANK : ACCOUNTS.PAYABLES;
    lines.push({ accountCode: payAccount, debit: 0, credit: total, description: `سداد قيمة أصل #${params.assetId}` });

    return createJournalEntry({
        description: `استحواذ على أصل ثابت: ${params.assetName}`,
        reference: `FA-ACQ-${params.assetId}`,
        lines,
        userId: params.userId,
        branchId: params.branchId,
        date: params.date,
    });
}

/**
 * قيد الإهلاك الشهري للأصول (Monthly Depreciation)
 * DR  Depreciation Expense
 * CR  Accumulated Depreciation
 */
export async function postMonthlyDepreciation(params: {
    period: string; // e.g. "2026-05"
    assetId: string;
    depreciationAmount: number;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    return createJournalEntry({
        description: `إهلاك الأصل #${params.assetId} لشهر ${params.period}`,
        reference: `FA-DEP-${params.assetId}-${params.period}`,
        lines: [
            { accountCode: ACCOUNTS.DEPRECIATION_EXP, debit: params.depreciationAmount, credit: 0, description: `مصروف إهلاك للأصل #${params.assetId}` },
            { accountCode: ACCOUNTS.ACCUM_DEPRECIATION, debit: 0, credit: params.depreciationAmount, description: `مجمع إهلاك للأصل #${params.assetId}` },
        ],
        userId: params.userId,
        branchId: params.branchId,
        date: params.date,
    });
}

/**
 * قيد استبعاد/بيع أصل ثابت (Asset Disposal Gain/Loss)
 * DR  Bank (Proceeds)
 * DR  Accumulated Depreciation
 * DR  Disposal Loss (if any)
 * CR  Fixed Asset (Original Cost)
 * CR  Disposal Gain (if any)
 */
export async function postAssetDisposal(params: {
    assetId: string;
    originalCost: number;
    accumulatedDepreciation: number;
    saleProceeds: number;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    const netBookValue = params.originalCost - params.accumulatedDepreciation;
    const diff = params.saleProceeds - netBookValue; // Positive = Gain, Negative = Loss
    
    const lines = [];

    // DR: Proceeds
    if (params.saleProceeds > 0) {
        lines.push({ accountCode: ACCOUNTS.BANK, debit: params.saleProceeds, credit: 0, description: `متحصلات بيع الأصل #${params.assetId}` });
    }

    // DR: Accum. Depreciation
    lines.push({ accountCode: ACCOUNTS.ACCUM_DEPRECIATION, debit: params.accumulatedDepreciation, credit: 0, description: `إقفال مجمع إهلاك الأصل #${params.assetId}` });

    // CR: Original Cost
    lines.push({ accountCode: ACCOUNTS.FIXED_ASSET, debit: 0, credit: params.originalCost, description: `إقفال تكلفة الأصل #${params.assetId}` });

    // Gain / Loss recognition
    if (diff > 0) {
        // Gain
        lines.push({ accountCode: ACCOUNTS.DISPOSAL_GAIN, debit: 0, credit: diff, description: `أرباح رأسمالية من استبعاد الأصل #${params.assetId}` });
    } else if (diff < 0) {
        // Loss (diff is negative, make it positive for debit)
        lines.push({ accountCode: ACCOUNTS.DISPOSAL_LOSS, debit: Math.abs(diff), credit: 0, description: `خسائر رأسمالية من استبعاد الأصل #${params.assetId}` });
    }

    return createJournalEntry({
        description: `استبعاد/بيع أصل ثابت #${params.assetId}`,
        reference: `FA-DISP-${params.assetId}`,
        lines,
        userId: params.userId,
        branchId: params.branchId,
        date: params.date,
    });
}

/**
 * قيد المصروف المستحق (Accrual Entry)
 * DR  Expense
 * CR  Accrued Liability
 */
export async function postAccrualEntry(params: {
    expenseAccountCode: string; // e.g. SALARIES or ELECTRICITY
    amount: number;
    description: string;
    reference: string;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    return createJournalEntry({
        description: `إثبات مصروف مستحق: ${params.description}`,
        reference: `ACC-${params.reference}`,
        lines: [
            { accountCode: params.expenseAccountCode, debit: params.amount, credit: 0, description: `مصروف: ${params.description}` },
            { accountCode: ACCOUNTS.ACCRUED_EXPENSE, debit: 0, credit: params.amount, description: `إثبات مستحق: ${params.description}` },
        ],
        userId: params.userId,
        branchId: params.branchId,
        date: params.date,
    });
}

/**
 * قيد المصروف المدفوع مقدماً (Deferral Entry)
 * DR  Prepaid Expense
 * CR  Bank/Cash
 */
export async function postDeferralEntry(params: {
    amount: number;
    description: string;
    reference: string;
    paymentType: 'cash' | 'bank';
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    const payAccount = params.paymentType === 'cash' ? ACCOUNTS.CASH : ACCOUNTS.BANK;
    return createJournalEntry({
        description: `إثبات مصروف مدفوع مقدماً: ${params.description}`,
        reference: `DEF-${params.reference}`,
        lines: [
            { accountCode: ACCOUNTS.PREPAID_EXPENSE, debit: params.amount, credit: 0, description: `مصروف مقدم: ${params.description}` },
            { accountCode: payAccount, debit: 0, credit: params.amount, description: `سداد مصروف مقدم: ${params.description}` },
        ],
        userId: params.userId,
        branchId: params.branchId,
        date: params.date,
    });
}


// ============ Advanced Revenue, Installments & FX Auto-Journals ============

/**
 * قيد فوترة تقسيط (Installment Billing)
 * DR  AR (Long-term)
 * CR  Deferred Revenue
 * CR  Deferred Interest Income
 */
export async function postInstallmentBilling(params: {
    contractId: string;
    totalAmount: number; // Principal + Interest
    principal: number;
    interest: number;
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    const AR_LONG_TERM = '1210';
    const DEFERRED_REVENUE = '2400';
    const DEFERRED_INTEREST = '2410';

    return createJournalEntry({
        description: `إثبات عقد تقسيط #${params.contractId}`,
        reference: `INST-${params.contractId}`,
        lines: [
            { accountCode: AR_LONG_TERM, debit: params.totalAmount, credit: 0, description: `إجمالي مستحقات تقسيط - عقد #${params.contractId}` },
            { accountCode: DEFERRED_REVENUE, debit: 0, credit: params.principal, description: `إيرادات مؤجلة (أصل المبلغ)` },
            { accountCode: DEFERRED_INTEREST, debit: 0, credit: params.interest, description: `فوائد تقسيط مؤجلة` },
        ],
        userId: params.userId,
        branchId: params.branchId,
        date: params.date,
    });
}

/**
 * قيد تحصيل قسط وإثبات الإيراد (Installment Receive & Recognize)
 * DR  Bank
 * CR  AR (Long-term)
 * DR  Deferred Revenue & Deferred Interest
 * CR  Revenue & Interest Income
 */
export async function postInstallmentReceive(params: {
    contractId: string;
    installmentAmount: number;
    principalRecognized: number;
    interestRecognized: number;
    paymentType: 'cash' | 'bank';
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    const AR_LONG_TERM = '1210';
    const DEFERRED_REVENUE = '2400';
    const DEFERRED_INTEREST = '2410';
    const INTEREST_INCOME = '4400';
    const payAccount = params.paymentType === 'cash' ? ACCOUNTS.CASH : ACCOUNTS.BANK;

    const lines = [
        // 1. Receipt
        { accountCode: payAccount, debit: params.installmentAmount, credit: 0, description: `تحصيل قسط - عقد #${params.contractId}` },
        { accountCode: AR_LONG_TERM, debit: 0, credit: params.installmentAmount, description: `تخفيض مستحقات التقسيط` },
        // 2. Recognition - Principal
        { accountCode: DEFERRED_REVENUE, debit: params.principalRecognized, credit: 0, description: `استنفاد إيراد مؤجل (أصل)` },
        { accountCode: ACCOUNTS.SALES, debit: 0, credit: params.principalRecognized, description: `إثبات إيراد مبيعات محقق` },
    ];

    if (params.interestRecognized > 0) {
        lines.push({ accountCode: DEFERRED_INTEREST, debit: params.interestRecognized, credit: 0, description: `استنفاد فوائد مؤجلة` });
        lines.push({ accountCode: INTEREST_INCOME, debit: 0, credit: params.interestRecognized, description: `إثبات إيراد فوائد تقسيط` });
    }

    return createJournalEntry({
        description: `تحصيل قسط وإثبات الإيراد - عقد #${params.contractId}`,
        reference: `INST-REC-${params.contractId}-${Date.now()}`,
        lines,
        userId: params.userId,
        branchId: params.branchId,
        date: params.date,
    });
}

/**
 * قيد بيع بطاقة هدايا (Gift Card Sold)
 * DR  Cash/Bank
 * CR  Gift Card Liability
 */
export async function postGiftCardSold(params: {
    cardId: string;
    amount: number;
    paymentType: 'cash' | 'bank';
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    const GIFT_CARD_LIABILITY = '2500';
    const payAccount = params.paymentType === 'cash' ? ACCOUNTS.CASH : ACCOUNTS.BANK;

    return createJournalEntry({
        description: `بيع بطاقة هدايا #${params.cardId}`,
        reference: `GC-${params.cardId}`,
        lines: [
            { accountCode: payAccount, debit: params.amount, credit: 0, description: `تحصيل قيمة بطاقة هدايا` },
            { accountCode: GIFT_CARD_LIABILITY, debit: 0, credit: params.amount, description: `التزام بطاقات هدايا غير مستخدمة` },
        ],
        userId: params.userId,
        branchId: params.branchId,
        date: params.date,
    });
}

/**
 * قيد تقييم العملات الأجنبية (FX Revaluation - Unrealized)
 * DR/CR Unrealized FX Gain/Loss
 * DR/CR AR/AP Foreign
 */
export async function postFXRevaluation(params: {
    period: string;
    accountCode: string; // e.g. AP or AR
    baseCurrencyDiff: number; // Positive = gain, Negative = loss
    isAsset: boolean; // AR is asset, AP is liability
    userId?: number;
    branchId?: number | null;
    date?: string;
}) {
    const FX_GAIN = '4500'; // Unrealized Gain
    const FX_LOSS = '5920'; // Unrealized Loss

    const lines = [];
    const absDiff = Math.abs(params.baseCurrencyDiff);

    if (params.baseCurrencyDiff > 0) {
        // Gain: Increase Asset or Decrease Liability
        if (params.isAsset) {
            lines.push({ accountCode: params.accountCode, debit: absDiff, credit: 0, description: `تقييم عملات (زيادة أصل)` });
        } else {
            lines.push({ accountCode: params.accountCode, debit: absDiff, credit: 0, description: `تقييم عملات (نقص التزام)` });
        }
        lines.push({ accountCode: FX_GAIN, debit: 0, credit: absDiff, description: `أرباح تقييم عملات غير محققة` });
    } else {
        // Loss: Decrease Asset or Increase Liability
        lines.push({ accountCode: FX_LOSS, debit: absDiff, credit: 0, description: `خسائر تقييم عملات غير محققة` });
        if (params.isAsset) {
            lines.push({ accountCode: params.accountCode, debit: 0, credit: absDiff, description: `تقييم عملات (نقص أصل)` });
        } else {
            lines.push({ accountCode: params.accountCode, debit: 0, credit: absDiff, description: `تقييم عملات (زيادة التزام)` });
        }
    }

    return createJournalEntry({
        description: `تقييم العملات الأجنبية نهاية الفترة ${params.period}`,
        reference: `FX-REV-${params.period}`,
        lines,
        userId: params.userId,
        branchId: params.branchId,
        date: params.date,
    });
}

/**
 * قيد تسديد دفعة جزئية لمورد
 * DR: Accounts Payable
 * CR: Cash or Bank
 */
export async function postPurchasePayment(params: {
    invoiceNo: string | number;
    amount: number;
    paymentType: 'cash' | 'bank';
    treasuryId: number;
    userId?: number | null;
    branchId?: number | null;
    date?: string;
    txClient?: any;
}) {
    const payAccount = params.paymentType === 'bank' ? ACCOUNTS.BANK : ACCOUNTS.CASH;

    const result = await createJournalEntry({
        description: `تسديد دفعة فاتورة مشتريات #${params.invoiceNo}`,
        reference: `PUR-PAY-${params.invoiceNo}-${params.treasuryId}`,
        lines: [
            { accountCode: ACCOUNTS.PAYABLES, debit: params.amount, credit: 0, description: `نقص التزام المورد - فاتورة #${params.invoiceNo}` },
            { accountCode: payAccount, debit: 0, credit: params.amount, description: `تسديد دفعة شراء #${params.invoiceNo}` },
        ],
        userId: params.userId || undefined,
        branchId: params.branchId,
        date: params.date,
        txClient: params.txClient,
    });

    if (result && (result as any).success === false) {
        throw new Error(`فشل إنشاء القيد المحاسبي لدفعة المشتريات: ${(result as any).error}`);
    }

    return result;
}

/**
 * قيد تحصيل دفعة جزئية من عميل
 * DR: Cash or Bank
 * CR: Accounts Receivable
 */
export async function postSalesPayment(params: {
    invoiceNo: string | number;
    amount: number;
    paymentType: 'cash' | 'bank';
    treasuryId: number;
    userId?: number | null;
    branchId?: number | null;
    date?: string;
    txClient?: any;
}) {
    const payAccount = params.paymentType === 'bank' ? ACCOUNTS.BANK : ACCOUNTS.CASH;

    const result = await createJournalEntry({
        description: `تحصيل دفعة فاتورة مبيعات #${params.invoiceNo}`,
        reference: `SAL-PAY-${params.invoiceNo}-${params.treasuryId}`,
        lines: [
            { accountCode: payAccount, debit: params.amount, credit: 0, description: `تحصيل دفعة بيع #${params.invoiceNo}` },
            { accountCode: ACCOUNTS.RECEIVABLES, debit: 0, credit: params.amount, description: `نقص مستحقات العميل - فاتورة #${params.invoiceNo}` },
        ],
        userId: params.userId || undefined,
        branchId: params.branchId,
        date: params.date,
        txClient: params.txClient,
    });

    if (result && (result as any).success === false) {
        throw new Error(`فشل إنشاء القيد المحاسبي لدفعة المبيعات: ${(result as any).error}`);
    }

    return result;
}

/**
 * Reverse a journal entry by its reference.
 * Generates a contra-entry (Reversal Journal) maintaining GL atomicity.
 * Idempotent: Skips if the reversal journal already exists.
 */
export async function reverseJournalByReference(params: {
    originalReference: string;
    userId?: number | null;
    branchId?: number | null;
    date?: string;
    txClient: any;
}) {
    const { originalReference, userId, branchId, date, txClient } = params;

    // 1. Fetch Original Journal Entries
    const originalEntries = await txClient.journalEntry.findMany({
        where: { reference: originalReference },
        include: { lines: true }
    });

    if (!originalEntries || originalEntries.length === 0) {
        log.info(`No journal entries found for reference ${originalReference} to reverse.`);
        return { success: true, message: 'No entries to reverse' };
    }

    const reversedEntryIds: number[] = [];

    // 2. Create Contra-Entries for each original entry
    for (const originalEntry of originalEntries) {
        // Idempotency Check per entry
        const reversalReference = `REV-${originalEntry.id}-${originalReference}`;
        
        const existingReversal = await txClient.journalEntry.findFirst({
            where: { reference: reversalReference }
        });

        if (existingReversal) {
            log.info(`Reversal journal already exists for entry ${originalEntry.id}, skipping.`);
            reversedEntryIds.push(existingReversal.id);
            continue;
        }

        // Prepare reversal lines (flip debit and credit)
        const reversalLines = [];
        
        for (const line of originalEntry.lines) {
            const account = await txClient.account.findUnique({ where: { id: line.accountId } });
            if (!account) {
                throw new Error(`Account ID ${line.accountId} not found for reversal.`);
            }

            reversalLines.push({
                accountCode: account.code,
                debit: line.credit, // Debit becomes Credit
                credit: line.debit, // Credit becomes Debit
                foreignDebit: line.foreignCredit || line.credit,
                foreignCredit: line.foreignDebit || line.debit,
                description: `عكس قيد: ${line.description || originalEntry.description}`,
                costCenterId: line.costCenterId,
                profitCenterId: line.profitCenterId,
                projectId: line.projectId,
                segmentId: line.segmentId,
                productId: line.productId,
                customerId: line.customerId,
                vendorId: line.vendorId,
                employeeId: line.employeeId,
                assetId: line.assetId,
                bookId: line.bookId,
                fxRate: line.fxRate,
                quantity: line.quantity ? -line.quantity : undefined, // Reverse quantity if exists
                uom: line.uom,
            });
        }

        const result = await createJournalEntry({
            description: `عكس رياضي للقيد #${originalEntry.entryNumber}`,
            reference: reversalReference,
            lines: reversalLines,
            userId: userId || undefined,
            branchId: branchId || undefined,
            date: date || new Date().toISOString().split('T')[0],
            txClient: txClient,
        });

        if (result && (result as any).success === false) {
            throw new Error(`فشل إنشاء القيد العكسي للمرجع ${originalReference}: ${(result as any).error}`);
        }

        if (result.entryId) {
            reversedEntryIds.push(result.entryId);
        }
    }

    return { success: true, reversedEntryIds };
}
