// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DunningEngine {
    
    /**
     * Executes the dunning run to find overdue invoices and issue letters.
     */
    static async executeDunningRun(): Promise<{ lettersIssued: number }> {
        const levels = await prisma.dunningLevel.findMany({
            orderBy: { daysOverdue: 'desc' }
        });

        if (levels.length === 0) {
            console.warn("No dunning levels configured.");
            return { lettersIssued: 0 };
        }

        // Find all outstanding sales invoices
        // Assumes SalesInvoice has dueDate, totalAmount, and status
        // and ideally an open balance, but we'll approximate with status
        const openInvoices = await prisma.salesInvoice.findMany({
            where: {
                status: { notIn: ['PAID', 'CANCELLED', 'DRAFT'] },
                dueDate: { lt: new Date() } // overdue
            },
            include: { customer: true }
        });

        const today = new Date();
        let issuedCount = 0;

        for (const invoice of openInvoices) {
            const dueDate = new Date(invoice.dueDate);
            const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

            // Find the highest applicable dunning level
            const applicableLevel = levels.find(l => daysOverdue >= l.daysOverdue);

            if (applicableLevel) {
                // Check if a letter for this level (or higher) has already been issued for this invoice
                const existingLetter = await prisma.dunningLetter.findFirst({
                    where: {
                        invoiceId: invoice.id,
                        levelId: { gte: applicableLevel.id } // assumes higher ID means higher level, or could check levelNumber
                    }
                });

                if (!existingLetter) {
                    // Calculate amounts
                    const outstanding = Number(invoice.totalAmount); // in a real system, this is total - paid
                    const fee = applicableLevel.feeAmount;
                    const interest = (outstanding * (applicableLevel.interestRate / 100)) * (daysOverdue / 365);
                    const totalDue = outstanding + fee + interest;

                    // Create new Dunning Letter
                    await prisma.dunningLetter.create({
                        data: {
                            customerId: invoice.customerId,
                            invoiceId: invoice.id,
                            levelId: applicableLevel.id,
                            dueDate: new Date(today.getTime() + (7 * 24 * 3600 * 1000)), // Pay within 7 days
                            outstandingAmount: outstanding,
                            dunningFee: fee + interest,
                            totalDue: totalDue,
                            status: 'ISSUED'
                        }
                    });

                    // Send Email
                    await this.sendDunningEmail(invoice.customer.email, applicableLevel.emailTemplate, {
                        customerName: invoice.customer.fullName,
                        invoiceNumber: invoice.id.toString(), // or invoice.reference
                        daysOverdue,
                        totalDue,
                        dueDate: invoice.dueDate
                    });

                    // Block account if level requires it
                    if (applicableLevel.blockAccount) {
                        await prisma.customer.update({
                            where: { id: invoice.customerId },
                            data: { status: 'BLOCKED' } // Assumes status field exists
                        });
                    }

                    issuedCount++;
                }
            }
        }

        return { lettersIssued: issuedCount };
    }

    private static async sendDunningEmail(email: string | null, template: string, data: any) {
        if (!email) return;
        
        let content = template
            .replace('{{customerName}}', data.customerName)
            .replace('{{invoiceNumber}}', data.invoiceNumber)
            .replace('{{daysOverdue}}', data.daysOverdue)
            .replace('{{totalDue}}', data.totalDue);
            
        console.log(`Sending Dunning to ${email}: ${content}`);
        // Integration with SendGrid/SMTP would go here
    }
}
