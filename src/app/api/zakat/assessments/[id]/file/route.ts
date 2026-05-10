import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { ZakatEngine } from '@/lib/zakat-engine';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'zakat.assessments.id.file' });

const _POSTSchema = z.object({
  zatcaTransactionId: z.union([z.string(), z.number()]).optional(),
  filingReference: z.any().optional(),
}).passthrough();

async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    try {
        const body = await req.json().catch(() => ({}));

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
        const updated = await ZakatEngine.markFiled(parseInt(id, 10), user.userId, {
            zatcaTransactionId: body.zatcaTransactionId,
            filingReference: body.filingReference,
        });
        return NextResponse.json(updated);
    } catch (e: any) {
        log.error('src/app/api/zakat/assessments/[id]/file/route.ts', { error: e instanceof Error ? e.message : e });

        return apiError(e, 'فشل تسجيل التقديم', { context: 'zakat/file' });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
