import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
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

        const appointments = await prisma.appointment.findMany({
            take: 100,
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

        const rooms = await prisma.clinicRoom.findMany();

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

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
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
        console.log(`[Clinic] Scheduled Appointment for Patient #${appointment.patientId} at ${appointment.startTime}. Reminder scheduled.`);

        return NextResponse.json({
            success: true,
            data: appointment,
            message: 'تم حجز الموعد بنجاح'
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
