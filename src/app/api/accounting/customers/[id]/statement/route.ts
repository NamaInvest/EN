import { NextResponse } from 'next/server';
import { CustomerStatementEngine } from '@/lib/customer-statement';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(req.url);
        const fromDateStr = searchParams.get('from');
        const toDateStr = searchParams.get('to');
        const openOnly = searchParams.get('openOnly') === 'true';

        if (!fromDateStr || !toDateStr) {
            return NextResponse.json({ error: 'Missing from or to dates' }, { status: 400 });
        }

        const customerId = parseInt(params.id, 10);
        
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
