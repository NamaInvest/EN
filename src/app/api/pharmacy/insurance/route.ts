import { getUserFromRequest } from '@/lib/auth';
/**
 * Insurance Claims API — مطالبات التأمين CCHI/NPHIES
 * GET  /api/pharmacy/insurance
 * POST /api/pharmacy/insurance — تقديم مطالبة
 * PUT  /api/pharmacy/insurance — تحديث حالة المطالبة
 */
import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const company = url.searchParams.get('company');

    try {
        const where: any = {};
        if (status) where.status = status;
        if (company) where.insuranceCompany = { contains: company, mode: 'insensitive' };

        // @ts-ignore — new pharmacy model; restart TS server to clear IDE cache
        const claims = await prisma.insuranceClaim.findMany({
            take: 100,
            where,
            include: {
                patient: { select: { nationalId: true, name: true, phone: true } },
            },
            orderBy: { submittedAt: 'desc' },
        });

        // Dashboard summary
        const total = claims.length;
        const approved = claims.filter((c: any) => c.status === 'approved').length;
        const rejected = claims.filter((c: any) => c.status === 'rejected').length;
        const pending = claims.filter((c: any) => c.status === 'submitted').length;

        const totalInsurance = claims.reduce((s: number, c: any) => s + c.insuranceAmount, 0);
        const collected = claims
            .filter((c: any) => c.status === 'paid')
            .reduce((s: number, c: any) => s + c.insuranceAmount, 0);

        // Group by company
        const byCompany: Record<string, any> = {};
        for (const c of claims) {
            if (!byCompany[c.insuranceCompany]) {
                byCompany[c.insuranceCompany] = { total: 0, approved: 0, rejected: 0, amount: 0 };
            }
            byCompany[c.insuranceCompany].total++;
            byCompany[c.insuranceCompany].amount += c.insuranceAmount;
            if (c.status === 'approved' || c.status === 'paid') byCompany[c.insuranceCompany].approved++;
            if (c.status === 'rejected') byCompany[c.insuranceCompany].rejected++;
        }

        return NextResponse.json({
            summary: {
                total, approved, rejected, pending,
                totalInsurance: Math.round(totalInsurance * 100) / 100,
                collected: Math.round(collected * 100) / 100,
                outstanding: Math.round((totalInsurance - collected) * 100) / 100,
            },
            byCompany,
            claims,
        });
    } catch (e: any) {
        return NextResponse.json({ error: 'خطأ في تحميل المطالبات' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();

        // @ts-ignore — new pharmacy model; restart TS server to clear IDE cache
        const claim = await prisma.insuranceClaim.create({
            data: {
                patientId: parseInt(body.patientId),
                prescriptionId: body.prescriptionId ? parseInt(body.prescriptionId) : null,
                salesInvoiceId: body.salesInvoiceId ? parseInt(body.salesInvoiceId) : null,
                insuranceCompany: body.insuranceCompany,
                claimRef: body.claimRef || `CLM-${Date.now()}`,
                totalAmount: parseFloat(body.totalAmount),
                insuranceAmount: parseFloat(body.insuranceAmount),
                patientAmount: parseFloat(body.patientAmount),
                status: 'submitted',
            },
            include: {
                patient: { select: { name: true, nationalId: true } },
            },
        });

        return NextResponse.json(claim, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: 'خطأ في تقديم المطالبة' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const prisma = getPrisma(req as any);
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    try {
        const body = await req.json();
        const { id, status, rejectionReason } = body;

        // @ts-ignore — new pharmacy model; restart TS server to clear IDE cache
        const claim = await prisma.insuranceClaim.update({
            where: { id: parseInt(id) },
            data: {
                status,
                rejectionReason: rejectionReason || null,
                resolvedAt: ['approved', 'rejected', 'paid'].includes(status) ? new Date() : null,
            },
        });

        return NextResponse.json(claim);
    } catch (e: any) {
        return NextResponse.json({ error: 'خطأ في تحديث المطالبة' }, { status: 500 });
    }
}
