import { getUserFromRequest } from '@/lib/auth';
import { withRoute } from '@/lib/api/with-route';
/**
 * EOS Actions API
 * POST /api/hr/eos/[id] — approve or pay
 */
import { NextResponse } from 'next/server';
import { SaudiEOSEngine } from '@/lib/saudi-eos-engine';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'hr.eos.id' });


const _POSTSchema = z.object({
  action: z.any().optional(),
}).passthrough();

async function _POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const eosId = parseInt((await params).id);

    try {
        const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const { action } = body;

        if (action === 'approve') {
            await SaudiEOSEngine.approve(eosId, user.userId);
            return NextResponse.json({ success: true, message: 'تم الموافقة على التسوية' });
        } else if (action === 'pay') {
            await SaudiEOSEngine.pay(eosId, user.userId);
            return NextResponse.json({ success: true, message: 'تم صرف التسوية وإنشاء القيد' });
        } else {
            return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
        }
    } catch (e: any) {
        log.error(e);
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
