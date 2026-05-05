import { prisma } from './prisma';

export class CashFlowEngine {
    
    /**
     * Forecasts the Cash Flow for a specified number of days ahead.
     */
    static async generateForecast(days = 30) {
        const today = new Date();
        const forecastDate = new Date(today);
        forecastDate.setDate(today.getDate() + days);

        // 1. Calculate Opening Balance (Bank Accounts + Safe/Cash)
        const banks = await prisma.bankAccount.aggregate({
            _sum: { currentBalance: true }
        });
        let openingBalance = banks._sum.currentBalance || 0;

        // Optionally, add Treasury/Safe balances if available in a dedicated model.
        // For now, we assume bank currentBalance represents available liquidity.

        // Initialize forecast array
        const forecast: Record<string, { date: string, inflow: number, outflow: number, balance: number, details: any[] }> = {};
        
        let currentBalance = openingBalance;

        for (let i = 0; i <= days; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            
            forecast[dateStr] = {
                date: dateStr,
                inflow: 0,
                outflow: 0,
                balance: 0,
                details: []
            };
        }

        // 2. Predict Inflows (AR / Open Sales Invoices)
        // Note: Assuming `date` or a `dueDate` field exists. For SalesInvoice, we'll use `date` + 30 days as a mock due date if dueDate is absent.
        const openSalesInvoices = await prisma.salesInvoice.findMany({
            where: {
                status: 'posted',
                remaining: { gt: 0 }
            }
        });

        for (const invoice of openSalesInvoices) {
            // Mocking due date: 30 days after invoice date
            const dueDate = new Date(invoice.date);
            dueDate.setDate(dueDate.getDate() + 30);
            
            // If due date falls within our forecast window
            if (dueDate >= today && dueDate <= forecastDate) {
                const dateStr = dueDate.toISOString().split('T')[0];
                if (forecast[dateStr]) {
                    // Apply historical collection rate (e.g. 85%)
                    const expectedAmount = invoice.remaining * 0.85; 
                    
                    forecast[dateStr].inflow += expectedAmount;
                    forecast[dateStr].details.push({
                        type: 'AR_COLLECTION',
                        reference: `INV-${invoice.invoiceNo}`,
                        amount: expectedAmount
                    });
                }
            }
        }

        // Add Revenue Arrangements (if any)
        const activeArrangements = await prisma.deferredRevenueSchedule.findMany({
            where: { isCurrent: true }
        });
        
        for (const arr of activeArrangements) {
            // Mock: monthly billing on the 1st of the month
            const nextBilling = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            if (nextBilling >= today && nextBilling <= forecastDate) {
                const dateStr = nextBilling.toISOString().split('T')[0];
                if (forecast[dateStr]) {
                    const monthlyValue = Number(arr.totalAmount) / 12; // simplified
                    forecast[dateStr].inflow += monthlyValue;
                    forecast[dateStr].details.push({
                        type: 'REVENUE_CONTRACT',
                        reference: `Contract-${arr.id}`,
                        amount: monthlyValue
                    });
                }
            }
        }

        // 3. Predict Outflows (AP / Open Purchase Invoices)
        const openPurchaseInvoices = await prisma.purchaseInvoice.findMany({
            where: {
                status: 'posted',
                remaining: { gt: 0 }
            }
        });

        for (const invoice of openPurchaseInvoices) {
            // Mocking due date: 45 days after invoice date
            const dueDate = new Date(invoice.date);
            dueDate.setDate(dueDate.getDate() + 45);
            
            if (dueDate >= today && dueDate <= forecastDate) {
                const dateStr = dueDate.toISOString().split('T')[0];
                if (forecast[dateStr]) {
                    const expectedAmount = invoice.remaining; 
                    forecast[dateStr].outflow += expectedAmount;
                    forecast[dateStr].details.push({
                        type: 'AP_PAYMENT',
                        reference: `PINV-${invoice.invoiceNo}`,
                        amount: expectedAmount
                    });
                }
            }
        }

        // Payroll Outflows
        // Assume payroll is paid on the 28th of every month
        const payrollDate = new Date(today.getFullYear(), today.getMonth(), 28);
        if (payrollDate < today) {
            payrollDate.setMonth(payrollDate.getMonth() + 1); // Next month
        }
        
        if (payrollDate >= today && payrollDate <= forecastDate) {
            const dateStr = payrollDate.toISOString().split('T')[0];
            if (forecast[dateStr]) {
                const estimatedPayroll = 250000; // Mocked aggregate value
                forecast[dateStr].outflow += estimatedPayroll;
                forecast[dateStr].details.push({
                    type: 'PAYROLL',
                    reference: `Payroll-${payrollDate.getMonth() + 1}`,
                    amount: estimatedPayroll
                });
            }
        }

        // 4. Calculate Running Balances
        const sortedDates = Object.keys(forecast).sort();
        const results = [];

        for (const dateStr of sortedDates) {
            const dayData = forecast[dateStr];
            currentBalance = currentBalance + dayData.inflow - dayData.outflow;
            dayData.balance = currentBalance;
            results.push(dayData);
        }

        return {
            openingBalance,
            closingBalance: currentBalance,
            forecast: results
        };
    }
}
