import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const id = Number((await params).id);
        const updated = await prisma.paymentRun.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvedAt: new Date()
            }
        });
        return NextResponse.json({ success: true, data: updated });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
