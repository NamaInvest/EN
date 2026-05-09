import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

async function _POST(req: Request) {

    const prisma = getPrisma(req);
  try {
    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ error: 'رقم الجوال مطلوب' }, { status: 400 });

    const tenant = await prisma.customer.findFirst({
      where: { phone, type: 2 } // 2 is typically used for tenants
    });

    if (!tenant) return NextResponse.json({ error: 'عذراً لا يوجد مستأجر مسجل بهذا الرقم' }, { status: 404 });

    const leases = await prisma.leaseContract.findMany({
            take: 100,
      where: { tenantId: tenant.id },
      include: {
        unit: { include: { property: true } },
        installments: true
      }
    });

    return NextResponse.json({ tenant, leases });
  } catch (error: any) {
    console.error('Portal Auth Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
