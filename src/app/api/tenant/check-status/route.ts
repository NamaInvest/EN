import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// الاتصال بـ n11_db دائماً — هذا هو الـ master registry للـ tenants
function getMasterPrisma(): PrismaClient {
    const url =
        process.env.MASTER_DB_URL ||
        'postgresql://n11_db:n11_pass123@localhost:5432/n11_db?schema=public';
    return new PrismaClient({ datasources: { db: { url } } });
}

/**
 * GET /api/tenant/check-status?userId=clerk_xxx&email=user@email.com
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
        return NextResponse.json({ provisioned: false }, { status: 400 });
    }

    let prisma: PrismaClient | null = null;
    try {
        prisma = getMasterPrisma();

        // البحث بـ clerkUserId أولاً
        let account: any = null;
        if (userId) {
            account = await (prisma as any).tenantAccount.findFirst({
                where: { clerkUserId: userId },
                select: { subdomain: true, status: true, orgName: true },
            }).catch(() => null);
        }

        // البحث بـ email إذا لم يوجد بـ clerkUserId
        if (!account && email) {
            account = await (prisma as any).tenantAccount.findFirst({
                where: { userEmail: email },
                select: { subdomain: true, status: true, orgName: true },
            }).catch(() => null);
        }

        if (account?.subdomain) {
            return NextResponse.json({
                provisioned: true,
                subdomain: account.subdomain,
                status: account.status,
                orgName: account.orgName,
            });
        }

        return NextResponse.json({ provisioned: false });

    } catch (error) {
        console.error('[check-status] DB error:', error);
        return NextResponse.json({ provisioned: false, error: 'db_error' });
    } finally {
        if (prisma) await prisma.$disconnect().catch(() => { });
    }
}

/**
 * POST /api/tenant/check-status — يُحدَّث عند إنشاء tenant جديد
 */
export async function POST(req: Request) {
    try {
        const { userId, subdomain, clerkUserId } = await req.json();
        const effectiveUserId = clerkUserId || userId;
        if (!effectiveUserId || !subdomain) {
            return NextResponse.json({ success: false }, { status: 400 });
        }
        let prisma: PrismaClient | null = null;
        try {
            prisma = getMasterPrisma();
            await (prisma as any).tenantAccount.updateMany({
                where: { subdomain },
                data: { clerkUserId: effectiveUserId },
            }).catch(() => { });
        } finally {
            if (prisma) await prisma.$disconnect().catch(() => { });
        }
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
