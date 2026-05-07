/**
 * Real-Time Credit Check Engine (Build #17)
 * ═══════════════════════════════════════════
 * 
 * حد ائتماني ديناميكي لكل عميل:
 * - يمنع إنشاء فاتورة/أمر بيع يتجاوز الحد
 * - يراعي الأرصدة المفتوحة + الطلبات غير المفوترة
 * - يدعم إعفاء مؤقت (override) من المدير المالي
 */

import type { PrismaClient } from '@prisma/client';

const db = (p: any) => p as any;

export type CreditCheckResult = {
    customerId: number;
    customerName: string;
    creditLimit: number;
    openBalance: number;       // فواتير غير مدفوعة
    pendingOrders: number;     // أوامر بيع غير مفوترة
    totalExposure: number;     // الإجمالي
    availableCredit: number;   // المتاح
    isOverLimit: boolean;
    overLimitAmount: number;
    overrideAllowed: boolean;  // هل يسمح بتجاوز مؤقت
};

export class CreditCheckEngine {
    /**
     * Full credit check for a customer
     */
    static async check(
        prisma: PrismaClient,
        customerId: number,
        additionalAmount: number = 0
    ): Promise<CreditCheckResult> {
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) throw new Error('عميل غير موجود');

        const cust = customer as any;
        const creditLimit = Number(cust.creditLimit || 0);

        // Open balance from unpaid sales invoices
        const openInvoices = await prisma.salesInvoice.aggregate({
            where: { customerId, status: { not: 'CANCELLED' } },
            _sum: { remaining: true },
        });
        const openBalance = Number(openInvoices._sum?.remaining || 0);

        // Pending sales orders not yet invoiced
        const pendingOrders = await db(prisma).salesOrder?.aggregate?.({
            where: { customerId, status: { in: ['CONFIRMED', 'APPROVED'] } },
            _sum: { total: true },
        }).catch(() => ({ _sum: { total: 0 } })) ?? { _sum: { total: 0 } };
        const pendingAmount = Number(pendingOrders._sum?.total || 0);

        const totalExposure = openBalance + pendingAmount + additionalAmount;
        const availableCredit = Math.max(0, creditLimit - totalExposure);
        const isOverLimit = creditLimit > 0 && totalExposure > creditLimit;
        const overLimitAmount = isOverLimit ? totalExposure - creditLimit : 0;

        return {
            customerId,
            customerName: cust.name || '',
            creditLimit,
            openBalance: Math.round(openBalance * 100) / 100,
            pendingOrders: Math.round(pendingAmount * 100) / 100,
            totalExposure: Math.round(totalExposure * 100) / 100,
            availableCredit: Math.round(availableCredit * 100) / 100,
            isOverLimit,
            overLimitAmount: Math.round(overLimitAmount * 100) / 100,
            overrideAllowed: !!cust.creditOverrideAllowed,
        };
    }

    /**
     * Batch check all customers near or over limit
     */
    static async getAtRiskCustomers(
        prisma: PrismaClient,
        thresholdPct: number = 0.8 // 80% utilization
    ): Promise<CreditCheckResult[]> {
        const customers = await prisma.customer.findMany({
            take: 100,
            where: { isActive: true },
            select: { id: true },
        });

        const results: CreditCheckResult[] = [];
        for (const c of customers) {
            try {
                const result = await this.check(prisma, c.id);
                if (result.creditLimit > 0) {
                    const utilization = result.totalExposure / result.creditLimit;
                    if (utilization >= thresholdPct) {
                        results.push(result);
                    }
                }
            } catch { /* skip errors */ }
        }

        return results.sort((a, b) => b.overLimitAmount - a.overLimitAmount);
    }

    /**
     * Quick pass/fail for sales document creation
     */
    static async canProceed(
        prisma: PrismaClient,
        customerId: number,
        amount: number
    ): Promise<{ allowed: boolean; message: string }> {
        const result = await this.check(prisma, customerId, amount);

        if (!result.isOverLimit || result.creditLimit === 0) {
            return { allowed: true, message: 'ضمن الحد الائتماني' };
        }

        if (result.overrideAllowed) {
            return {
                allowed: true,
                message: `⚠️ تجاوز الحد الائتماني بمبلغ ${result.overLimitAmount.toLocaleString()} ر.س — مسموح بالتجاوز`,
            };
        }

        return {
            allowed: false,
            message: `❌ تم تجاوز الحد الائتماني بمبلغ ${result.overLimitAmount.toLocaleString()} ر.س — يتطلب موافقة المدير المالي`,
        };
    }
}
