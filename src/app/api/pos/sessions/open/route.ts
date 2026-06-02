import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PosSessionEngine } from '@/lib/pos-session-engine';
import { getPrisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pos.sessions.open' });

const _POSTSchema = z.object({
  userId: z.union([z.string(), z.number()]).optional(),
  terminalId: z.union([z.string(), z.number()]).optional(),
  branchId: z.union([z.string(), z.number()]).optional(),
  openingFloat: z.any().optional(),
}).passthrough();

/**
 * فتح جلسة/وردية كاشير جديدة لنقاط البيع
 * تضمن المصادقة وتوافق سياق الـ tenantId لكل مستخدم بشكل آمن وصارم.
 */
async function _POST(req: NextRequest) {
    try {
        // 1. التحقق من المصادقة وتفويض المستخدم المسجل
        const auth = getUserFromRequest(req as any);
        if (!auth) {
            return NextResponse.json({ success: false, error: 'غير مصرح للوصول إلى هذا المورد' }, { status: 401 });
        }

        // 2. التحقق وعزل الـ tenantId
        const tenantId = requireTenantId(req as any);
        const prisma = getPrisma(req);

        const body = await req.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
            return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const { userId, terminalId, branchId, openingFloat } = body;
        
        if (!userId || !terminalId) {
            return NextResponse.json({ error: 'userId and terminalId are required' }, { status: 400 });
        }

        const targetUserId = parseInt(userId, 10);

        // 3. تأكيد تطابق المستخدم أو صلاحياته لإدارة الورديات لمنع التلاعب
        if (targetUserId !== auth.userId && auth.role !== 'admin' && auth.role !== 'owner' && auth.role !== 'MASTER_ADMIN') {
            return NextResponse.json({ success: false, error: 'غير مصرح بفتح جلسة لمستخدم آخر' }, { status: 403 });
        }

        // 4. استدعاء محرك فتح الجلسة المعزول محاسبياً وبيئياً
        const session = await PosSessionEngine.openSession(
            targetUserId,
            parseInt(terminalId, 10),
            branchId ? parseInt(branchId, 10) : 1,
            parseFloat(openingFloat || 0),
            tenantId,
            prisma
        );

        return NextResponse.json(session);
    } catch (e: any) {
        log.error("Failed to open POS Session:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
