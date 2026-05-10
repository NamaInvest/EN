import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { CustomerStatementEngine } from '@/lib/customer-statement';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.customers.id.statement' });

async function _GET(req: Request, { params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;
    try {
        const { searchParams } = new URL(req.url);
        const fromDateStr = searchParams.get('from');
        const toDateStr = searchParams.get('to');
        const openOnly = searchParams.get('openOnly') === 'true';

        if (!fromDateStr || !toDateStr) {
            return NextResponse.json({ error: 'Missing from or to dates' }, { status: 400 });
        }

        const customerId = parseInt((await params).id, 10);
        
        const statement = await CustomerStatementEngine.generateStatement(
            customerId,
            new Date(fromDateStr),
            new Date(toDateStr),
            openOnly
        );

        return NextResponse.json({ success: true, statement });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }, context) => _GET(req as any, context), { rateLimit: 'DEFAULT' });
