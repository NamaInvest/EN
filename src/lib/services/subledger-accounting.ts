/**
 * Subledger Accounting (SLA) Engine
 * centralizes, decouples, and standardizes accounting rules across subledgers.
 * Compliant with SOCPA, IFRS, and Saudi ZATCA guidelines.
 */

import { prisma, resolveTenant, withTenant } from '../prisma';
import { traceFinancialOperation } from '@/lib/observability/financial-trace';
import { FinancialTxClient } from '@/lib/db/transaction';
import { AccountingJournalService, CreateJournalEntryDTO } from './accounting-journal.service';

export const ACCOUNTS_SLA = {
    CASH: '1110',           // الصندوق
    BANK: '1120',           // البنك
    RECEIVABLES: '1200',    // العملاء (AR)
    INVENTORY: '1300',      // المخزون (Raw Material)
    IN_TRANSIT: '1310',     // بضاعة بالطريق
    FINISHED_GOODS: '1340', // مخزون البضاعة التامة
    VAT_INPUT: '1400',      // ضريبة مدخلات (Input VAT)
    PAYABLES: '2100',       // الموردين (AP)
    GRNI: '2110',           // استلام بدون فاتورة (Accrued AP / GRNI)
    VAT_OUTPUT: '2300',     // ضريبة مخرجات (Output VAT)
    SALES: '4100',          // المبيعات
    SALES_RETURNS: '4110',  // مرتجعات مبيعات
    SALES_DISCOUNT: '4120', // خصومات مسموحة
    COGS: '5100',           // تكلفة البضاعة المباعة
    PPV: '5140',            // انحراف أسعار المشتريات (Purchase Price Variance)
};

export type SLAPurchaseInvoiceDTO = {
    invoiceNo: number;
    subtotal: number;
    taxValue: number;
    total: number;
    paymentType: string; // 'cash' | 'bank' | 'credit'
    userId?: number;
    branchId?: number | null;
    date?: string;
    landedCosts?: Array<{ accountCode: string; amountValue: number; description: string }>;
    ppvAmount?: number;
    hasGRN?: boolean;
    txClient?: FinancialTxClient | null;
    overrideContext?: unknown;
    // Dimensions
    vendorId?: number;
    productId?: number;
    quantity?: number;
    uom?: string;
    projectId?: number;
    costCenterId?: number;
    profitCenterId?: number;
    segmentId?: number;
};

export type SLASalesInvoiceDTO = {
    invoiceNo: number;
    subtotal: number;
    taxValue: number;
    total: number;
    paymentType: string; // 'cash' | 'bank' | 'credit' | 'split'
    splitCash?: number;
    splitCard?: number;
    userId?: number;
    branchId?: number | null;
    date?: string;
    discountValue?: number;
    totalCost?: number;
    txClient?: FinancialTxClient | null;
    overrideContext?: unknown;
    // Dimensions
    customerId?: number;
    productId?: number;
    quantity?: number;
    uom?: string;
    projectId?: number;
    costCenterId?: number;
    profitCenterId?: number;
    segmentId?: number;
};

export class SubledgerAccountingService {
    /**
     * Translates a Purchase Invoice business event into double-entry accounting lines
     * and posts them directly inside the unified transactional ledger.
     */
    static async postPurchaseInvoice(invoice: SLAPurchaseInvoiceDTO) {
        const activeTenant = resolveTenant();

        return withTenant(activeTenant, async () => {
            return traceFinancialOperation(
                {
                    operationType: 'POST_PURCHASE_INVOICE',
                    module: 'purchases',
                    aggregateId: `PUR-${invoice.invoiceNo}`,
                    overrideUsed: !!invoice.overrideContext,
                },
                async () => {
                    const lines: CreateJournalEntryDTO['lines'] = [];
                    const commonDims = {
                        projectId: invoice.projectId,
                        costCenterId: invoice.costCenterId,
                        profitCenterId: invoice.profitCenterId,
                        segmentId: invoice.segmentId,
                    };

                    // Determine payment/credit liability account (Standard Rules)
                    const payAccount = invoice.paymentType === 'cash' ? ACCOUNTS_SLA.CASH :
                                       invoice.paymentType === 'bank' ? ACCOUNTS_SLA.BANK :
                                       ACCOUNTS_SLA.PAYABLES;

                    // Calculate landed costs credits
                    let totalLandedCost = 0;
                    if (invoice.landedCosts && invoice.landedCosts.length > 0) {
                        for (const lc of invoice.landedCosts) {
                            totalLandedCost += lc.amountValue;
                            lines.push({
                                accountCode: lc.accountCode,
                                debit: 0,
                                credit: lc.amountValue,
                                description: `توزيع تكلفة: ${lc.description} لعملية شراء #${invoice.invoiceNo}`,
                                vendorId: invoice.vendorId,
                                ...commonDims,
                            });
                        }
                    }

                    const ppv = invoice.ppvAmount || 0;
                    const inventoryBase = invoice.subtotal - ppv;

                    // Purchase invoice ALWAYS debits GRNI clearing account
                    lines.push({
                        accountCode: ACCOUNTS_SLA.GRNI,
                        debit: inventoryBase + totalLandedCost,
                        credit: 0,
                        description: `استحقاق المورد (GRNI) - فاتورة مشتريات #${invoice.invoiceNo}${totalLandedCost > 0 ? ' (شاملة مصاريف شحن/customs)' : ''}${ppv !== 0 ? ' (انحراف معياري)' : ''}`,
                        vendorId: invoice.vendorId,
                        productId: invoice.productId,
                        quantity: invoice.quantity,
                        uom: invoice.uom,
                        ...commonDims,
                    });

                    // Handle PPV (Purchase Price Variance)
                    if (Math.abs(ppv) > 0.01) {
                        lines.push({
                            accountCode: ACCOUNTS_SLA.PPV,
                            debit: ppv > 0 ? ppv : 0,           // Unfavorable (paid more)
                            credit: ppv < 0 ? Math.abs(ppv) : 0, // Favorable (paid less)
                            description: ppv > 0 
                                ? `انحراف أسعار شراء غير ملائم - فاتورة #${invoice.invoiceNo}` 
                                : `انحراف أسعار شراء ملائم - فاتورة #${invoice.invoiceNo}`,
                            vendorId: invoice.vendorId,
                            ...commonDims,
                        });
                    }

                    // Handle input VAT
                    if (invoice.taxValue > 0) {
                        lines.push({
                            accountCode: ACCOUNTS_SLA.VAT_INPUT,
                            debit: invoice.taxValue,
                            credit: 0,
                            description: `ضريبة مدخلات فاتورة شراء #${invoice.invoiceNo}`,
                            vendorId: invoice.vendorId,
                            ...commonDims,
                        });
                    }

                    // Credit: Cash/Bank/Accounts Payable
                    lines.push({
                        accountCode: payAccount,
                        debit: 0,
                        credit: invoice.total,
                        description: `قيد سداد فاتورة شراء #${invoice.invoiceNo}`,
                        vendorId: invoice.vendorId,
                        ...commonDims,
                    });

                    // Forward to central journal entry creator inside the same transaction
                    return AccountingJournalService.createEntry((invoice.txClient || prisma) as FinancialTxClient, {
                        description: `فاتورة شراء #${invoice.invoiceNo}${invoice.hasGRN ? ' (3-way match)' : ''}`,
                        reference: `PUR-${invoice.invoiceNo}`,
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                        lines: lines as any,
                        userId: invoice.userId,
                        branchId: invoice.branchId,
                        date: invoice.date,
                        overrideContext: invoice.overrideContext,
                        tenantId: activeTenant,
                        actor: invoice.userId ? String(invoice.userId) : 'SYSTEM',
                    });
                }
            );
        });
    }

    /**
     * Translates a Sales Invoice business event into double-entry accounting lines
     * and posts them directly inside the unified transactional ledger.
     */
    static async postSalesInvoice(invoice: SLASalesInvoiceDTO) {
        const activeTenant = resolveTenant();

        return withTenant(activeTenant, async () => {
            return traceFinancialOperation(
                {
                    operationType: 'POST_SALES_INVOICE',
                    module: 'sales',
                    aggregateId: `SALE-${invoice.invoiceNo}`,
                    overrideUsed: !!invoice.overrideContext,
                },
                async () => {
                    const lines: CreateJournalEntryDTO['lines'] = [];
                    const commonDims = {
                        projectId: invoice.projectId,
                        costCenterId: invoice.costCenterId,
                        profitCenterId: invoice.profitCenterId,
                        segmentId: invoice.segmentId,
                    };

                    // Handle payment splits or standard Accounts Receivable debit
                    if (invoice.paymentType === 'split') {
                        if (invoice.splitCash && invoice.splitCash > 0) {
                            lines.push({
                                accountCode: ACCOUNTS_SLA.CASH,
                                debit: invoice.splitCash,
                                credit: 0,
                                description: `تحصيل نقدية - فاتورة بيع #${invoice.invoiceNo}`,
                                customerId: invoice.customerId,
                                ...commonDims,
                            });
                        }
                        if (invoice.splitCard && invoice.splitCard > 0) {
                            lines.push({
                                accountCode: ACCOUNTS_SLA.BANK,
                                debit: invoice.splitCard,
                                credit: 0,
                                description: `تحصيل شبكة/مدى - فاتورة بيع #${invoice.invoiceNo}`,
                                customerId: invoice.customerId,
                                ...commonDims,
                            });
                        }
                    } else {
                        const debitAccount = invoice.paymentType === 'cash' ? ACCOUNTS_SLA.CASH :
                                             invoice.paymentType === 'bank' ? ACCOUNTS_SLA.BANK :
                                             ACCOUNTS_SLA.RECEIVABLES;
                        lines.push({
                            accountCode: debitAccount,
                            debit: invoice.total,
                            credit: 0,
                            description: `قيد سداد فاتورة بيع #${invoice.invoiceNo}`,
                            customerId: invoice.customerId,
                            ...commonDims,
                        });
                    }

                    // Credit: Sales (net of discounts)
                    const netSales = invoice.subtotal - (invoice.discountValue || 0);
                    lines.push({
                        accountCode: ACCOUNTS_SLA.SALES,
                        debit: 0,
                        credit: netSales,
                        description: `مبيعات فاتورة #${invoice.invoiceNo}`,
                        customerId: invoice.customerId,
                        productId: invoice.productId,
                        quantity: invoice.quantity,
                        uom: invoice.uom,
                        ...commonDims,
                    });

                    // Credit: Output VAT
                    if (invoice.taxValue > 0) {
                        lines.push({
                            accountCode: ACCOUNTS_SLA.VAT_OUTPUT,
                            debit: 0,
                            credit: invoice.taxValue,
                            description: `ضريبة مخرجات فاتورة بيع #${invoice.invoiceNo}`,
                            customerId: invoice.customerId,
                            ...commonDims,
                        });
                    }

                    // Debit: Sales Discount (if applicable)
                    if (invoice.discountValue && invoice.discountValue > 0) {
                        lines.push({
                            accountCode: ACCOUNTS_SLA.SALES_DISCOUNT,
                            debit: invoice.discountValue,
                            credit: 0,
                            description: `خصم مسموح به فاتورة بيع #${invoice.invoiceNo}`,
                            customerId: invoice.customerId,
                            ...commonDims,
                        });
                    }

                    // Perpetual Inventory cost of goods sold matching
                    if (invoice.totalCost && invoice.totalCost > 0) {
                        // Debit COGS
                        lines.push({
                            accountCode: ACCOUNTS_SLA.COGS,
                            debit: invoice.totalCost,
                            credit: 0,
                            description: `تكلفة البضاعة المباعة - فاتورة #${invoice.invoiceNo}`,
                            productId: invoice.productId,
                            quantity: invoice.quantity,
                            uom: invoice.uom,
                            ...commonDims,
                        });
                        // Credit Inventory
                        lines.push({
                            accountCode: ACCOUNTS_SLA.INVENTORY,
                            debit: 0,
                            credit: invoice.totalCost,
                            description: `صرف مخزون مباع - فاتورة #${invoice.invoiceNo}`,
                            productId: invoice.productId,
                            quantity: invoice.quantity,
                            uom: invoice.uom,
                            ...commonDims,
                        });
                    }

                    // Forward to central journal entry creator inside the same transaction
                    return AccountingJournalService.createEntry((invoice.txClient || prisma) as FinancialTxClient, {
                        description: `فاتورة بيع #${invoice.invoiceNo}`,
                        reference: `SALE-${invoice.invoiceNo}`,
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                        lines: lines as any,
                        userId: invoice.userId,
                        branchId: invoice.branchId,
                        date: invoice.date,
                        overrideContext: invoice.overrideContext,
                        tenantId: activeTenant,
                        actor: invoice.userId ? String(invoice.userId) : 'SYSTEM',
                    });
                }
            );
        });
    }
}
