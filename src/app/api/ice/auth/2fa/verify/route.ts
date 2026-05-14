import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_super_secret_ice_key_2026';

export async function POST(req: NextRequest) {
  try {
    const { token: totpToken } = await req.json();

    if (!totpToken) {
      return NextResponse.json({ message: 'رمز التحقق مطلوب' }, { status: 400 });
    }

    const pendingCookie = req.cookies.get('ice_2fa_pending')?.value;

    if (!pendingCookie) {
      return NextResponse.json({ message: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(pendingCookie, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ message: 'رمز الجلسة غير صالح' }, { status: 401 });
    }

    if (!decoded.id || !decoded.pending2FA) {
      return NextResponse.json({ message: 'طلب غير صالح' }, { status: 400 });
    }

    const admin = await prisma.iceAdmin.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!admin || !admin.active || !admin.twoFactorSecret) {
      return NextResponse.json({ message: 'حساب غير صالح أو لم يتم تفعيل التحقق الثنائي' }, { status: 401 });
    }

    // Verify TOTP
    const verified = speakeasy.totp.verify({
      secret: admin.twoFactorSecret,
      encoding: 'base32',
      token: totpToken,
      window: 1 // Allow 1 step window (30 seconds before/after)
    });

    if (!verified) {
      return NextResponse.json({ message: 'رمز التحقق غير صحيح' }, { status: 401 });
    }

    // Successful login
    // Log success
    try {
      await prisma.iceLoginLog.create({
        data: {
          adminId: admin.id,
          username: admin.email,
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'Unknown',
          status: 'SUCCESS',
        }
      });
      await prisma.iceAdmin.update({
        where: { id: admin.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: req.headers.get('x-forwarded-for') || '127.0.0.1'
        }
      });
    } catch (err) {
      console.error('Failed to log successful 2FA login', err);
    }

    // Generate actual session token
    const token = jwt.sign(
      { 
        id: admin.id, 
        role: admin.role.name,
        isSuperAdmin: true,
        scope: 'ice'
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const response = NextResponse.json({ message: 'تم تسجيل الدخول بنجاح' }, { status: 200 });
    
    // Clear pending 2FA cookie, set actual session cookie
    response.cookies.delete('ice_2fa_pending');
    response.cookies.set({
      name: 'ice_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return response;

  } catch (error) {
    console.error('ICE 2FA Verify Error:', error);
    return NextResponse.json({ message: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}
