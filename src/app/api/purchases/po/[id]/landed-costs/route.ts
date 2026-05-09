import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

async function _GET(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const poId = Number((await params).id);
        const costs = await prisma.landedCost.findMany({
            take: 100,
            where: { purchaseOrderId: poId },
            include: { expenseAccount: true }
        });
        
        return NextResponse.json({ data: costs });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  description: z.any().optional(),
  amount: z.number().optional(),
  expenseAccountId: z.union([z.string(), z.number()]).optional(),
  allocationMethod: z.any().optional(),
}).passthrough();

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const poId = Number((await params).id);
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { description, amount, expenseAccountId, allocationMethod } = body;

        const cost = await prisma.landedCost.create({
            data: {
                purchaseOrderId: poId,
                description,
                amount: Number(amount),
                expenseAccountId: Number(expenseAccountId),
                allocationMethod: allocationMethod || 'value',
                isAllocated: false
            }
        });

        return NextResponse.json({ success: true, data: cost });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'FINANCIAL' });
