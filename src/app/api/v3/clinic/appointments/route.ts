import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'v3.clinic.appointments' });

async function _GET(req: Request) {

    try {
        // Mock data for Clinic Appointments
        const appointments = [
            { id: 1, patient: 'Ahmed Ali', doctor: 'Dr. Sarah', time: '09:00 AM', status: 'WAITING', type: 'Consultation' },
            { id: 2, patient: 'Mohammed Omar', doctor: 'Dr. Khalid', time: '09:30 AM', status: 'IN_PROGRESS', type: 'Follow-up' },
            { id: 3, patient: 'Fatima Saad', doctor: 'Dr. Sarah', time: '10:00 AM', status: 'SCHEDULED', type: 'Consultation' },
        ];

        return NextResponse.json({ appointments });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function _POST(req: Request) {

    try {
        const body = await req.json();
        return NextResponse.json({ success: true, appointment: { id: 4, ...body, status: 'SCHEDULED' } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
