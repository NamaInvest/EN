import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

async function _GET(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    const prisma = getPrisma(req as any);
    try {
        const id = Number((await params).id);
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

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });
