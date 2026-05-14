import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.customer-statements.bulk.run' });


const _POSTSchema = z.object({
  segment: z.any().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  templateId: z.union([z.string(), z.number()]).optional(),
  userId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { segment, dateFrom, dateTo, templateId, userId } = body;

        let customerWhere: any = { active: true };
        if (segment === 'OVERDUE') {
            customerWhere = { ...customerWhere, salesInvoices: { some: { remaining: { gt: 0 } } } };
        } else if (segment === 'VIP') {
            customerWhere = { ...customerWhere, customerType: 'VIP' };
        }

        const customers = await prisma.customer.findMany({ take: 100,
            where: customerWhere,
            select: { id: true, name: true }
        });

        if (customers.length === 0) {
            return NextResponse.json({ error: 'No customers found for this segment.' }, { status: 400 });
        }

        // Create the Batch record
        const batch = await prisma.statementBatch.create({
            data: {
                batchNumber: `BCH-${Date.now()}`,
                triggeredBy: 'MANUAL_BULK',
                dateFrom: new Date(dateFrom),
                dateTo: new Date(dateTo),
                templateId: templateId ? Number(templateId) : null,
                totalCount: customers.length,
                status: 'PROCESSING',
                startedByUserId: userId ? String(userId) : 'system',
                filterCriteria: { segment }
            }
        });

        // Background simulation for Dunning/Email dispatch
        // In a real system, this would push to a Redis queue like BullMQ
        setTimeout(async () => {
            let successCount = 0;
            let failedCount = 0;

            for (const customer of customers) {
                try {
                    // Create the log
                    await prisma.statementDispatchLog.create({
                        data: {
                            batchId: batch.id,
                            customerId: customer.id,
                            deliveryChannel: 'EMAIL',
                            status: 'SENT',
                            sentAt: new Date(),
                            dateFrom: new Date(dateFrom),
                            dateTo: new Date(dateTo),
                            openingBalance: 0,
                            closingBalance: 0,
                            transactionsCount: 0,
                            totalDebits: 0,
                            totalCredits: 0,
                            triggeredBy: 'BULK'
                        }
                    });
                    successCount++;
                } catch (e: any) {
                    log.error('src/app/api/accounting/customer-statements/bulk/run/route.ts', { error: e instanceof Error ? e.message : e });

                    failedCount++;
                }
            }

            // Mark batch as completed
            await prisma.statementBatch.update({
                where: { id: batch.id },
                data: {
                    status: 'COMPLETED',
                    successCount,
                    failedCount,
                    completedAt: new Date()
                }
            });
        }, 2000); // simulated async background process

        return NextResponse.json({ 
            success: true, 
            message: 'Batch processing started in the background.',
            batchId: batch.id,
            customerCount: customers.length
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
