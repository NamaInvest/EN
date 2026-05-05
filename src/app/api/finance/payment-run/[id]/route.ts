import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const prisma = getPrisma(req as any);
    try {
        const id = Number(params.id);
        const run = await prisma.paymentRun.findUnique({
            where: { id },
            include: {
                lines: {
                    include: { supplier: true }
                }
            }
        });

        if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ data: run });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
