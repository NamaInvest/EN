import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'manufacturing.quality-control' });
async function _GET(request: Request) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);
    try {
        const checks = await prisma.qualityCheck.findMany({ take: 100,
            include: {
                order: true
            },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(checks);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch quality checks' }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  manufacturingOrderId: z.union([z.string(), z.number()]).optional(),
  inspectedQuantity: z.number().optional(),
  passedQuantity: z.number().optional(),
  failedQuantity: z.number().optional(),
  notes: z.any().optional(),
  inspectorId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(request: Request) {
    const tenantId = requireTenantId(request as any);
    const prisma = getPrisma(request);
    try {
        const body = await request.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { manufacturingOrderId, inspectedQuantity, passedQuantity, failedQuantity, notes, inspectorId } = body;

        // Ensure order exists
        const order = await prisma.manufacturingOrder.findUnique({ where: { id: parseInt(manufacturingOrderId) , tenantId } });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        const parsedInspected = parseFloat(inspectedQuantity) || 0;
        const parsedPassed = parseFloat(passedQuantity) || 0;
        const parsedFailed = parseFloat(failedQuantity) || 0;

        const check = await prisma.qualityCheck.create({
            data: {
                manufacturingOrderId: parseInt(manufacturingOrderId),
                inspectorName: inspectorId ? `Inspector ${inspectorId}` : 'System',
                checkType: 'final_inspection',
                status: parsedFailed > 0 ? 'fail' : 'pass',
                notes: `Inspected: ${parsedInspected}, Passed: ${parsedPassed}, Failed: ${parsedFailed}. ${notes || ''}`
            }
        });

        // Add Cost of scrap if any
        if (parseFloat(failedQuantity) > 0) {
            const unitCost = n(order.totalCost) / n(order.quantityToProduce);
            const scrapCost = unitCost * parseFloat(failedQuantity);
            await prisma.manufacturingCost.create({
                data: {
                    manufacturingOrderId: order.id,
                    costType: 'scrap',
                    amount: scrapCost,
                    description: `تكلفة هدر جودة: ${failedQuantity} وحدة معيبة`
                }
            });
            // Update order total cost
            await prisma.manufacturingOrder.update({
                where: { id: order.id , tenantId },
                data: { totalCost: n(order.totalCost) + scrapCost }
            });

            // Post Scrap Journal Entry
            const { createJournalEntry, ACCOUNTS } = require('@/lib/auto-journal');
            await createJournalEntry({
                description: `إثبات تكلفة هدر (Scrap) لأمر التصنيع ${order.orderNumber} - فحص جودة`,
                reference: order.orderNumber,
                lines: [
                    { accountCode: ACCOUNTS.MFG_VARIANCE, debit: scrapCost, credit: 0, description: 'تكلفة هدر جودة' },
                    { accountCode: ACCOUNTS.WIP, debit: 0, credit: scrapCost, description: 'خفض حساب تحت التشغيل بسبب التالف' }
                ],
                status: 'posted'
            });
        }

        return NextResponse.json({ message: 'تم إدخال فحص الجودة بنجاح', data: check });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to log quality check' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
