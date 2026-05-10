/**
 * WHT Engine — Withholding Tax (Build #11)
 * ═════════════════════════════════════════
 * 
 * حجب ضريبة استقطاع 5-20% للموردين الأجانب + توليد نموذج 14 الشهري لـ ZATCA.
 * 
 * Saudi WHT Rates:
 *   5% — rent, royalty, management fees
 *  15% — technical/consulting services
 *  20% — dividends (non-resident)
 * 
 * Tax treaties (40+ countries) may reduce these rates.
 * Form 14 due by 10th of the following month.
 * 
 * [EG-01 FIX] Replaced hardcoded accountId (2010, 2050) with code-based lookup.
 */

import { prisma } from './prisma';
import { n } from './decimal-utils';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'wht-engine' });

const db = (p: any) => p as any;

// ── Account Code Constants (NOT PKs) ──────────────────
const WHT_ACCOUNTS = {
    AP: '2100',         // الدائنون (Accounts Payable) — تخفيض المستحق
    WHT_PAYABLE: '2350' // ضريبة استقطاع مستحقة لـ ZATCA
};

// Resolve account PK from code (tenant-safe)
async function resolveAccountId(tx: any, code: string): Promise<number> {
    const acct = await tx.account.findFirst({ where: { code } });
    if (!acct) throw new Error(`[WHT Engine] Account code '${code}' not found. Ensure chart of accounts is configured.`);
    return acct.id;
}

// ── Treaty Rate Reductions (select countries) ──────────────────
const TREATY_REDUCTIONS: Record<string, Record<string, number>> = {
    GB: { DIVIDENDS: 0.05, ROYALTY: 0.08, TECHNICAL: 0.05 },
    US: { DIVIDENDS: 0.05, ROYALTY: 0.10, TECHNICAL: 0.05 },
    DE: { DIVIDENDS: 0.05, ROYALTY: 0.10, TECHNICAL: 0.05 },
    FR: { DIVIDENDS: 0.00, ROYALTY: 0.10, TECHNICAL: 0.05 },
    JP: { DIVIDENDS: 0.05, ROYALTY: 0.10, TECHNICAL: 0.05 },
    MY: { DIVIDENDS: 0.05, ROYALTY: 0.08, TECHNICAL: 0.08 },
    IN: { DIVIDENDS: 0.05, ROYALTY: 0.10, TECHNICAL: 0.10 },
    EG: { DIVIDENDS: 0.05, ROYALTY: 0.15, TECHNICAL: 0.10 },
    PK: { DIVIDENDS: 0.05, ROYALTY: 0.10, TECHNICAL: 0.10 },
};

export class WHTEngine {
    
    /**
     * Lookup WHT rate considering treaties
     */
    static lookupRate(
        serviceType: string,
        isForeignVendor: boolean,
        countryCode?: string,
        hasTaxResidencyCert: boolean = false
    ): { rate: number; treatyApplied: boolean; explanation: string } {
        const defaultRates: Record<string, number> = {
            RENT: 0.05, ROYALTY: 0.15, TECHNICAL: 0.05,
            CONSULTING: 0.15, DIVIDENDS: 0.05, MGMT_FEES: 0.20,
            INSURANCE: 0.05, TRANSPORT: 0.05, TELECOM: 0.05, OTHER: 0.15,
        };

        let rate = isForeignVendor ? (defaultRates[serviceType] || 0.15) : 0;
        let treatyApplied = false;
        let explanation = `معدل ${serviceType} ${isForeignVendor ? 'غير مقيم' : 'مقيم'}: ${(rate * 100).toFixed(0)}%`;

        if (isForeignVendor && countryCode && hasTaxResidencyCert) {
            const countryTreaty = TREATY_REDUCTIONS[countryCode.toUpperCase()];
            if (countryTreaty && countryTreaty[serviceType] !== undefined) {
                const treatyRate = countryTreaty[serviceType];
                if (treatyRate < rate) {
                    explanation += ` → تخفيض اتفاقية مع ${countryCode}: ${(treatyRate * 100).toFixed(0)}%`;
                    rate = treatyRate;
                    treatyApplied = true;
                }
            }
        }

        return { rate, treatyApplied, explanation };
    }

    /**
     * Calculate Withholding Tax for an Invoice
     */
    static async calculateWHT(invoiceId: number, serviceType: string) {
        const invoice = await prisma.purchaseInvoice.findUnique({
            where: { id: invoiceId },
            include: { supplier: true }
        });

        if (!invoice) throw new Error("Invoice not found");
        if (!invoice.supplierId) throw new Error("Invoice has no supplier");

        const supplier = invoice.supplier as any;
        const isForeign = supplier?.isForeignVendor || false;
        const hasCert = !!supplier?.whtTaxResidencyCert &&
                        supplier?.whtTaxResidencyExpiry &&
                        new Date(supplier.whtTaxResidencyExpiry) > new Date();

        const { rate, treatyApplied } = this.lookupRate(
            serviceType, isForeign, supplier?.whtCountryCode, hasCert
        );

        if (rate === 0) return null;

        const baseAmount = n(invoice.subtotal);
        const whtAmount = Math.round(baseAmount * rate * 100) / 100;

        return {
            supplierId: invoice.supplierId,
            invoiceId,
            baseAmount,
            rate,
            whtAmount,
            serviceCategory: serviceType,
            treatyApplied,
            treatyCountry: treatyApplied ? supplier?.whtCountryCode : null,
        };
    }

    /**
     * Apply WHT and deduct from payment
     */
    static async applyWHT(invoiceId: number, serviceType: string, userId: string) {
        const calculation = await this.calculateWHT(invoiceId, serviceType);
        if (!calculation) return { ok: true, message: 'No WHT rule applies to this invoice.' };

        return prisma.$transaction(async (tx) => {
            const whtTx = await db(tx).wHTTransaction.create({
                data: {
                    supplierId: calculation.supplierId,
                    invoiceId: calculation.invoiceId,
                    baseAmount: calculation.baseAmount,
                    whtRate: calculation.rate,
                    whtAmount: calculation.whtAmount,
                    certificateNumber: `WHT-${Date.now()}`,
                    serviceCategory: calculation.serviceCategory,
                    treatyApplied: calculation.treatyApplied,
                    treatyCountry: calculation.treatyCountry,
                }
            });

            await tx.purchaseInvoice.update({
                where: { id: invoiceId },
                data: { remaining: { decrement: calculation.whtAmount } }
            });

            // [EG-01 FIX] Resolve account IDs from codes, not hardcoded PKs
            const apAccountId = await resolveAccountId(tx, WHT_ACCOUNTS.AP);
            const whtPayableId = await resolveAccountId(tx, WHT_ACCOUNTS.WHT_PAYABLE);

            const je = await tx.journalEntry.create({
                data: {
                    entryNumber: `WHT-${whtTx.id}`,
                    entryDate: new Date().toISOString(),
                    description: `Withholding Tax Deduction for Invoice ${invoiceId}`,
                    status: 'posted',
                    totalDebit: calculation.whtAmount,
                    totalCredit: calculation.whtAmount,
                    createdBy: parseInt(userId, 10)
                }
            });

            await tx.journalLine.create({
                data: { entryId: je.id, accountId: apAccountId, debit: calculation.whtAmount, credit: 0, description: 'AP Reduction due to WHT / تخفيض الدائنون بسبب ضريبة الاستقطاع' }
            });

            await tx.journalLine.create({
                data: { entryId: je.id, accountId: whtPayableId, debit: 0, credit: calculation.whtAmount, description: 'WHT Payable to ZATCA / ضريبة استقطاع مستحقة لـ ZATCA' }
            });

            return whtTx;
        });
    }

    /**
     * List WHT transactions not yet paid to ZATCA
     */
    static async getPendingWHTTransactions() {
        return db(prisma).wHTTransaction.findMany({
            where: { paidToZATCA: false },
            include: { supplier: true },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }

    /**
     * Mark a batch of WHT transactions as paid to ZATCA
     */
    static async markAsPaid(transactionIds: number[], certificateNumber: string) {
        return prisma.wHTTransaction.updateMany({
            where: { id: { in: transactionIds } },
            data: { paidToZATCA: true, certificateNumber },
        });
    }

    /**
     * Generate Form 14 Batch for a period
     */
    static async generateForm14(period: string) {
        const startDate = new Date(`${period}-01`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const transactions = await db(prisma).wHTTransaction.findMany({
            take: 100,
            where: {
                createdAt: { gte: startDate, lt: endDate },
                form14BatchId: null,
                paidToZATCA: false,
            },
            include: { supplier: true },
        });

        if (transactions.length === 0) {
            return { error: 'لا توجد معاملات ضريبة استقطاع في هذه الفترة' };
        }

        const totalGross = transactions.reduce((sum: number, t: any) => sum + t.baseAmount, 0);
        const totalWht = transactions.reduce((sum: number, t: any) => sum + t.whtAmount, 0);

        const batch = await db(prisma).whtForm14Batch.upsert({
            where: { period },
            update: { totalGross, totalWht },
            create: { period, totalGross, totalWht, status: 'DRAFT' },
        });

        await db(prisma).wHTTransaction.updateMany({
            where: { id: { in: transactions.map((t: any) => t.id) } },
            data: { form14BatchId: batch.id },
        });

        const byCategory: Record<string, { count: number; gross: number; wht: number }> = {};
        for (const tx of transactions) {
            const cat = tx.serviceCategory || 'OTHER';
            if (!byCategory[cat]) byCategory[cat] = { count: 0, gross: 0, wht: 0 };
            byCategory[cat].count++;
            byCategory[cat].gross += tx.baseAmount;
            byCategory[cat].wht += tx.whtAmount;
        }

        return {
            batchId: batch.id, period,
            totalGross: Math.round(totalGross * 100) / 100,
            totalWht: Math.round(totalWht * 100) / 100,
            transactionCount: transactions.length,
            byCategory,
            deadline: `يجب التقديم قبل ${period}-10`,
        };
    }

    /**
     * Generate Monthly XML Return for ZATCA (legacy)
     */
    static async generateZatcaReturn(year: number, month: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const transactions = await prisma.wHTTransaction.findMany({
            take: 100,
            where: { createdAt: { gte: startDate, lte: endDate }, paidToZATCA: false },
            include: { supplier: true }
        });

        let totalWHT = 0;
        transactions.forEach((t: any) => totalWHT += t.whtAmount);

        return { period: `${year}-${month}`, transactionCount: transactions.length, totalWHT, transactions };
    }
}
