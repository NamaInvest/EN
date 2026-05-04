import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { segment, dateFrom, dateTo, templateId, userId } = body;

        let whereClause: any = {
            type: { in: [0, 2] },
        };

        if (segment === 'vip') {
            whereClause.creditLimit = { gt: 50000 };
        } else if (segment === 'overdue') {
            whereClause.balance = { gt: 0 };
        }

        const count = await prisma.customer.count({
            where: whereClause
        });

        if (count === 0) {
            return NextResponse.json({ error: 'No customers match the given criteria.' }, { status: 400 });
        }

        const batchNumber = `BCH-${Date.now()}`;

        const batch = await prisma.statementBatch.create({
            data: {
                batchNumber,
                triggeredBy: 'MANUAL_BULK',
                startedByUserId: userId ? String(userId) : null,
                totalCount: count,
                processedCount: 0,
                status: 'PROCESSING',
                filterCriteria: { segment, dateFrom, dateTo },
                templateId: templateId ? parseInt(templateId, 10) : null,
                dateFrom: new Date(dateFrom),
                dateTo: new Date(dateTo)
            }
        });

        // In a real application, you'd queue a background job here (e.g., BullMQ)
        // to generate PDFs and send emails asynchronously.
        // For demonstration, we'll mark it as completed after returning.
        
        // Simulate async work
        setTimeout(async () => {
            await prisma.statementBatch.update({
                where: { id: batch.id },
                data: {
                    status: 'COMPLETED',
                    processedCount: count,
                    successCount: count,
                    completedAt: new Date()
                }
            });
        }, 5000);

        return NextResponse.json({ batch });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
