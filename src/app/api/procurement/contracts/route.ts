import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'procurement.contracts' });

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


const _POSTSchema = z.object({
  supplierId: z.union([z.string(), z.number()]).optional(),
  title: z.any().optional(),
  description: z.any().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  value: z.any().optional(),
  currency: z.any().optional(),
  paymentTerms: z.any().optional(),
  autoRenew: z.any().optional(),
  alertDaysBefore: z.union([z.string(), z.number()]).optional(),
}).passthrough();

async function _POST(req: Request) {

    const prisma = getPrisma(req as any);
    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
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
