import { prisma } from './prisma';

export class RecurringJournalRunner {
    static async runDueTemplates(targetDate: Date = new Date()) {
        // Find templates that are due to run
        const dueTemplates = await prisma.journalTemplate.findMany({
            where: {
                isRecurring: true,
                nextRunDate: { lte: targetDate },
                OR: [
                    { endDate: null },
                    { endDate: { gte: targetDate } }
                ]
            },
            include: { lines: true }
        });

        const results = [];

        for (const template of dueTemplates) {
            try {
                // Generate Journal Entry
                const je = await this.generateJournalFromTemplate(template, targetDate);
                
                // Update next run date based on frequency
                const nextDate = this.calculateNextRunDate(template.nextRunDate || targetDate, template.frequency);
                
                await prisma.journalTemplate.update({
                    where: { id: template.id },
                    data: { nextRunDate: nextDate }
                });

                results.push({ templateId: template.id, status: 'SUCCESS', journalEntryId: je.id });
            } catch (error) {
                results.push({ templateId: template.id, status: 'FAILED', error: (error as Error).message });
            }
        }

        return results;
    }

    private static async generateJournalFromTemplate(template: any, runDate: Date) {
        // In a real system, formulas {prevMonthSales} etc. would be parsed here.
        // For foundation, we map straight amounts or fallback to 0.

        const journalLines = template.lines.map((line: any) => {
            const debit = line.debitFormula ? parseFloat(line.debitFormula) : 0;
            const credit = line.creditFormula ? parseFloat(line.creditFormula) : 0;
            
            return {
                accountId: line.accountId,
                debit: debit || 0,
                credit: credit || 0,
                description: line.description || `Generated from Template: ${template.name}`
            };
        });

        // Validate Balance
        const totalDebit = journalLines.reduce((acc: number, l: any) => acc + l.debit, 0);
        const totalCredit = journalLines.reduce((acc: number, l: any) => acc + l.credit, 0);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Template ${template.id} generates unbalanced journal`);
        }

        return prisma.journalEntry.create({
            data: {
                entryNumber: `REC-${template.id}-${runDate.getTime()}`,
                entryDate: runDate.toISOString(),
                reference: `REC-${template.id}-${runDate.getTime()}`,
                description: `Recurring: ${template.name}`,
                status: 'draft',
                lines: {
                    create: journalLines
                }
            }
        });
    }

    private static calculateNextRunDate(currentDate: Date, frequency: string | null): Date {
        const next = new Date(currentDate);
        switch (frequency) {
            case 'DAILY': next.setDate(next.getDate() + 1); break;
            case 'WEEKLY': next.setDate(next.getDate() + 7); break;
            case 'MONTHLY': next.setMonth(next.getMonth() + 1); break;
            case 'YEARLY': next.setFullYear(next.getFullYear() + 1); break;
            default: next.setMonth(next.getMonth() + 1); // fallback
        }
        return next;
    }
}
