import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// الاتصال بـ n11_db حيث تُخزَّن سجلات TenantAccount
function getMasterPrisma(): PrismaClient {
    const base =
        process.env.DATABASE_URL ||
        'postgresql://n11_db:n11_pass123@localhost:5432/n11_db?schema=public';
    // استخدام n11_db دائماً كـ master registry
    const url = base.replace(/\/([^/?]+)(\?|$)/, '/n11_db$2');
    return new PrismaClient({ datasources: { db: { url } } });
}

/**
 * GET /api/tenant/check-status?userId=clerk_xxx
 * يتحقق هل المستخدم مؤسَّس (لديه tenant) ويرجع الـ subdomain
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

        // البحث بـ clerkUserId أولاً (الأسرع)
        let account = null;

        if (userId) {
            account = await (prisma as any).tenantAccount.findUnique({
                where: { clerkUserId: userId },
                select: { subdomain: true, status: true, orgName: true },
            }).catch(() => null);
        }

        // إذا لم يوجد بـ clerkUserId، نبحث بـ email
        if (!account && email) {
            account = await (prisma as any).tenantAccount.findUnique({
                where: { userEmail: email },
                select: { subdomain: true, status: true, orgName: true },
            }).catch(() => null);
        }

        if (account && account.subdomain) {
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
        // في حال خطأ DB — نسمح بالمرور لتفادي حجب المستخدمين
        return NextResponse.json({ provisioned: false, error: 'db_error' });
    } finally {
        if (prisma) await prisma.$disconnect().catch(() => {});
    }
}

/**
 * POST /api/tenant/check-status
 * يُحدَّث عند إنشاء tenant جديد
 */
export async function POST(req: Request) {
    try {
        const { userId, subdomain, email, clerkUserId } = await req.json();
        const effectiveUserId = clerkUserId || userId;

        if (!effectiveUserId || !subdomain) {
            return NextResponse.json({ success: false, error: 'missing fields' }, { status: 400 });
        }

        let prisma: PrismaClient | null = null;
        try {
            prisma = getMasterPrisma();
            // تحديث الـ clerkUserId في TenantAccount إذا كان موجوداً
            try {
                await (prisma as any).tenantAccount.updateMany({
                    where: { subdomain },
                    data: { clerkUserId: effectiveUserId },
                });
            } catch {
                // ignore if update fails (maybe field doesn't exist yet on server)
            }
        } finally {
            if (prisma) await prisma.$disconnect().catch(() => {});
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
