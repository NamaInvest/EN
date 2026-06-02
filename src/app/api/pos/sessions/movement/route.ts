import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PosSessionEngine } from '@/lib/pos-session-engine';
import { getPrisma } from '@/lib/prisma';
import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pos.sessions.movement' });

const _POSTSchema = z.object({
  sessionId: z.union([z.string(), z.number()]).optional(),
  type: z.any().optional(),
  amount: z.number().optional(),
  reason: z.any().optional(),
}).passthrough();

/**
 * تسجيل حركة مقبوضات أو مدفوعات نقدية داخل الصندوق
 * تضمن المصادقة وتوافق سياق الـ tenantId لكل مستخدم بشكل آمن وصارم لمنع التلاعب بجلسات مستأجرين آخرين.
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
        
        const { sessionId, type, amount, reason } = body;
        
        if (!sessionId || !type || !amount) {
            return NextResponse.json({ error: 'sessionId, type, and amount are required' }, { status: 400 });
        }

        // 3. التحقق الأمني من تبعية الجلسة للمستأجر الحالي قبل تسجيل الحركات عليها
        const targetSession = await prisma.posSession.findFirst({
            where: { id: parseInt(sessionId, 10), tenantId }
        });

        if (!targetSession) {
            return NextResponse.json({ success: false, error: 'لم يتم العثور على الجلسة المطلوبة أو أنها تنتمي لمؤسسة أخرى' }, { status: 404 });
        }

        // 4. استدعاء محرك الجلسة لتسجيل الحركة
        const movement = await PosSessionEngine.addMovement(
            parseInt(sessionId, 10),
            type,
            parseFloat(amount),
            reason,
            tenantId,
            prisma
        );

        return NextResponse.json(movement);
    } catch (e: any) {
        log.error("Failed to add POS Session movement:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
