import { prisma } from './prisma';

export class PaymentRunEngine {
    
    /**
     * Propose payments based on criteria (due dates, early discounts)
     */
    static async proposePayments(runDate: Date, nextPaymentDate: Date, bankAccountId: number) {
        // Find open purchase invoices that are due before nextPaymentDate
        const openInvoices = await prisma.purchaseInvoice.findMany({
            where: {
                status: 'posted',
                remaining: { gt: 0 }
            },
            include: { supplier: true }
        });

        const proposedLines: any[] = [];
        let totalAmount = 0;

        // Group by supplier
        const supplierGroups: Record<number, any[]> = {};

        for (const inv of openInvoices) {
            const dueDate = new Date(inv.date);
            dueDate.setDate(dueDate.getDate() + 45); // Assuming 45 days terms

            if (dueDate <= nextPaymentDate) {
                if (!inv.supplierId) continue;
                if (!supplierGroups[inv.supplierId]) {
                    supplierGroups[inv.supplierId] = [];
                }
                supplierGroups[inv.supplierId].push(inv);
            }
        }

        // Create a DRAFT PaymentRun
        const run = await prisma.paymentRun.create({
            data: {
                runDate,
                paymentMethod: 'TRANSFER',
                bankAccountId,
                status: 'PROPOSED',
                totalAmount: 0 // Will update below
            }
        });

        // Create lines for each supplier
        for (const [supplierIdStr, invoices] of Object.entries(supplierGroups)) {
            const supplierId = parseInt(supplierIdStr, 10);
            const amountToPay = invoices.reduce((sum, inv) => sum + inv.remaining, 0);
            const invoiceIds = invoices.map(i => i.id).join(',');

            await prisma.paymentRunLine.create({
                data: {
                    runId: run.id,
                    supplierId,
                    invoiceIds,
                    amount: amountToPay,
                    status: 'PENDING'
                }
            });

            totalAmount += amountToPay;
        }

        // Update run total
        const finalRun = await prisma.paymentRun.update({
            where: { id: run.id },
            data: { totalAmount },
            include: { lines: { include: { supplier: true } } }
        });

        return finalRun;
    }

    /**
     * Execute the Payment Run
     */
    static async executePayments(runId: number, userId: string) {
        const run = await prisma.paymentRun.findUnique({
            where: { id: runId },
            include: { lines: true }
        });

        if (!run) throw new Error("Payment run not found");
        if (run.status !== 'PROPOSED') throw new Error("Only proposed runs can be executed");

        return prisma.$transaction(async (tx) => {
            for (const line of run.lines) {
                if (line.status !== 'PENDING') continue;

                // 1. Mark line as PAID
                await tx.paymentRunLine.update({
                    where: { id: line.id },
                    data: { status: 'PAID' }
                });

                // 2. Mark invoices as paid
                const invoiceIds = line.invoiceIds.split(',').map(id => parseInt(id, 10));
                for (const invId of invoiceIds) {
                    await tx.purchaseInvoice.update({
                        where: { id: invId },
                        data: { remaining: 0, status: 'paid' }
                    });
                }

                // 3. Generate JE (Debit AP, Credit Bank)
                const je = await tx.journalEntry.create({
                    data: {
                        entryNumber: `PRUN-${run.id}-V${line.supplierId}`,
                        entryDate: new Date().toISOString(),
                        description: `Payment Run Execution for Supplier ${line.supplierId}`,
                        status: 'posted',
                        totalDebit: line.amount,
                        totalCredit: line.amount,
                        createdBy: parseInt(userId, 10)
                    }
                });

                await tx.journalLine.create({
                    data: {
                        entryId: je.id,
                        accountId: 2010, // Mock AP Account
                        debit: line.amount,
                        credit: 0,
                        description: 'AP Settlement'
                    }
                });

                await tx.journalLine.create({
                    data: {
                        entryId: je.id,
                        accountId: run.bankAccountId, // Bank Account
                        debit: 0,
                        credit: line.amount,
                        description: 'Bank Payment'
                    }
                });
            }

            // Generate Bank File (SEPA XML)
            // Using dynamic import or mock call since SEPAFileGenerator is created.
            // Normally we would save the file to cloud storage and link the URL.
            const fileContent = `<?xml version="1.0"?><Document><!-- SEPA XML for ${run.id} --></Document>`;

            // Update Run Status
            const executedRun = await tx.paymentRun.update({
                where: { id: run.id },
                data: { status: 'EXECUTED' }
            });

            return executedRun;
        });
    }
}
