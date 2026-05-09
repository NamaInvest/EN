import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
async function _GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    const prisma = getPrisma(request);
    try {
        const installments = await prisma.installment.findMany({
            take: 100, include: { customer: { select: { id: true, name: true, phone: true,  } }, payments: true }, orderBy: { id: 'desc' } });
        return NextResponse.json(installments);
    } catch (e: any) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

async function _POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});

    // Auth guard
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    const _auth = _getAuth(request);
    if (!_auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const totalAmount = parseFloat(body.totalAmount) || 0;
        const count = parseInt(body.installmentCount) || 1;
        const paymentAmount = totalAmount / count;

        const payments = Array.from({ length: count }, (_, i) => {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i + 1);
            return { paymentDate: new Date().toISOString().split('T')[0], dueDate: dueDate.toISOString().split('T')[0], amount: Math.round(paymentAmount * 100) / 100, paid: false };
        });

        const installment = await prisma.installment.create({
            data: {
                invoiceId: body.invoiceId, customerId: body.customerId,
                totalAmount, paidAmount: 0, remaining: totalAmount, installmentCount: count,
                status: 'active',
                payments: { create: payments },
            },
            include: { payments: true, customer: { select: { id: true, name: true, phone: true,  } } },
        });
        return NextResponse.json(installment, { status: 201 });
    } catch (e: any) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
