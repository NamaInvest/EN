import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const id = Number((await params).id);
        const po = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                details: {
                    include: { product: true }
                },
                supplier: true
            }
        });

        if (!po) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ data: po });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
