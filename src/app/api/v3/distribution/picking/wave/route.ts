import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const waves = [
            { id: 'WAVE-1001', date: '2026-05-06', type: 'Zone Picking', totalOrders: 15, status: 'IN_PROGRESS', progress: 40, picker: 'Ali H.' },
            { id: 'WAVE-1002', date: '2026-05-06', type: 'Batch Picking', totalOrders: 25, status: 'PENDING', progress: 0, picker: 'Unassigned' },
        ];

        return NextResponse.json({ waves });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
