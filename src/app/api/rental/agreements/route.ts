import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const items = await (prisma as any).rentalAgreement.findMany({ include: { _count: { select: { returns: true } } }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(items);
  } catch (e: any) { return apiError(e, 'Error', { context: 'rental/agreements' }); }
}
export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const count = await (prisma as any).rentalAgreement.count();
    const start = new Date(d.startDate); const end = new Date(d.endDate);
    const days = Math.ceil((end.getTime()-start.getTime())/(1000*60*60*24));
    const total = days * (parseFloat(d.dailyRate)||0);
    const item = await (prisma as any).rentalAgreement.create({ data: { agreementNo: `RA-${String(count+1).padStart(5,'0')}`, customerName: d.customerName, itemName: d.itemName, startDate: start, endDate: end, dailyRate: parseFloat(d.dailyRate)||0, totalAmount: total, deposit: parseFloat(d.deposit)||0, notes: d.notes, tenantId: d.tenantId||'default' } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'rental/agreements' }); }
}
export async function PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const d = await request.json();
    const item = await (prisma as any).rentalAgreement.update({ where: { id: parseInt(d.id) }, data: { status: d.status, notes: d.notes } });
    return NextResponse.json(item);
  } catch (e: any) { return apiError(e, 'Error', { context: 'rental/agreements' }); }
}
