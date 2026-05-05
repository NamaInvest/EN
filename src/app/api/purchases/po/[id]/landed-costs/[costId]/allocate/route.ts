import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: { id: string, costId: string } }) {
    const prisma = getPrisma(req as any);
    try {
        const poId = Number(params.id);
        const costId = Number(params.costId);

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
                totalFactor += d.price * d.quantity;
            } else if (cost.allocationMethod === 'quantity') {
                totalFactor += d.quantity;
            } else {
                // Default to value if unknown method
                totalFactor += d.price * d.quantity;
            }
        });

        if (totalFactor === 0) totalFactor = 1;

        // Allocate cost and update buyPrice (as a simple average cost uplift)
        const updatePromises = po.details.map(d => {
            let factor = 0;
            if (cost.allocationMethod === 'value') {
                factor = d.price * d.quantity;
            } else if (cost.allocationMethod === 'quantity') {
                factor = d.quantity;
            } else {
                factor = d.price * d.quantity;
            }

            const allocatedAmount = (factor / totalFactor) * cost.amount;
            const unitUplift = d.quantity > 0 ? allocatedAmount / d.quantity : 0;

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
