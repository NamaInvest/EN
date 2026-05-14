import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

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

    const admin = await prisma.iceAdmin.findUnique({
      where: { id: decoded.id }
    });

    if (!admin) {
      return NextResponse.json({ message: 'لم يتم العثور على المشرف' }, { status: 404 });
    }

    const secret = speakeasy.generateSecret({
      name: `Nama Invest ICE: ${admin.email}`
    });

    if (!secret.otpauth_url) {
      return NextResponse.json({ message: 'فشل إنشاء الرمز السري' }, { status: 500 });
    }

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeDataUrl
    }, { status: 200 });

  } catch (error) {
    console.error('ICE 2FA Generate Error:', error);
    return NextResponse.json({ message: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
