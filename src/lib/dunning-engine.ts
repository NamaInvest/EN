import { prisma } from './prisma';

export class DunningEngine {
    
    /**
     * Run daily Dunning Cron to identify overdue invoices and send reminders
     */
    static async runDunningCron(asOfDate: Date) {
        // 1. Find AR open items overdue
        const overdueInvoices = await prisma.salesInvoice.findMany({
            where: {
                status: 'posted',
                remaining: { gt: 0 },
                date: { lt: asOfDate } // Assuming due date = invoice date for simplicity
            },
            include: { customer: true }
        });

        // Group by customer
        const customerGroups: Record<number, any[]> = {};
        for (const inv of overdueInvoices) {
            if (!inv.customerId) continue;
            if (!customerGroups[inv.customerId]) customerGroups[inv.customerId] = [];
            customerGroups[inv.customerId].push(inv);
        }

        const results = [];

        // 2. Process each customer
        for (const [customerIdStr, invoices] of Object.entries(customerGroups)) {
            const customerId = parseInt(customerIdStr, 10);
            
            // Find applicable policy (or default)
            // @ts-ignore
            let policy = await prisma.dunningPolicy.findFirst({
                // @ts-ignore
                where: { isActive: true, customerSegment: invoices[0].customer.segment || 'DEFAULT' }
            });

            if (!policy) {
                policy = await prisma.dunningPolicy.findFirst({ where: { isActive: true, customerSegment: null } });
            }

            if (!policy) continue; // No policy, skip

            const levels = JSON.parse(policy.levels);
            levels.sort((a: any, b: any) => b.daysOverdue - a.daysOverdue); // Descending

            // Find max days overdue for this customer
            let maxDaysOverdue = 0;
            for (const inv of invoices) {
                const diffDays = Math.ceil((asOfDate.getTime() - new Date(inv.date).getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays > maxDaysOverdue) maxDaysOverdue = diffDays;
            }

            // Determine applicable level
            const applicableLevel = levels.find((l: any) => maxDaysOverdue >= l.daysOverdue);
            if (!applicableLevel) continue;

            // Check if we already ran this level recently (e.g. within 7 days)
            const recentRun = await prisma.dunningRun.findFirst({
                where: {
                    customerId,
                    level: applicableLevel.level,
                    runDate: { gte: new Date(asOfDate.getTime() - 7 * 24 * 60 * 60 * 1000) }
                }
            });

            if (recentRun) continue; // Already dunned for this level recently

            // 3. Execute actions (Channels, Late Fees)
            const channelsUsed: string[] = [];
            if (applicableLevel.channels?.includes('EMAIL')) {
                channelsUsed.push('EMAIL');
            }
            if (applicableLevel.channels?.includes('SMS')) {
                channelsUsed.push('SMS');
            }

            let totalFeesAdded = 0;
            if (applicableLevel.lateFeeFlat) {
                totalFeesAdded += applicableLevel.lateFeeFlat;
                // Add late fee as new AR Open Item (Sales Invoice)
                await prisma.salesInvoice.create({
                    data: {
                        invoiceNo: Math.floor(Math.random() * 1000000),
                        date: asOfDate,
                        customerId,
                        subtotal: applicableLevel.lateFeeFlat,
                        taxValue: 0,
                        total: applicableLevel.lateFeeFlat,
                        remaining: applicableLevel.lateFeeFlat,
                        status: 'posted',
                        notes: `Dunning Level ${applicableLevel.level} Late Fee`
                    }
                });
            }

            if (applicableLevel.interestRatePctMonthly) {
                const overdueAmount = invoices.reduce((sum, inv) => sum + inv.remaining, 0);
                const interest = overdueAmount * (applicableLevel.interestRatePctMonthly / 100);
                totalFeesAdded += interest;
                // Add Interest
                await prisma.salesInvoice.create({
                    data: {
                        invoiceNo: Math.floor(Math.random() * 1000000),
                        date: asOfDate,
                        customerId,
                        subtotal: interest,
                        taxValue: 0,
                        total: interest,
                        remaining: interest,
                        status: 'posted',
                        notes: `Dunning Level ${applicableLevel.level} Interest Charge`
                    }
                });
            }

            // 4. Create Run Record
            const run = await prisma.dunningRun.create({
                data: {
                    runDate: asOfDate,
                    customerId,
                    invoiceIds: JSON.stringify(invoices.map(i => i.id)),
                    level: applicableLevel.level,
                    channelsUsed: JSON.stringify(channelsUsed),
                    totalFeesAdded,
                    status: 'SENT'
                }
            });

            results.push(run);
        }

        return results;
    }

    /**
     * Get Dunning History for a Customer
     */
    static async getDunningHistory(customerId: number) {
        return prisma.dunningRun.findMany({
            where: { customerId },
            orderBy: { runDate: 'desc' }
        });
    }
}
