import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_super_secret_ice_key_2026';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('ice_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(sessionCookie, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ message: 'جلسة غير صالحة' }, { status: 401 });
    }

    if (!decoded.isSuperAdmin) {
      return NextResponse.json({ message: 'صلاحيات غير كافية' }, { status: 403 });
    }

    await prisma.iceAdmin.update({
      where: { id: decoded.id },
      data: {
        twoFactorSecret: null,
        twoFactorEnabled: false,
      }
    });

    // Audit log
    await prisma.iceAuditLog.create({
      data: {
        adminId: decoded.id,
        action: 'DISABLE_2FA',
        entityType: 'IceAdmin',
        entityId: decoded.id.toString(),
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        newValues: 'Disabled Two-Factor Authentication'
      }
    });

    return NextResponse.json({ message: 'تم تعطيل التحقق الثنائي بنجاح' }, { status: 200 });

  } catch (error) {
    console.error('ICE 2FA Disable Error:', error);
    return NextResponse.json({ message: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
