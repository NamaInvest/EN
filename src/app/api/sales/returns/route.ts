import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const returns = await prisma.salesReturn.findMany({
            take: 100,
            orderBy: { id: 'desc' },
            include: {
                details: {
                    include: { product: { select: { name: true } } }
                }
            }
        });
        return NextResponse.json(returns);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  originalInvoiceId: z.union([z.string(), z.number()]).optional(),
  customerId: z.union([z.string(), z.number()]).optional(),
  details: z.array(z.any()).optional(),
  restockingFee: z.any().optional(),
  notes: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { originalInvoiceId, customerId, details, restockingFee, notes } = body;

        // Note: in a real environment, we'd pull these from the original invoice
        const total = details.reduce((sum: number, item: any) => sum + item.quantity * item.price, 0);

        const rma = await prisma.salesReturn.create({
            data: {
                returnNo: Math.floor(Math.random() * 1000000), // Should use numbering engine
                originalInvoiceId: parseInt(originalInvoiceId) || null,
                customerId: parseInt(customerId) || null,
                subtotal: total,
                total: total,
                restockingFee: parseFloat(restockingFee) || 0,
                notes,
                status: 'REQUESTED',
                details: {
                    create: details.map((d: any) => ({
                        productId: parseInt(d.productId),
                        quantity: parseFloat(d.quantity),
                        price: parseFloat(d.price),
                        reason: d.reason,
                        condition: d.condition || 'UNKNOWN',
                        total: parseFloat(d.quantity) * parseFloat(d.price)
                    }))
                }
            },
            include: { details: true }
        });

        // Log state
        await prisma.documentStateLog.create({
            data: {
                entityType: 'RMA',
                entityId: rma.id,
                fromState: 'NEW',
                toState: 'REQUESTED',
                reason: 'Customer initiated RMA'
            }
        });

        return NextResponse.json(rma, { status: 201 });
    } catch (e: any) {
        console.error('RMA Create Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
