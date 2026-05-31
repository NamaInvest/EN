import { FinancialTxClient } from '@/lib/db/transaction';
import { createJournalEntry } from '@/lib/auto-journal';
import { traceFinancialOperation } from '@/lib/observability/financial-trace';
import { logger } from '@/lib/observability/logger';

const log = logger.child({ service: 'treasury-posting' });

export class TreasuryPostingService {
    /**
     * Creates a treasury entry and its corresponding journal entry atomically.
     * This service strictly requires a FinancialTxClient to ensure Atomicity.
     */
    static async createTreasuryEntry(
        tx: FinancialTxClient,
        body: any,
        userId: number | null,
        branchId: number | null,
        overrideContext?: any
    ) {
        const tenantId = body.tenantId || 'default';
        const postingDate = body.date ? new Date(body.date) : new Date();

        // Phase 10: determine operation type early for trace
        // type 'in' = Receipt (money coming in), 'out' = Payment (money going out)
        const traceOperationType = body.type === 'in' ? 'TREASURY_RECEIPT' : 'TREASURY_PAYMENT';

        // ── Period Lock Enforcement ────────────────────────────────────────
        const { assertPeriodWritable } = await import('@/lib/governance/period-lock');
        await assertPeriodWritable({
            tenantId,
            postingDate,
            operationType: traceOperationType,
            module: 'treasury',
            actor: userId ? String(userId) : 'SYSTEM',
            overrideContext
        });
        // ────────────────────────────────────────────────────────────────────

        return traceFinancialOperation(
            {
                operationType: traceOperationType,
                module: 'treasury',
                overrideUsed: !!overrideContext,
                // aggregateId filled in after treasury record created
            },
            async (_traceId) => {
                // Strict Validation for Manual Entries
                if (body.referenceType === 'manual') {
                    if (!body.counterpartyAccountId) {
                        throw new Error('Manual treasury entry requires counterpartyAccountId');
                    }
                    if (!body.treasuryAccountId) {
                        throw new Error('Manual treasury entry requires treasuryAccountId');
                    }
                }

                const treasuryAccountId = body.treasuryAccountId;
                const counterpartyAccountId = body.counterpartyAccountId;

                const newTreasury = await tx.treasury.create({
                    data: {
                        tenantId,
                        date: postingDate,
                        type: body.type,
                        amount: body.amount,
                        description: body.description || null,
                        referenceType: body.referenceType || 'manual',
                        referenceId: body.referenceId ? Number(body.referenceId) : null,
                        userId: userId,
                        branchId: branchId
                    },
                });

                // --- SLA Sub-Ledger: Auto matching of cash payments to posted invoices ---
                const refType = body.referenceType || 'manual';
                const refId = body.referenceId ? Number(body.referenceId) : null;
                const isCustomer = body.type === 'in' && (refType === 'sale' || refType === 'sale_payment');
                const isVendor = body.type === 'out' && (refType === 'purchase' || refType === 'purchase_payment');

                if ((isCustomer || isVendor) && refId) {
                    let partnerId: number | null = null;
                    let docType = '';
                    if (isCustomer) {
                        const inv = await tx.salesInvoice.findUnique({
                            where: { id: refId },
                            select: { customerId: true }
                        });
                        if (inv && inv.customerId) {
                            partnerId = Number(inv.customerId);
                            docType = 'sales_invoice';
                        }
                    } else if (isVendor) {
                        const inv = await tx.purchaseInvoice.findUnique({
                            where: { id: refId },
                            select: { supplierId: true }
                        });
                        if (inv && inv.supplierId) {
                            partnerId = Number(inv.supplierId);
                            docType = 'purchase_invoice';
                        }
                    }

                    if (partnerId) {
                        const { OpenItemsEngine } = await import('@/lib/open-items');
                        
                        // 1. Create a payment OpenItem for this Treasury transaction
                        const paymentOpenItem = await OpenItemsEngine.createOpenItem({
                            partyId: partnerId,
                            partyType: isCustomer ? 'customer' : 'vendor',
                            documentType: 'payment',
                            documentId: newTreasury.id,
                            documentNumber: `TREAS-${newTreasury.id}`,
                            documentDate: postingDate,
                            amount: Number(body.amount),
                            tenantId,
                            dueDate: postingDate,
                        }, tx);

                        // 2. Find the invoice OpenItem
                        const invoiceOpenItem = await tx.openItem.findFirst({
                            where: {
                                tenantId,
                                partyId: partnerId,
                                partyType: isCustomer ? 'customer' : 'vendor',
                                documentType: docType,
                                documentId: refId,
                                status: { in: ['OPEN', 'PARTIAL'] },
                            }
                        });

                        // 3. Match them if outstanding balance exists
                        if (invoiceOpenItem && Number(invoiceOpenItem.openAmount) > 0) {
                            const allocAmount = Math.min(Number(body.amount), Number(invoiceOpenItem.openAmount));
                            await OpenItemsEngine.applyPayment(
                                paymentOpenItem.id,
                                [{ invoiceId: invoiceOpenItem.id, amount: allocAmount }],
                                userId ? String(userId) : 'system-user',
                                tenantId,
                                tx
                            );
                        }
                    }
                }

                log.info('Treasury record created', {
                    operationType: traceOperationType,
                    aggregateId: `TREAS-${newTreasury.id}`,  // non-sensitive reference
                    tenantId,
                });

                // Journal Entry Binding if Accounts are Explicit
                if (treasuryAccountId && counterpartyAccountId) {
                    const treasuryAccount = await tx.account.findUnique({ where: { id: Number(treasuryAccountId) }, select: { code: true } });
                    const counterpartyAccount = await tx.account.findUnique({ where: { id: Number(counterpartyAccountId) }, select: { code: true } });

                    if (!treasuryAccount || !counterpartyAccount) {
                        throw new Error("Invalid account IDs provided for treasury or counterparty.");
                    }

                    const journalLines = [];
                    const amountNum = typeof body.amount === 'number' ? body.amount : parseFloat(body.amount as string);

                    if (body.type === 'in') {
                        // Receipt: Debit Treasury, Credit Counterparty
                        journalLines.push({ accountCode: treasuryAccount.code, debit: amountNum, credit: 0, description: body.description || 'Treasury Receipt' });
                        journalLines.push({ accountCode: counterpartyAccount.code, debit: 0, credit: amountNum, description: body.description || 'Treasury Receipt' });
                    } else if (body.type === 'out') {
                        // Payment: Debit Counterparty, Credit Treasury
                        journalLines.push({ accountCode: counterpartyAccount.code, debit: amountNum, credit: 0, description: body.description || 'Treasury Payment' });
                        journalLines.push({ accountCode: treasuryAccount.code, debit: 0, credit: amountNum, description: body.description || 'Treasury Payment' });
                    }

                    await createJournalEntry({
                        description: body.description || `Treasury ${body.type === 'in' ? 'Receipt' : 'Payment'}`,
                        reference: `TREAS-${newTreasury.id}`,
                        lines: journalLines,
                        userId: userId || undefined,
                        branchId: branchId || undefined,
                        date: postingDate.toISOString(),
                        txClient: tx,
                        overrideContext,
                        // Phase 10: pass treasury operation type to createJournalEntry for richer trace
                        operationType: traceOperationType,
                        module: 'treasury',
                    });
                } else if (body.referenceType === 'manual') {
                    throw new Error("Manual treasury entries strictly require both treasury and counterparty accounts.");
                }

                return newTreasury;
            }
        );
    }
}
