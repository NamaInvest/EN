import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

        const mockBudgets = [
            {
                id: 1,
                name: `Annual Budget ${year}`,
                year,
                status: 'APPROVED',
                totalAmount: 5000000,
                consumedAmount: 1250000,
                createdAt: new Date().toISOString(),
                lines: [
                    { id: 1, account: { code: '101', name: 'Operations' }, amount: 2000000, consumed: 500000 },
                    { id: 2, account: { code: '202', name: 'Marketing' }, amount: 1000000, consumed: 350000 }
                ]
            }
        ];

        return NextResponse.json({ success: true, budgets: mockBudgets });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;

        switch (action) {
            case 'check': {
                return NextResponse.json({ success: true, result: { available: true, remaining: 10000 } });
            }
            case 'variance': {
                return NextResponse.json({ success: true, variance: [] });
            }
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
