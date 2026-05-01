import { prisma } from './prisma';

export class CashFlowForecastingEngine {
    
    /**
     * Generates a direct-method cash flow forecast
     */
    static async generateForecast(period: 'DAILY' | 'WEEKLY' | 'MONTHLY', forecastDate: Date = new Date()) {
        
        // Find AR (expected inflows) and AP (expected outflows)
        const openItems = await prisma.openItem.findMany({
            where: {
                status: { in: ['OPEN', 'PARTIAL'] },
                dueDate: { not: null }
            }
        });

        let totalInflows = 0;
        let totalOutflows = 0;

        for (const item of openItems) {
            if (item.partyType === 'customer') {
                totalInflows += Number(item.openAmount);
            } else if (item.partyType === 'vendor') {
                totalOutflows += Number(item.openAmount);
            }
        }

        // Aggregate by period bins (e.g. daily, weekly chunks) and add current bank balances.
        // Simplified for foundation logic:
        
        const forecast = await prisma.cashFlowForecast.create({
            data: {
                forecastDate,
                period,
                inflows: totalInflows,
                outflows: totalOutflows,
                netPosition: totalInflows - totalOutflows
            }
        });

        return forecast;
    }
}
