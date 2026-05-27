import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_super_secret_ice_key_2026';

/**
 * @description
 * POST /api/ice/auth/login
 * Authenticates an ICE Super Admin and issues an HTTP-only JWT.
 * Mitigates brute-force by logging attempts to AdminLoginLog.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 });
    }

    // 1. Fetch admin record
    const admin = await prisma.iceAdmin.findUnique({
      where: { email },
      include: { role: true }
    });

    if (!admin || !admin.active) {
      // Log failed attempt for non-existent or inactive user
      await logAttempt(null, email, req, 'FAILED_USER_NOT_FOUND');
      return NextResponse.json({ message: 'بيانات الدخول غير صحيحة أو الحساب موقوف' }, { status: 401 });
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, admin.passwordHash);

    if (!isMatch) {
      // Log failed password attempt
      await logAttempt(admin.id, email, req, 'FAILED_PASSWORD');
      return NextResponse.json({ message: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    // 3. Check 2FA
    if (admin.twoFactorEnabled) {
      // Log step 1 success, waiting for 2FA
      await logAttempt(admin.id, email, req, 'SUCCESS_AWAITING_2FA');
      
      const pendingToken = jwt.sign(
        { id: admin.id, pending2FA: true },
        JWT_SECRET,
        { expiresIn: '5m' }
      );

      const pendingResponse = NextResponse.json({ message: 'يرجى إدخال رمز التحقق', requires2FA: true }, { status: 200 });
      
      pendingResponse.cookies.set({
        name: 'ice_2fa_pending',
        value: pendingToken,
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 5 * 60, // 5 minutes
      });

      return pendingResponse;
    }

    // 4. Successful login without 2FA
    await logAttempt(admin.id, email, req, 'SUCCESS');
    
    // Update last login
    await prisma.iceAdmin.update({
      where: { id: admin.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: getIp(req)
      }
    });

    // 5. Generate JWT token
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

    const response = NextResponse.json({ message: 'تم تسجيل الدخول بنجاح', requires2FA: false }, { status: 200 });
    
    // 6. Set HTTP-only Cookie
    response.cookies.set({
      name: 'ice_session',
      value: token,
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return response;

  } catch (error) {
    console.error('ICE Login Error:', error);
    return NextResponse.json({ message: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

/**
 * Utility to log the login attempt in the database to detect brute-force.
 */
async function logAttempt(adminId: number | null, username: string, req: NextRequest, status: string) {
  try {
    const ipAddress = getIp(req);
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    
    await prisma.iceLoginLog.create({
      data: {
        adminId,
        username,
        ipAddress,
        userAgent,
        status,
      }
    });
  } catch (err) {
    console.error("Failed to write to AdminLoginLog", err);
  }
}

function getIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for') || '127.0.0.1';
}
