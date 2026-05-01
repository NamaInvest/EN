import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const prisma = getPrisma(request);
    try {
        const checks = await prisma.qualityCheck.findMany({
            include: {
                order: true
            },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(checks);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch quality checks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const { manufacturingOrderId, inspectedQuantity, passedQuantity, failedQuantity, notes, inspectorId } = body;

        // Ensure order exists
        const order = await prisma.manufacturingOrder.findUnique({ where: { id: parseInt(manufacturingOrderId) } });
        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        const check = await prisma.qualityCheck.create({
            data: {
                manufacturingOrderId: parseInt(manufacturingOrderId),
                // inspectorId: inspectorId ? parseInt(inspectorId) : null,
                // checkDate: new Date(),
                inspectedQuantity: parseFloat(inspectedQuantity) || 0,
                passedQuantity: parseFloat(passedQuantity) || 0,
                failedQuantity: parseFloat(failedQuantity) || 0,
                status: parseFloat(failedQuantity) > 0 ? 'rejected' : 'passed',
                notes
            }
        });

        // Add Cost of scrap if any
        if (parseFloat(failedQuantity) > 0) {
            const unitCost = order.totalCost / order.quantityToProduce;
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
                where: { id: order.id },
                data: { totalCost: order.totalCost + scrapCost }
            });
        }

        return NextResponse.json({ message: 'تم إدخال فحص الجودة بنجاح', data: check });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to log quality check' }, { status: 500 });
    }
}
