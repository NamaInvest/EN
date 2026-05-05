import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const billings = [
            { id: 'PB-2026-001', project: 'Riyadh Tower Phase 1', certificateNo: 'IPC-01', period: 'Apr 2026', totalWorkDone: 1500000, retentionPercentage: 10, retentionAmount: 150000, netPayable: 1350000, status: 'CERTIFIED' },
            { id: 'PB-2026-002', project: 'Jeddah Mall Renovation', certificateNo: 'IPC-03', period: 'May 2026', totalWorkDone: 800000, retentionPercentage: 5, retentionAmount: 40000, netPayable: 760000, status: 'DRAFT' },
        ];

        return NextResponse.json({ billings });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
