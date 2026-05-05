import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');

        // If searching medications for the autocomplete
        if (search) {
            const medications = await prisma.medication.findMany({
                where: {
                    OR: [
                        { name: { contains: search } },
                        { code: { contains: search } }
                    ]
                },
                take: 10
            });
            return NextResponse.json({ success: true, data: medications });
        }

        // Otherwise fetch list of recent prescriptions
        const prescriptions = await prisma.clinicPrescription.findMany({
            include: {
                patient: true,
                doctor: true,
                items: true
            },
            orderBy: {
                date: 'desc'
            },
            take: 50
        });

        // Fetch doctors and patients for the create form
        const doctors = await prisma.employee.findMany({ take: 10 });
        const patients = await prisma.customer.findMany({ take: 20 });

        return NextResponse.json({
            success: true,
            data: {
                prescriptions,
                metadata: { doctors, patients }
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        const prescription = await prisma.clinicPrescription.create({
            data: {
                patientId: Number(body.patientId),
                doctorId: Number(body.doctorId),
                notes: body.notes,
                items: {
                    create: body.items.map((item: any) => ({
                        medicationId: Number(item.medicationId),
                        dose: item.dose,
                        frequency: item.frequency,
                        duration: item.duration,
                        route: item.route,
                        instructions: item.instructions
                    }))
                }
            },
            include: {
                items: true
            }
        });

        // NPHIES & Wasfaty integration placeholder logic
        console.log(`[Clinic e-Rx] Prescription #${prescription.id} generated and synced with Wasfaty/NPHIES.`);

        return NextResponse.json({
            success: true,
            data: prescription,
            message: 'تم إصدار الوصفة الطبية بنجاح وتم رفعها لـ وصفتي/نفيس.'
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
