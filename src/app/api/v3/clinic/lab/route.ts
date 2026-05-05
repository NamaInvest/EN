import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const tests = [
            { id: 'LAB-2026-001', patient: 'Ahmed Ali', doctor: 'Dr. Sarah', testName: 'Complete Blood Count (CBC)', date: '2026-05-06', status: 'PENDING_SAMPLE' },
            { id: 'LAB-2026-002', patient: 'Mohammed Omar', doctor: 'Dr. Khalid', testName: 'Lipid Profile', date: '2026-05-05', status: 'COMPLETED', result: 'Normal' },
        ];

        return NextResponse.json({ tests });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
