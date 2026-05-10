import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'settings.exchange-rates.id' });
async function _DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const prisma = getPrisma(request);
    try {
        const user = getUserFromRequest(request as any);
        if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
        
        const id = parseInt((await params).id);
        await prisma.exchangeRate.delete({ where: { id } });
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        log.error("DELETE exchange rate error:", error);
        return NextResponse.json({ error: 'حدث خطأ.' }, { status: 500 });
    }
}

export const DELETE = withRoute(async ({ req }, context) => _DELETE(req as any, context), { rateLimit: 'DEFAULT' });
