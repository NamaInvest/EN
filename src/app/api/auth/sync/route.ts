import { PrismaClient } from "@prisma/client";
import { withRoute } from '@/lib/api/with-route';
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getUserFromRequest } from '@/lib/auth';

const prisma = new PrismaClient();

async function _POST(req: Request) {
    const { getUserFromRequest: _getAuth } = require('@/lib/auth');
    if (!_getAuth(req)) return NextResponse.json({ error: 'UnauthorizedUnauthorizedUnauthorized UnauthorizedUnauthorizedUnauthorizedUnauthorized' }, { status: 401 });
  try {
    // ── منع الإنشاء التلقائي على Tenant subdomains ──────────────────────
    // هذا المسار يعمل فقط على الموقع الرئيسي (namainvist.com)
    // أي شركة تدير مستخدميها عبر لوحة الإعدادات فقط
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const isMainSite =
      host === 'namainvist.com' ||
      host === 'www.namainvist.com' ||
      host.startsWith('localhost');

    if (!isMainSite) {
      return NextResponse.json(
        { error: 'User sync not allowed on tenant subdomains' },
        { status: 403 }
      );
    }

    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Check if user exists by username (email)
    let dbUser = await prisma.user.findUnique({
      where: { username: email },
    });

    if (!dbUser) {
      // Auto-create user if they login with Google (main site only)
      dbUser = await prisma.user.create({
        data: {
          username: email,
          fullName: user.firstName ? `${user.firstName} ${user.lastName || ''}` : email.split('@')[0],
          passwordHash: "clerk_managed",
          role: "cashier", // Default fallback role
          active: true,
        },
      });
    }

    return NextResponse.json({ success: true, user: dbUser });
  } catch (error: any) {
    console.error("Sync user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH' });
