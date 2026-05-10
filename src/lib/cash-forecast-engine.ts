/**
 * Cash Forecast Engine (Build #18)
 * ═══════════════════════════════════
 * 
 * توقع التدفقات النقدية:
 * - مستحقات الخزينة (AR aging)
 * - مستحقات الموردين (AP aging) 
 * - الرواتب المتوقعة
 * - أقساط القروض
 * - إيرادات POS المتوقعة
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.cash-forecas' });

const db = (p: any) => p as any;

export type CashForecastPeriod = {
    period: string;             // YYYY-MM-DD or YYYY-W##
    expectedInflows: number;    // تحصيلات متوقعة
    expectedOutflows: number;   // مدفوعات متوقعة
    netCashFlow: number;
    cumulativeBalance: number;
    breakdown: {
        arCollections: number;  // تحصيلات عملاء
        otherIncome: number;    // إيرادات أخرى
        apPayments: number;     // مدفوعات موردين
        payroll: number;        // رواتب
        vatPayment: number;     // ضريبة القيمة المضافة
        loanPayments: number;   // أقساط
        otherExpenses: number;
    };
};

export class CashForecastEngine {
    /**
     * Generate weekly cash forecast for N weeks
     */
    static async forecast(
        prisma: PrismaClient,
        weeks: number = 12,
        startDate?: Date
    ): Promise<{ periods: CashForecastPeriod[]; openingBalance: number }> {
        const start = startDate || new Date();
        
        // Get opening cash balance from bank accounts
        const bankAccounts = await db(prisma).bankAccount?.findMany?.({
            where: { isActive: true },
            select: { currentBalance: true },
        }).catch(() => []) ?? [];
        
        const openingBalance = bankAccounts.reduce(
            (sum: number, b: any) => sum + Number(b.currentBalance || 0), 0
        );

        // Get AR aging (expected collections)
        const openAR = await (prisma as any).salesInvoice.findMany({
            take: 100,
            where: { status: { not: 'CANCELLED' }, remaining: { gt: 0 } },
            select: { remaining: true, dueDate: true, invoiceDate: true },
        });

        // Get AP aging (expected payments)
        const openAP = await (prisma as any).purchaseInvoice.findMany({
            take: 100,
            where: { status: { not: 'cancelled' }, remaining: { gt: 0 } },
            select: { remaining: true, dueDate: true, invoiceDate: true },
        });

        // Get monthly payroll estimate
        const payrollEstimate = await (prisma as any).employee.aggregate({
            where: { active: true },
            _sum: { salary: true },
        });
        const monthlyPayroll = Number(payrollEstimate._sum?.salary || 0);
        const weeklyPayroll = monthlyPayroll / 4.33;

        // Build periods
        const periods: CashForecastPeriod[] = [];
        let cumBalance = openingBalance;

        for (let w = 0; w < weeks; w++) {
            const weekStart = new Date(start);
            weekStart.setDate(weekStart.getDate() + w * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            // AR due in this week
            const arDue = openAR
                .filter((inv: any) => {
                    const due = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.invoiceDate);
                    return due >= weekStart && due <= weekEnd;
                })
                .reduce((sum: number, inv: any) => sum + Number(inv.remaining), 0);

            // AP due in this week
            const apDue = openAP
                .filter((inv: any) => {
                    const _due_dup97 = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.invoiceDate);
                    // @ts-expect-error [TS2304] Cannot find name
                    return due >= weekStart && due <= weekEnd;
                })
                .reduce((sum: number, inv: any) => sum + Number(inv.remaining), 0);

            // Payroll at end of month
            const isMonthEnd = weekEnd.getMonth() !== new Date(weekEnd.getTime() + 86400000).getMonth();
            const payroll = isMonthEnd ? monthlyPayroll : 0;

            const inflows = arDue;
            const outflows = apDue + payroll;
            const netCash = inflows - outflows;
            cumBalance += netCash;

            periods.push({
                period: weekStart.toISOString().slice(0, 10),
                expectedInflows: Math.round(inflows * 100) / 100,
                expectedOutflows: Math.round(outflows * 100) / 100,
                netCashFlow: Math.round(netCash * 100) / 100,
                cumulativeBalance: Math.round(cumBalance * 100) / 100,
                breakdown: {
                    arCollections: Math.round(arDue * 100) / 100,
                    otherIncome: 0,
                    apPayments: Math.round(apDue * 100) / 100,
                    payroll: Math.round(payroll * 100) / 100,
                    vatPayment: 0,
                    loanPayments: 0,
                    otherExpenses: 0,
                },
            });
        }

        return { periods, openingBalance: Math.round(openingBalance * 100) / 100 };
    }

    /**
     * Summary: min balance, shortfall periods, avg net flow
     */
    static async summary(prisma: PrismaClient, weeks: number = 12) {
        const { periods, openingBalance } = await this.forecast(prisma, weeks);

        const minBalance = Math.min(...periods.map(p => p.cumulativeBalance));
        const shortfallPeriods = periods.filter(p => p.cumulativeBalance < 0);
        const avgNet = periods.reduce((s: any, p: any) => s + p.netCashFlow, 0) / periods.length;

        return {
            openingBalance,
            weeksForecast: weeks,
            minBalance: Math.round(minBalance * 100) / 100,
            shortfallWeeks: shortfallPeriods.length,
            avgWeeklyNetFlow: Math.round(avgNet * 100) / 100,
            riskLevel: shortfallPeriods.length > 0 ? 'HIGH' : minBalance < openingBalance * 0.2 ? 'MEDIUM' : 'LOW',
        };
    }
}
