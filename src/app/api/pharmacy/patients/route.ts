/**
 * Pharmacy Patients API — إدارة المرضى
 * GET  /api/pharmacy/patients?nationalId=1XXXXXXXXX
 * POST /api/pharmacy/patients
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const nationalId = url.searchParams.get('nationalId');
    const phone = url.searchParams.get('phone');
    const search = url.searchParams.get('q');

    try {
        if (nationalId) {
            // Lookup specific patient with full history
            // @ts-ignore — new pharmacy model; restart TS server to clear IDE cache
            const patient = await prisma.pharmacyPatient.findUnique({
                where: { nationalId },
                include: {
                    prescriptions: {
                        include: { items: { include: { drug: true } } },
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    },
                    medicationLogs: {
                        orderBy: { dispensedAt: 'desc' },
                        take: 20,
                    },
                    insuranceClaims: {
                        orderBy: { submittedAt: 'desc' },
                        take: 10,
                    },
                },
            });
            if (!patient) return NextResponse.json({ error: 'المريض غير موجود' }, { status: 404 });
            return NextResponse.json(patient);
        }

        const where: any = {};
        if (phone) where.phone = { contains: phone };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { nationalId: { contains: search } },
                { phone: { contains: search } },
            ];
        }

        // @ts-ignore — new pharmacy model; restart TS server to clear IDE cache
        const patients = await prisma.pharmacyPatient.findMany({
            where,
            select: {
                id: true, nationalId: true, name: true, phone: true,
                insuranceCompany: true, copayPercent: true, allergies: true,
            },
            orderBy: { name: 'asc' },
            take: 50,
        });

        return NextResponse.json({ total: patients.length, patients });
    } catch (e) {
        return NextResponse.json({ error: 'خطأ في البحث' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();

        // @ts-ignore — new pharmacy model; restart TS server to clear IDE cache
        const patient = await prisma.pharmacyPatient.upsert({
            where: { nationalId: body.nationalId },
            update: {
                name: body.name,
                phone: body.phone || null,
                dateOfBirth: body.dateOfBirth || null,
                gender: body.gender || null,
                allergies: body.allergies ? JSON.stringify(body.allergies) : null,
                insuranceCompany: body.insuranceCompany || null,
                insuranceCardNo: body.insuranceCardNo || null,
                copayPercent: parseFloat(body.copayPercent) || 20,
                notes: body.notes || null,
            },
            create: {
                nationalId: body.nationalId,
                name: body.name,
                nameEn: body.nameEn || null,
                phone: body.phone || null,
                dateOfBirth: body.dateOfBirth || null,
                gender: body.gender || null,
                allergies: body.allergies ? JSON.stringify(body.allergies) : null,
                insuranceCompany: body.insuranceCompany || null,
                insuranceCardNo: body.insuranceCardNo || null,
                copayPercent: parseFloat(body.copayPercent) || 20,
                notes: body.notes || null,
            },
        });

        return NextResponse.json(patient, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: 'خطأ في حفظ المريض' }, { status: 500 });
    }
}
