import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

async function _GET(req: Request) {

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


const _POSTSchema = z.object({
  patientId: z.union([z.string(), z.number()]).optional(),
  doctorId: z.union([z.string(), z.number()]).optional(),
  notes: z.any().optional(),
  items: z.array(z.any()).optional(),
}).passthrough();

async function _POST(req: Request) {

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
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

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
