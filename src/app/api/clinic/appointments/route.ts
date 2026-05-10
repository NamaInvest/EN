import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'clinic.appointments' });

const prisma = new PrismaClient();

async function _GET(req: Request) {

    try {
        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get('date');

        let whereClause = {};
        if (dateParam) {
            const startOfDay = new Date(dateParam);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(dateParam);
            endOfDay.setHours(23, 59, 59, 999);

            whereClause = {
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            };
        }

        const appointments = await prisma.appointment.findMany({ take: 100,
            where: whereClause,
            include: {
                patient: true,
                doctor: true,
                room: true
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        // Also fetch doctors, patients, rooms for the UI dropdowns
        const doctors = await prisma.employee.findMany({
            where: {
                // In a real app, filter by role = DOCTOR
            },
            take: 10
        });

        const patients = await prisma.customer.findMany({
            take: 20
        });

        const rooms = await prisma.clinicRoom.findMany({ take: 100 });

        return NextResponse.json({
            success: true,
            data: {
                appointments,
                metadata: {
                    doctors,
                    patients,
                    rooms
                }
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}


const _POSTSchema = z.object({
  patientId: z.union([z.string(), z.number()]).optional(),
  doctorId: z.union([z.string(), z.number()]).optional(),
  roomId: z.union([z.string(), z.number()]).optional(),
  date: z.string().optional(),
  startTime: z.any().optional(),
  duration: z.any().optional(),
  type: z.any().optional(),
  notes: z.any().optional(),
}).passthrough();

async function _POST(req: Request) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const appointment = await prisma.appointment.create({
            data: {
                patientId: Number(body.patientId),
                doctorId: Number(body.doctorId),
                roomId: body.roomId ? Number(body.roomId) : null,
                date: new Date(body.date),
                startTime: body.startTime,
                duration: body.duration || 15,
                type: body.type || 'CONSULT',
                status: 'SCHEDULED',
                notes: body.notes
            },
            include: {
                patient: true,
                doctor: true,
                room: true
            }
        });

        // SMS / WhatsApp reminder placeholder logic
        log.info(`[Clinic] Scheduled Appointment for Patient #${appointment.patientId} at ${appointment.startTime}. Reminder scheduled.`);

        return NextResponse.json({
            success: true,
            data: appointment,
            message: 'تم حجز الموعد بنجاح'
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
