import { NextResponse } from 'next/server';

export async function GET(req: Request) {

    try {
        const routes = [
            { id: 'RT-2026-0506-A', region: 'North Riyadh', driver: 'Sami K.', vehicle: 'Van 04', stops: 12, status: 'DISPATCHED', estCompletion: '2026-05-06 15:30' },
            { id: 'RT-2026-0506-B', region: 'East Riyadh', driver: 'Unassigned', vehicle: 'Truck 01', stops: 5, status: 'PLANNING', estCompletion: '-' },
        ];

        return NextResponse.json({ routes });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
