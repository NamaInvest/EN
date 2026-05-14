import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_super_secret_ice_key_2026';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('ice_session')?.value;
    if (!sessionCookie) return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    const decoded: any = jwt.verify(sessionCookie, JWT_SECRET);
    if (!decoded.isSuperAdmin) return NextResponse.json({ message: 'صلاحيات غير كافية' }, { status: 403 });

    const subscriptions = await prisma.iceTenantSubscription.findMany({
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(subscriptions, { status: 200 });
  } catch (error) {
    console.error('Fetch Subscriptions Error:', error);
    return NextResponse.json({ message: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('ice_session')?.value;
    if (!sessionCookie) return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    const decoded: any = jwt.verify(sessionCookie, JWT_SECRET);
    if (!decoded.isSuperAdmin) return NextResponse.json({ message: 'صلاحيات غير كافية' }, { status: 403 });

    const { tenantId, planId, status, startDate, endDate, billingCycle, paymentMethod } = await req.json();

    if (!tenantId || !planId || !startDate || !endDate) {
      return NextResponse.json({ message: 'البيانات غير مكتملة' }, { status: 400 });
    }

    const subscription = await prisma.iceTenantSubscription.upsert({
      where: { tenantId },
      update: {
        planId,
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        billingCycle,
        paymentMethod
      },
      create: {
        tenantId,
        planId,
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        billingCycle,
        paymentMethod
      }
    });

    await prisma.iceAuditLog.create({
      data: {
        adminId: decoded.id,
        action: 'UPDATE_SUBSCRIPTION',
        entityType: 'IceTenantSubscription',
        entityId: subscription.id.toString(),
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        newValues: JSON.stringify({ planId, status, endDate })
      }
    });

    return NextResponse.json(subscription, { status: 200 });
  } catch (error) {
    console.error('Upsert Subscription Error:', error);
    return NextResponse.json({ message: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
