import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { ZakatEngine } from '@/lib/zakat-engine';
import { apiError } from '@/lib/api-error';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'zakat.assessments.id.finalize' });
async function _POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = getUserFromRequest(req as any);
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id } = await params;
    try {
        const result = await ZakatEngine.finalize(parseInt(id, 10), user.userId);
        return NextResponse.json(result);
    } catch (e: any) {
        return apiError(e, 'فشل اعتماد التقدير', { context: 'zakat/finalize' });
    }
}

export const POST = withRoute(async ({ req }, context) => _POST(req as any, context), { rateLimit: 'DEFAULT' });
