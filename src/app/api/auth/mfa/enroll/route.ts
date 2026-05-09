import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { MfaEngine } from '@/lib/mfa-engine';

async function _POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, method } = body;
        if (!userId || !method) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        const result = await MfaEngine.enroll(userId, method);
        return NextResponse.json({ success: true, data: result });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH' });
