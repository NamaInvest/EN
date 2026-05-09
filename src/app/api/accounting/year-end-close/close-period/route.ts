import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

async function _POST(req: NextRequest) {

    try {
        const body = await req.json();
        const { periodId } = body;

        // Logic to close period and transfer balances
        return NextResponse.json({
            status: 'success',
            message: `Period ${periodId || 'current'} closed successfully`,
            lockedAt: new Date()
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL' });
