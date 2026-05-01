import { prisma } from './prisma';

export class PaymentTermsEngine {
    /**
     * Calculates due dates based on payment term rules
     */
    static async calculateDueSchedule(invoiceAmount: number, invoiceDate: Date, termId: number) {
        const term = await prisma.paymentTerm.findUnique({
            where: { id: termId },
            include: { installments: true }
        });

        if (!term) throw new Error("Payment Term not found");

        const schedule = [];
        const baseDate = new Date(invoiceDate);

        if (term.type === 'due_on_receipt') {
            schedule.push({
                dueDate: baseDate,
                amount: invoiceAmount
            });
        } else if (term.type === 'net' && term.netDays) {
            baseDate.setDate(baseDate.getDate() + term.netDays);
            schedule.push({
                dueDate: baseDate,
                amount: invoiceAmount
            });
        } else if (term.type === 'installments' && term.installments.length > 0) {
            for (const inst of term.installments) {
                const due = new Date(invoiceDate);
                due.setDate(due.getDate() + inst.daysAfterInvoice);
                schedule.push({
                    dueDate: due,
                    amount: (invoiceAmount * Number(inst.percentOfTotal)) / 100
                });
            }
        } else if (term.type === '2_10_net_30') {
            baseDate.setDate(baseDate.getDate() + 30);
            schedule.push({
                dueDate: baseDate,
                amount: invoiceAmount
            });
        } else {
            // Default to due on receipt if unknown type
            schedule.push({
                dueDate: baseDate,
                amount: invoiceAmount
            });
        }

        return schedule;
    }
}
