import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'zatca.test' });

async function _GET(req: NextRequest) {
    try {
        const auth = getUserFromRequest(req as any);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        log.info('Mocking ZATCA Developer Portal compliance check for local testing');

        // Securely mock the response to satisfy testing requirements without making external calls
        return NextResponse.json({
            success: true,
            base64_length: 512,
            results: [
                { otp: '252740', status: 200, mock: true, info: 'Compliance Sandbox Mock Success' }
            ]
        });
    } catch (e: any) {
        log.error('ZATCA test route error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
