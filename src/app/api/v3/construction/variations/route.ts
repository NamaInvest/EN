import { NextResponse } from 'next/server';

export async function GET(req: Request) {

    try {
        const variations = [
            { id: 'VO-2026-001', project: 'Riyadh Tower Phase 1', description: 'Additional lighting fixtures on floor 5', amount: 45000, status: 'APPROVED', date: '2026-05-01' },
            { id: 'VO-2026-002', project: 'Jeddah Mall Renovation', description: 'Change of flooring material', amount: 120000, status: 'PENDING_APPROVAL', date: '2026-05-04' },
        ];

        return NextResponse.json({ variations });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
