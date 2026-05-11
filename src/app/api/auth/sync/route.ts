/**
 * Clerk → NamaSoft User Sync
 * POST /api/auth/sync
 *
 * يُزامن بيانات المستخدم من Clerk إلى جدول users المحلي.
 * يعمل فقط على الموقع الرئيسي (namainvist.com) — ممنوع على subdomains.
 */
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'auth.sync' });

const MAIN_SITE_HOSTS = new Set([
  'namainvist.com',
  'www.namainvist.com',
]);

async function _POST(req: NextRequest) {
  const prisma = getPrisma(req);
  try {
    // ── فقط الموقع الرئيسي يُسمح بمزامنة المستخدمين ─────────────────────
    const headersList = await headers();
    const host = (headersList.get('host') || '').split(':')[0]; // strip port

    const isMainSite = MAIN_SITE_HOSTS.has(host) || host === 'localhost' || host === '127.0.0.1';
    if (!isMainSite) {
      return NextResponse.json(
        { error: 'User sync not allowed on tenant subdomains' },
        { status: 403 }
      );
    }

    // ── مصادقة Clerk ──────────────────────────────────────────────────────
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: 'Clerk account must have a verified email' }, { status: 400 });
    }

    // ── إنشاء أو استرجاع المستخدم المحلي ─────────────────────────────────
    let dbUser = await prisma.user.findUnique({ where: { username: email } });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          username:     email,
          fullName:     user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : email.split('@')[0],
          passwordHash: 'clerk_managed',
          role:         'cashier', // دور افتراضي — يمكن للمسؤول تغييره لاحقاً
          active:       true,
        },
      });
    }

    return NextResponse.json({ success: true, user: { id: dbUser.id, username: dbUser.username, role: dbUser.role } });

  } catch (error: any) {
    log.error('Sync user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH', requireAuth: false });
