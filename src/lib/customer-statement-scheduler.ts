import { prisma } from './prisma';
import { CustomerStatementPdfEngine } from './customer-statement-pdf';
import { CustomerStatementEmailEngine } from './customer-statement-email';
import { uploadFile } from './cloud-storage';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'CustomerStatementScheduler' });

export class CustomerStatementScheduler {
    
    /**
     * Executes a scheduled run for generating and dispatching statements
     */
    static async runScheduledBatch(frequency: string, dateFrom: Date, dateTo: Date) {
        const batchNumber = `BATCH-${frequency}-${Date.now()}`;
        
        // Find customers matching criteria
        const customers = await prisma.customer.findMany({
            take: 100,
            where: {
                emailStatementsEnabled: true,
                statementFrequency: frequency,
                active: true,
                // Do not send if they have recent bounce issues that are not resolved
                emailDeliveryIssue: null
            }
        });

        if (customers.length === 0) {
            log.info('No customers found for frequency â€” skipping batch', { frequency });
            return;
        }

        // Create a batch record
        const batch = await prisma.statementBatch.create({
            data: {
                batchNumber,
                triggeredBy: `CRON_${frequency}`,
                totalCount: customers.length,
                status: 'PROCESSING',
                dateFrom,
                dateTo,
                filterCriteria: { frequency, active: true, emailStatementsEnabled: true }
            }
        });

        let successCount = 0;
        let failedCount = 0;

        for (const customer of customers) {
            try {
                // 1. Generate PDF
                const { pdfBuffer, hash } = await CustomerStatementPdfEngine.generatePdf(
                    customer.id,
                    dateFrom,
                    dateTo
                );

                // 2. Upload to S3/Storage (Real implementation)
                const uploadResult = await uploadFile(pdfBuffer, `statement_${customer.id}_${Date.now()}.pdf`, 'statements');
                const pdfUrl = uploadResult.url;

                // 3. Dispatch Email
                const emailResult = await CustomerStatementEmailEngine.sendEmail(
                    customer.id,
                    pdfBuffer,
                    dateFrom,
                    dateTo
                );

                // 4. Log Dispatch
                await prisma.statementDispatchLog.create({
                    data: {
                        customerId: customer.id,
                        batchId: batch.id,
                        dateFrom,
                        dateTo,
                        pdfUrl,
                        pdfHash: hash,
                        pdfSizeBytes: pdfBuffer.length,
                        openingBalance: 0, // In reality, fetch from StatementData
                        closingBalance: 0,
                        transactionsCount: 0,
                        totalDebits: 0,
                        totalCredits: 0,
                        deliveryChannel: 'EMAIL',
                        recipientAddress: (customer as any).statementEmail || (customer as any).email || 'unknown',
                        status: emailResult.status,
                        externalMessageId: emailResult.messageId,
                        errorMessage: emailResult.errorMessage,
                        triggeredBy: `CRON_${frequency}`
                    }
                });

                if (emailResult.status === 'SENT') {
                    successCount++;
                } else {
                    failedCount++;
                }

            } catch (error: any) {
                log.error('Error processing customer statement', { customerId: customer.id, err: error.message });
                failedCount++;
                
                await prisma.statementDispatchLog.create({
                    data: {
                        customerId: customer.id,
                        batchId: batch.id,
                        dateFrom,
                        dateTo,
                        openingBalance: 0,
                        closingBalance: 0,
                        transactionsCount: 0,
                        totalDebits: 0,
                        totalCredits: 0,
                        deliveryChannel: 'EMAIL',
                        status: 'FAILED',
                        errorMessage: error.message,
                        triggeredBy: `CRON_${frequency}`
                    }
                });
            }
        }

        // Complete the batch
        await prisma.statementBatch.update({
            where: { id: batch.id },
            data: {
                status: 'COMPLETED',
                successCount,
                failedCount,
                processedCount: customers.length,
                completedAt: new Date()
            }
        });

        log.info('Batch completed', { batchNumber, successCount, failedCount, total: customers.length });
    }
}

