import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { n } from '@/lib/decimal-utils';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: NextRequest) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const items = await prisma.maintenance.findMany({
            take: 100, orderBy: { id: 'desc' } });
        return NextResponse.json(items);
    } catch (e: any) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const item = await prisma.maintenance.create({
            data: {
                customerName: body.customerName || null, phone: body.phone || null,
                deviceType: body.deviceType || null, problem: body.problem || null,
                cost: parseFloat(body.cost) || 0, status: 'pending',
                userId: body.userId || null, notes: body.notes || null,
            },
        });
        return NextResponse.json(item, { status: 201 });
    } catch (e: any) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export async function PUT(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const item = await prisma.maintenance.update({
            where: { id: body.id },
            data: { status: body.status, cost: body.cost ? parseFloat(body.cost) : undefined, notes: body.notes },
        });

        // Treasury entry when completed
        if (body.status === 'completed' && n(item.cost) > 0) {
            await prisma.treasury.create({ data: { type: 'in', amount: n(item.cost), description: `صيانة - ${item.deviceType || 'جهاز'}`, referenceType: 'maintenance', referenceId: item.id, userId: body.userId || null } });
        }

        return NextResponse.json(item);
    } catch (e: any) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
