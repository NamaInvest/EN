import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PosSessionEngine } from '@/lib/pos-session-engine';
import { getPrisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pos.sessions.close' });

const _POSTSchema = z.object({
  sessionId: z.union([z.string(), z.number()]).optional(),
  actualClosingCash: z.any().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
}).passthrough();

/**
 * إغلاق جلسة/وردية كاشير وحساب الفروقات والقيود المقابلة
 * تضمن المصادقة وتوافق سياق الـ tenantId لكل مستخدم بشكل آمن وصارم لمنع تسريب أو إغلاق ورديات الغير.
 */
async function _POST(req: NextRequest) {
    try {
        // 1. التحقق من المصادقة وتفويض المستخدم المسجل
        const auth = getUserFromRequest(req as any);
        if (!auth) {
            return NextResponse.json({ success: false, error: 'غير مصرح للوصول إلى هذا المورد' }, { status: 401 });
        }

        // 2. التحقق وعزل الـ tenantId وقاعدة البيانات
        const tenantId = requireTenantId(req as any);
        const prisma = getPrisma(req);

        const body = await req.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
            return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        
        const { sessionId, actualClosingCash, userId } = body;
        
        if (!sessionId || actualClosingCash === undefined) {
            return NextResponse.json({ error: 'sessionId and actualClosingCash are required' }, { status: 400 });
        }

        const targetUserId = userId ? String(userId) : String(auth.userId);

        // 3. التحقق من أن الجلسة المطلوبة للإغلاق تنتمي للمستأجر الحالي قبل محاولة تعديلها أو قفلها ماليًا
        const targetSession = await prisma.posSession.findFirst({
            where: { id: parseInt(sessionId, 10), tenantId }
        });

        if (!targetSession) {
            return NextResponse.json({ success: false, error: 'لم يتم العثور على الجلسة المطلوبة أو أنها تنتمي لمؤسسة أخرى' }, { status: 404 });
        }

        // 4. استدعاء محرك إغلاق الجلسة المعزول محاسبياً وبيئياً
        const session = await PosSessionEngine.closeSession(
            parseInt(sessionId, 10),
            parseFloat(actualClosingCash),
            targetUserId,
            tenantId,
            prisma
        );

        return NextResponse.json(session);
    } catch (e: any) {
        log.error("Failed to close POS Session:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
