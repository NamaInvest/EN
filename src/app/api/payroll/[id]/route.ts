import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'payroll.id' });
async function _GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const invoice = await prisma.payrollInvoice.findUnique({
            where: { id },
            include: {
                employee: true,
                details: true
            }
        });

        if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json(invoice);
    } catch (error: any) {
        log.error("Payslip GET error:", error);
        return NextResponse.json({ error: 'Failed to fetch payslip' }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });
