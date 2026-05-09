import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

async function _GET(req: NextRequest) {

    try {
        const mockEntries = [
            {
                id: 1,
                entryNumber: 'ALLOC-101',
                entryDate: new Date().toISOString(),
                description: 'Overhead Allocation Run',
                totalDebit: 150000,
                totalCredit: 150000,
                status: 'posted'
            }
        ];
        return NextResponse.json({ success: true, entries: mockEntries });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function _POST(req: NextRequest) {

    try {
        return NextResponse.json({
            success: true,
            result: [
                { ruleId: 1, status: 'SUCCESS', run: { id: 101, sourceAmount: 150000 } }
            ]
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
