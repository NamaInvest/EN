import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const prescriptions = [
            { id: 'ERX-2026-001', patient: 'Ahmed Ali', doctor: 'Dr. Sarah', date: '2026-05-06', status: 'ACTIVE', medications: ['Amoxicillin 500mg', 'Paracetamol 500mg'] },
            { id: 'ERX-2026-002', patient: 'Mohammed Omar', doctor: 'Dr. Khalid', date: '2026-05-05', status: 'DISPENSED', medications: ['Ibuprofen 400mg'] },
        ];

        return NextResponse.json({ prescriptions });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
