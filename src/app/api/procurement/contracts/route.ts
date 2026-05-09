import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

async function _GET(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const contracts = await prisma.supplierContract.findMany({
            take: 100,
            include: { supplier: true },
            orderBy: { endDate: 'asc' }
        });
        return NextResponse.json({ data: contracts });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();
        const {
            supplierId,
            title,
            description,
            startDate,
            endDate,
            value,
            currency,
            paymentTerms,
            autoRenew,
            alertDaysBefore
        } = body;

        const contractNo = 'CTR-' + Date.now().toString().slice(-6);

        const newContract = await prisma.supplierContract.create({
            data: {
                contractNo,
                supplierId: Number(supplierId),
                title,
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                value: Number(value),
                currency: currency || 'SAR',
                paymentTerms,
                autoRenew: Boolean(autoRenew),
                alertDaysBefore: Number(alertDaysBefore) || 30
            }
        });

        return NextResponse.json({ success: true, data: newContract });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
