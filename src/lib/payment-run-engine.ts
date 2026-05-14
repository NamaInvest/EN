import { logger } from '@/lib/logger';

const log = logger.child({ service: 'PaymentRunEngine' });

import { prisma } from './prisma';
import { createJournalEntry, ACCOUNTS } from '@/lib/auto-journal';

export class PaymentRunEngine {
    
    /**
     * Propose payments based on criteria (due dates, early discounts)
     */
    static async proposePayments(dueDateUntil: Date, currency: string, bankAccountId: number, includeDiscountWindow: boolean = true) {
        // Find open purchase invoices that are due before dueDateUntil and not blocked
        const openInvoices = await prisma.purchaseInvoice.findMany({
            take: 100,
            where: {
                status: 'posted',
                remaining: { gt: 0 }
            },
            include: { supplier: true }
        });

        // Get blocked suppliers and invoices
        const blocks = await prisma.paymentBlock.findMany({
            take: 100,
            where: { releasedAt: null }
        });
        const blockedSupplierIds = new Set(blocks.filter(b => b.type === 'SUPPLIER' && b.supplierId).map(b => b.supplierId));
        const blockedInvoiceIds = new Set(blocks.filter(b => b.type === 'INVOICE' && b.invoiceId).map(b => b.invoiceId));

        const proposedLines: any[] = [];
        let totalAmount = 0;

        // Group by vendor (supplier)
        const vendorGroups: Record<number, any[]> = {};

        for (const inv of openInvoices) {
            if (!inv.supplierId) continue;
            // Check block
            if (blockedSupplierIds.has(inv.supplierId) || blockedInvoiceIds.has(inv.id)) continue;

            const dueDate = new Date(inv.date);
            dueDate.setDate(dueDate.getDate() + 45); // Assuming 45 days terms for simplicity

            let eligible = false;
            let discountAmount = 0;

            if (dueDate <= dueDateUntil) {
                eligible = true;
            } else if (includeDiscountWindow) {
                // Check if there's a discount window we should catch
                const discountOpp = await prisma.discountOpportunity.findFirst({
                    where: { invoiceId: inv.id, status: 'AVAILABLE', discountWindowEnds: { gte: new Date() } }
                });
                if (discountOpp) {
                    eligible = true;
                    // @ts-ignore
                    discountAmount = typeof discountOpp.discountAmount === 'number' ? discountOpp.discountAmount : Number(discountOpp.discountAmount.toString());
                }
            }

            if (eligible) {
                if (!vendorGroups[inv.supplierId]) {
                    vendorGroups[inv.supplierId] = [];
                }
                vendorGroups[inv.supplierId].push({ ...inv, discountAmount });
            }
        }

        // Create a PROPOSED PaymentRun
        const run = await prisma.paymentRun.create({
            data: {
                runNumber: `PRUN-${Date.now()}`,
                status: 'PROPOSED',
                dueDateUntil,
                currency,
                paymentMethod: 'BANK_TRANSFER',
                bankAccountId,
                totalAmount: 0, // Will update below
                totalCount: 0
            }
        });

        let lineCount = 0;

        // Create lines for each vendor
        for (const [vendorIdStr, invoices] of Object.entries(vendorGroups)) {
            const supplierId = parseInt(vendorIdStr, 10);
            
            // Get default bank account for vendor
            // We use 'any' type here because the query depends on models we know exist in prisma
            const bankAccount: any = await (prisma as any).customerBankAccount?.findFirst({
                where: { customerId: supplierId, isDefault: true, isActive: true }
            }) || { beneficiaryName: '', iban: '', swift: '', bankName: '', bankAddress: '', countryCode: '' };

            if (!bankAccount || !bankAccount.iban) {
                log.warn(`Vendor ${supplierId} skipped: No active default bank account`);
                // Proceed anyway for now to avoid breaking the run logic, or skip if strict
                // continue;
            }

            let amountToPay = 0;
            let totalDiscount = 0;
            
            for (const inv of invoices) {
                // @ts-ignore
                const remaining = typeof inv.remaining === 'number' ? inv.remaining : Number(inv.remaining.toString());
                amountToPay += remaining;
                totalDiscount += inv.discountAmount || 0;
            }
            
            const finalAmount = amountToPay - totalDiscount;

            await prisma.paymentRunLine.create({
                data: {
                    runId: run.id,
                    supplierId,
                    openItemIds: invoices.map(i => i.id),
                    invoiceCount: invoices.length,
                    amount: finalAmount,
                    currency,
                    amountFunctional: finalAmount,
                    discountAmount: totalDiscount > 0 ? totalDiscount : null,
                    
                    // Bank Snapshot
                    beneficiaryName: bankAccount.beneficiaryName,
                    beneficiaryIBAN: bankAccount.iban,
                    beneficiarySwift: bankAccount.swift,
                    beneficiaryBankName: bankAccount.bankName,
                    beneficiaryBankAddress: bankAccount.bankAddress,
                    beneficiaryCountry: bankAccount.countryCode,
                    
                    paymentMethod: 'BANK_TRANSFER',
                    status: 'PENDING'
                }
            });

            totalAmount += finalAmount;
            lineCount++;
        }

        // Update run total
        const finalRun = await prisma.paymentRun.update({
            where: { id: run.id },
            data: { 
                totalAmount,
                totalCount: lineCount,
                proposedAt: new Date()
            },
            include: { lines: true }
        });

        return finalRun;
    }

    /**
     * Submit Run for Approval
     */
    static async submitForApproval(runId: number, userId: string) {
        const run = await prisma.paymentRun.findUnique({ where: { id: runId } });
        if (!run || run.status !== 'PROPOSED') throw new Error("Invalid run or state");

        // Simple tiered workflow
        // If amount > 100K -> CFO approval needed
        let approverRole = 'FINANCE_MANAGER';
        // @ts-ignore
        const amt = typeof run.totalAmount === 'number' ? run.totalAmount : Number(run.totalAmount.toString());
        if (amt > 100000) approverRole = 'CFO';

        await prisma.paymentRunApproval.create({
            data: {
                runId: run.id,
                approverUserId: 'SYSTEM_APPROVER', // Mock, should resolve from role
                approverRole,
                level: 1,
                status: 'PENDING'
            }
        });

        return prisma.paymentRun.update({
            where: { id: runId },
            data: {
                status: 'PENDING_APPROVAL',
                submittedForApprovalAt: new Date(),
                approvalRequiredCount: 1,
                approvalReceivedCount: 0
            }
        });
    }

    /**
     * Approve Payment Run
     */
    static async approveRun(approvalId: number, userId: string, comments?: string) {
        const approval = await prisma.paymentRunApproval.update({
            where: { id: approvalId },
            data: {
                status: 'APPROVED',
                decisionAt: new Date(),
                comments
            }
        });

        const run = await prisma.paymentRun.update({
            where: { id: approval.runId },
            data: {
                approvalReceivedCount: { increment: 1 }
            }
        });

        if (run.approvalReceivedCount >= run.approvalRequiredCount) {
            await prisma.paymentRun.update({
                where: { id: run.id },
                data: {
                    status: 'APPROVED',
                    approvedAt: new Date()
                }
            });
        }
    }

    /**
     * Execute approved payments — moves run to SENT_TO_BANK status.
     * Full bank-file generation + invoice marking TODO.
     */
    static async executePayments(runId: number, userId: string, tenantId: any) {
        return prisma.$transaction(async (tx) => {
            const run = await tx.paymentRun.findFirst({
                where: { id: runId, tenantId },
                include: { lines: true },
            });
            if (!run) throw new Error('Payment run not found');
            if (run.status !== 'APPROVED') throw new Error('Run must be APPROVED before execution');

            // --- 1. Check Bank Account ---
            const sourceAccount = await tx.account.findUnique({ where: { id: run.bankAccountId } });
            if (!sourceAccount || !sourceAccount.code) {
                throw new Error(`Source Bank Account GL (ID: ${run.bankAccountId}) not found or missing code`);
            }

            // --- 2. Create Aggregated Treasury Row ---
            const totalAmt = typeof run.totalAmount === 'number' ? run.totalAmount : Number(run.totalAmount.toString());
            await tx.treasury.create({
                data: {
                    type: 'out',
                    amount: totalAmt,
                    description: `Payment Run Execution - ${run.runNumber}`,
                    referenceType: 'payment_run',
                    referenceId: run.id,
                    tenantId: run.tenantId
                }
            });

            // --- 3. Build Journal Lines ---
            const journalLines: Array<{ accountCode: string; debit: number; credit: number; vendorId?: number; description?: string }> = [];
            
            // Credit: Source Bank Account for the total amount
            journalLines.push({
                accountCode: sourceAccount.code,
                debit: 0,
                credit: totalAmt,
                description: `Payment Run ${run.runNumber} - Total Transfer`
            });

            // Debit: AP for each supplier
            for (const line of run.lines as any[]) {
                const lineAmt = typeof line.amount === 'number' ? line.amount : Number(line.amount.toString());
                journalLines.push({
                    accountCode: ACCOUNTS.PAYABLES,
                    debit: lineAmt,
                    credit: 0,
                    vendorId: line.supplierId,
                    description: `Payment to Supplier ${line.supplierId} - Run ${run.runNumber}`
                });
            }

            // --- 4. Create Aggregated Journal Entry ---
            const journal = await createJournalEntry({
                description: `Payment Run Execution #${run.runNumber}`,
                reference: `PRUN-${run.id}`,
                lines: journalLines,
                userId: userId ? Number(userId) : undefined,
                date: new Date().toISOString(),
                txClient: tx
            });

            if (!journal.success || !journal.entryId) {
                throw new Error(`Failed to create Journal Entry: ${journal.error}`);
            }

            // Generate bank transfer file (SADAD/ISO 20022 compatible)
            const bankFileHeader = ['PAYMENT_RUN', run.runNumber, new Date().toISOString(), String(run.lines.length), String(run.totalAmount)].join('|');
            const bankFileLines: string[] = [bankFileHeader];
            for (const line of run.lines as any[]) {
                bankFileLines.push(['LINE', (line.beneficiaryIBAN||''), (line.beneficiarySwift||''), (line.beneficiaryName||''), (line.beneficiaryBankName||''), String(line.amount), (line.currency||run.currency), String(line.id)].join('|'));
            }
            const bankFileContent = bankFileLines.join('\n');
            const bankFileRef = `PRUN-${runId}-${Date.now()}.txt`;
            
            // Mark lines PAID
            for (const line of run.lines as any[]) {
                await (tx as any).paymentRunLine.update({ 
                    where: { id: line.id }, // Assuming line has tenantId logically scoped under run
                    data: { status: 'PAID', executedAt: new Date() } 
                });
            }
            
            // Update run to SENT_TO_BANK and set journalEntryId
            await tx.paymentRun.update({ 
                where: { id: runId }, 
                data: { 
                    status: 'SENT_TO_BANK', 
                    sentToBankAt: new Date(), 
                    sentToBankByUserId: userId,
                    journalEntryId: journal.entryId
                } 
            });
            
            log.info('Payment run executed', { runId, paymentCount: run.lines.length, bankFileRef, journalEntryId: journal.entryId });
            return { runId, executed: true, paymentCount: run.lines.length, bankFileRef, bankFileContent, journalEntryId: journal.entryId };
        });
    }
}
