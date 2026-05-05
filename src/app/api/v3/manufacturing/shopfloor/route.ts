import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const machines = [
            { id: 'M-01', name: 'CNC Machine 1', status: 'RUNNING', currentOrder: 'MO-9921', operator: 'Kamal T.', performance: 95 },
            { id: 'M-02', name: 'Assembly Line A', status: 'IDLE', currentOrder: '-', operator: '-', performance: 0 },
            { id: 'M-03', name: 'Packaging Unit', status: 'DOWN', currentOrder: 'MO-9920', operator: 'Saad M.', performance: 45, error: 'Sensor Fault' },
        ];

        return NextResponse.json({ machines });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
