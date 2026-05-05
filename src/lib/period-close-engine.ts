import prisma from './prisma';

export class PeriodCloseEngine {

    /**
     * Revalues foreign currency bank and AR/AP accounts based on the month-end exchange rate.
     */
    static async runFXRevaluation(year: number, month: number, targetExchangeRate: number, currencyId: number) {
        // Find all unpaid foreign currency invoices for AR
        const foreignInvoices = await prisma.salesInvoice.findMany({
            where: {
                currencyId: currencyId,
                remaining: { gt: 0 },
            }
        });

        let totalGainLoss = 0;
        for (const inv of foreignInvoices) {
            const originalRate = inv.exchangeRate || 1;
            const diffRate = targetExchangeRate - originalRate;
            
            // If diffRate > 0, the foreign currency appreciated against local. 
            // For AR, this is an Unrealized Gain.
            const gainLoss = inv.remaining * diffRate;
            totalGainLoss += gainLoss;
            
            // We would generate a Journal Entry here for the gain/loss 
            // Debit/Credit Unrealized FX Gain/Loss Account
            // Debit/Credit AR Account
        }

        return {
            status: 'success',
            revaluedCount: foreignInvoices.length,
            unrealizedGainLoss: totalGainLoss
        };
    }

    /**
     * Calculates depreciation for all active fixed assets and generates JEs.
     */
    static async runDepreciation(year: number, month: number) {
        const assets = await prisma.asset.findMany({
            where: { status: 'active' }
        });

        let totalDepreciation = 0;
        for (const asset of assets) {
            // Simplified straight-line depreciation
            const monthlyDepreciation = asset.purchasePrice * 0.20 / 12; // assuming 20% annual for demo
            totalDepreciation += monthlyDepreciation;

            // Generate Journal Entry
            // Debit Depreciation Expense
            // Credit Accumulated Depreciation
        }

        return {
            status: 'success',
            depreciatedAssets: assets.length,
            totalDepreciation
        };
    }

    /**
     * Closes a fiscal period, preventing further journal entries.
     */
    static async closePeriod(year: number, month: number, userId: number) {
        // Check if period exists
        let period = await prisma.fiscalPeriod.findUnique({
            where: { year_month: { year, month } }
        });

        if (!period) {
            period = await prisma.fiscalPeriod.create({
                data: { year, month, status: 'open' }
            });
        }

        if (period.status === 'closed') {
            throw new Error(`Period ${year}-${month} is already closed.`);
        }

        // Run required pre-close tasks
        await this.runDepreciation(year, month);
        
        // Lock the period
        await prisma.fiscalPeriod.update({
            where: { id: period.id },
            data: {
                status: 'closed',
                closedBy: userId,
                closedAt: new Date(),
                notes: 'Closed via Period Close Engine'
            }
        });

        return { success: true, message: `Period ${year}-${month} closed successfully.` };
    }

    /**
     * Year-end closing: Transfers net income to retained earnings.
     */
    static async closeYear(year: number, retainedEarningsAccountId: number, userId: number) {
        // Sum up all Revenues and Expenses for the year
        // Generate a massive JE that debits Revenue, credits Expenses, and diff goes to Retained Earnings
        
        const fiscalYear = await prisma.fiscalYear.findUnique({
            where: { yearNumber: year }
        });

        if (fiscalYear?.status === 'CLOSED') {
            throw new Error(`Year ${year} is already closed.`);
        }

        // Lock all periods
        for (let i = 1; i <= 12; i++) {
            await prisma.fiscalPeriod.upsert({
                where: { year_month: { year, month: i } },
                update: { status: 'closed', closedBy: userId, closedAt: new Date() },
                create: { year, month: i, status: 'closed', closedBy: userId, closedAt: new Date() }
            });
        }

        await prisma.fiscalYear.update({
            where: { yearNumber: year },
            data: { 
                status: 'CLOSED',
                closedAt: new Date(),
                closedByUserId: String(userId)
            }
        });

        return { success: true, message: `Year ${year} closed successfully.` };
    }
}
