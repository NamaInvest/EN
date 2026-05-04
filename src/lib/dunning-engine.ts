import { prisma } from './prisma';

export class DunningEngine {
    
    /**
     * Run daily Dunning Cron to identify overdue invoices and send reminders
     */
    static async executeDailyRun(asOfDate: Date) {
        // Find AR open items overdue and not in dispute
        // For simplicity, we query SalesInvoice representing open items where remaining > 0
        const overdueInvoices = await prisma.salesInvoice.findMany({
            where: {
                status: 'posted',
                remaining: { gt: 0 },
                date: { lt: asOfDate } 
            },
            include: { customer: true }
        });

        const customerGroups: Record<number, any[]> = {};
        for (const inv of overdueInvoices) {
            if (!inv.customerId) continue;
            customerGroups[inv.customerId] = customerGroups[inv.customerId] || [];
            customerGroups[inv.customerId].push(inv);
        }

        // Fetch Dunning Levels (Policies)
        const levels = await prisma.dunningLevel.findMany({
            where: { active: true },
            orderBy: { daysOverdue: 'desc' }
        });

        for (const [customerIdStr, invoices] of Object.entries(customerGroups)) {
            const customerId = parseInt(customerIdStr, 10);
            const customer = invoices[0].customer;

            // Check if snoozed
            if (customer.dunningPaused || (customer.dunningSnoozeUntil && new Date(customer.dunningSnoozeUntil) > asOfDate)) {
                continue;
            }

            // Check Promise to Pay
            const activePromise = await prisma.promiseToPay.findFirst({
                where: { customerId, status: 'ACTIVE' }
            });

            if (activePromise && activePromise.promisedDate >= asOfDate) {
                continue; // Do not dun if they promised to pay and date is not passed
            }

            // Calculate max overdue days
            let maxDaysOverdue = 0;
            let totalAmountDue = 0;
            let oldestDueDate = asOfDate;
            
            for (const inv of invoices) {
                const dueDate = new Date(inv.date); // Using date as due date for simplicity
                const diffDays = Math.ceil((asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays > maxDaysOverdue) maxDaysOverdue = diffDays;
                if (dueDate < oldestDueDate) oldestDueDate = dueDate;
                // @ts-ignore
                const remainingAmount = typeof inv.remaining === 'number' ? inv.remaining : Number(inv.remaining.toString());
                totalAmountDue += remainingAmount;
            }

            // Determine target level
            const targetLevel = levels.find(l => maxDaysOverdue >= l.daysOverdue);
            if (!targetLevel) continue;

            const currentLevel = customer.dunningCurrentLevel || 0;

            // Only act if targetLevel is greater than currentLevel
            if (targetLevel.levelNumber <= currentLevel) {
                // To avoid spam, we skip if already at this level.
                continue; 
            }

            // Create Campaign if not exists
            let campaign = await prisma.dunningCampaign.findFirst({
                where: { customerId, status: 'ACTIVE' }
            });

            if (!campaign) {
                campaign = await prisma.dunningCampaign.create({
                    data: {
                        campaignNumber: `DUN-${customerId}-${Date.now()}`,
                        customerId,
                        totalAmountAtStart: totalAmountDue,
                        triggeredBy: 'CRON'
                    }
                });
            }

            // Generate Dunning Letter
            const letter = await prisma.dunningLetter.create({
                data: {
                    letterNumber: `LTR-${campaign.id}-${targetLevel.levelNumber}`,
                    campaignId: campaign.id,
                    customerId,
                    levelId: targetLevel.id,
                    invoiceIds: invoices.map(i => i.id),
                    totalAmountDue,
                    oldestDueDate,
                    daysOverdue: maxDaysOverdue,
                    status: 'GENERATED'
                }
            });

            // If level 4, Block Customer
            if (targetLevel.blockCustomer && !customer.creditHold) {
                await prisma.customer.update({
                    where: { id: customerId },
                    data: {
                        creditHold: true,
                        creditHoldReason: `DUNNING_LEVEL_${targetLevel.levelNumber}`
                    }
                });
            }

            // Update Customer's current level
            await prisma.customer.update({
                where: { id: customerId },
                data: {
                    dunningCurrentLevel: targetLevel.levelNumber,
                    dunningLastRunAt: new Date()
                }
            });
            
            // Send communications (mock)
            if (targetLevel.sendEmail) {
                await prisma.dunningCommunication.create({
                    data: {
                        letterId: letter.id,
                        channel: 'EMAIL',
                        recipientAddress: customer.email || 'finance@customer.com',
                        status: 'SENT',
                        direction: 'OUTBOUND'
                    }
                });
            }
        }
    }
}
