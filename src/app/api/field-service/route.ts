import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/field-service — قائمة تذاكر الخدمة الميدانية
 * POST /api/field-service — إنشاء تذكرة جديدة
 */
export async function GET(req: Request) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const technicianId = searchParams.get('technicianId');

    const tickets = await (prisma as any).serviceTicket?.findMany?.({
      where: {
        ...(status ? { status } : {}),
        ...(technicianId ? { technicianId: parseInt(technicianId) } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (!tickets) {
      return NextResponse.json({ tickets: [], message: 'يحتاج ترحيل قاعدة البيانات (prisma migrate)' });
    }

    // إحصائيات
    const stats = {
      open: tickets.filter((t: any) => t.status === 'open').length,
      assigned: tickets.filter((t: any) => t.status === 'assigned').length,
      inProgress: tickets.filter((t: any) => t.status === 'in_progress').length,
      completed: tickets.filter((t: any) => t.status === 'completed').length,
      total: tickets.length,
    };

    return NextResponse.json({ tickets, stats });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      customerId, technicianId, type, priority,
      description, scheduledDate, laborCost, partsCost, notes,
      latitude, longitude,
    } = body;

    // جلب آخر رقم تذكرة
    const lastTicket = await (prisma as any).serviceTicket?.findFirst?.({
      orderBy: { ticketNo: 'desc' },
      select: { ticketNo: true },
    });
    const nextNo = (lastTicket?.ticketNo || 0) + 1;

    const ticket = await (prisma as any).serviceTicket?.create?.({
      data: {
        ticketNo: nextNo,
        customerId: customerId ? parseInt(customerId) : null,
        technicianId: technicianId ? parseInt(technicianId) : null,
        type: type || 'repair',
        priority: priority || 'normal',
        description: description || '',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: technicianId ? 'assigned' : 'open',
        laborCost: parseFloat(laborCost) || 0,
        partsCost: parseFloat(partsCost) || 0,
        totalCost: (parseFloat(laborCost) || 0) + (parseFloat(partsCost) || 0),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        notes: notes || null,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'يحتاج ترحيل قاعدة البيانات' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PATCH /api/field-service — تحديث حالة التذكرة
 */
export async function PATCH(req: Request) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const body = await req.json();
    const { id, status, technicianId, laborCost, partsCost, notes } = body;

    if (!id) return NextResponse.json({ error: 'معرف التذكرة مطلوب' }, { status: 400 });

    const updateData: any = {};
    if (status) updateData.status = status;
    if (technicianId) updateData.technicianId = parseInt(technicianId);
    if (laborCost !== undefined) updateData.laborCost = parseFloat(laborCost);
    if (partsCost !== undefined) updateData.partsCost = parseFloat(partsCost);
    if (notes !== undefined) updateData.notes = notes;
    if (status === 'completed') updateData.completedDate = new Date();

    // حساب التكلفة الإجمالية
    if (updateData.laborCost !== undefined || updateData.partsCost !== undefined) {
      const current = await (prisma as any).serviceTicket.findUnique({ where: { id: parseInt(id) } });
      updateData.totalCost = (updateData.laborCost ?? current?.laborCost ?? 0) +
        (updateData.partsCost ?? current?.partsCost ?? 0);
    }

    const ticket = await (prisma as any).serviceTicket?.update?.({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json({ success: true, ticket });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
