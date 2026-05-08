import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export async function GET(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const vacations = await prisma.vacation.findMany({
            take: 100, include: { employee: { select: { id: true, name: true, position: true,  phone: true } } }, orderBy: { id: 'desc' } });
        return NextResponse.json(vacations);
    } catch (e: any) { console.error(e); return NextResponse.json([], { status: 500 }); }
}

export async function POST(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const vacation = await prisma.vacation.create({
            data: {
                employeeId: parseInt(body.employeeId),
                type: body.type || 'annual',
                dateFrom: body.dateFrom, dateTo: body.dateTo,
                status: body.status || 'approved',
                notes: body.notes || null,
            },
            include: { employee: { select: { id: true, name: true, position: true,  phone: true } } },
        });
        return NextResponse.json(vacation, { status: 201 });
    } catch (e: any) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}

export async function PUT(request: Request) {
  const _guardUser = getUserFromRequest(request as any);
  if (!_guardUser) return new Response(JSON.stringify({error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});


    const prisma = getPrisma(request);
    try {
        const body = await request.json();
        const vacation = await prisma.vacation.update({ where: { id: body.id }, data: { status: body.status, notes: body.notes } });
        return NextResponse.json(vacation);
    } catch (e: any) { console.error(e); return NextResponse.json({ error: 'فشل' }, { status: 500 }); }
}
