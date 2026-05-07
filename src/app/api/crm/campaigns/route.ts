import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const campaigns = await (prisma as any).crmCampaign.findMany({
            take: 100,
      where,
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(campaigns);
  } catch (error: any) {
    return apiError(error, 'Error fetching campaigns', { context: 'crm/campaigns' });
  }
}

export async function POST(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const campaign = await (prisma as any).crmCampaign.create({
      data: {
        name: data.name,
        type: data.type || 'EMAIL',
        status: data.status || 'DRAFT',
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        budget: parseFloat(data.budget) || 0,
        description: data.description || null,
        targetCount: parseInt(data.targetCount) || 0
      }
    });
    return NextResponse.json(campaign);
  } catch (error: any) {
    return apiError(error, 'Error creating campaign', { context: 'crm/campaigns' });
  }
}

export async function PUT(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.budget) updateData.budget = parseFloat(updateData.budget);
    if (updateData.targetCount) updateData.targetCount = parseInt(updateData.targetCount);
    
    const campaign = await (prisma as any).crmCampaign.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    return NextResponse.json(campaign);
  } catch (error: any) {
    return apiError(error, 'Error updating campaign', { context: 'crm/campaigns' });
  }
}

export async function DELETE(request: NextRequest) {
  const prisma = getPrisma(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await (prisma as any).crmCampaign.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiError(error, 'Error deleting campaign', { context: 'crm/campaigns' });
  }
}
