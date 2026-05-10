import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'bnpl.status' });
async function _GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) return NextResponse.json({ error: 'Missing Session ID' }, { status: 400 });

    // In a real integration: poll Tabby/Tamara webhook or status endpoint
    // Here we simulate a 30% chance of approval for testing POS auto-close:
    
    // For demo purposes, we will treat it as pending unless overridden
    const randomStatus = Math.random() > 0.7 ? 'AUTHORIZED' : 'PENDING';

    return NextResponse.json({
        sessionId,
        status: randomStatus
    });
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
