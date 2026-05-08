import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

export async function POST(req: Request, { params }: { params: Promise<{ id: string, costId: string }> }) {

  const { id, costId: costIdStr } = await params;
    const prisma = getPrisma(req as any);
    try {
        const poId = Number(id);
        const costId = Number(costIdStr);

        const cost = await prisma.landedCost.findUnique({
            where: { id: costId }
        });

        if (!cost || cost.isAllocated) {
            return NextResponse.json({ error: 'Cost not found or already allocated' }, { status: 400 });
        }

        const po = await prisma.purchaseOrder.findUnique({
            where: { id: poId },
            include: { details: { include: { product: true } } }
        });

        if (!po || !po.details.length) {
            return NextResponse.json({ error: 'PO not found or has no items' }, { status: 400 });
        }

        // Calculate total factor based on method
        let totalFactor = 0;
        po.details.forEach(d => {
            if (cost.allocationMethod === 'value') {
                totalFactor += n(d.price) * n(d.quantity);
            } else if (cost.allocationMethod === 'quantity') {
                totalFactor += n(d.quantity);
            } else {
                // Default to value if unknown method
                totalFactor += n(d.price) * n(d.quantity);
            }
        });

        if (totalFactor === 0) totalFactor = 1;

        // Allocate cost and update buyPrice (as a simple average cost uplift)
        const updatePromises = po.details.map(d => {
            let factor = 0;
            if (cost.allocationMethod === 'value') {
                factor = n(d.price) * n(d.quantity);
            } else if (cost.allocationMethod === 'quantity') {
                factor = n(d.quantity);
            } else {
                factor = n(d.price) * n(d.quantity);
            }

            const allocatedAmount = (factor / totalFactor) * n(cost.amount);
            const qty = n(d.quantity);
            const unitUplift = qty > 0 ? allocatedAmount / qty : 0;

            // In a real system, this should add a record to a cost layer.
            // Here we update the product's average buyPrice as a simplification.
            return prisma.product.update({
                where: { id: d.productId },
                data: {
                    buyPrice: { increment: unitUplift }
                }
            });
        });

        await prisma.$transaction([
            ...updatePromises,
            prisma.landedCost.update({
                where: { id: costId },
                data: { isAllocated: true }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
