// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { MfaEngine } from '@/lib/mfa-engine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, code } = body;
        if (!userId || !code) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        // First verify the code to make sure it's actually them
        const requestInfo = {
            ipAddress: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown'
        };
        await MfaEngine.verify(userId, code, 'totp', requestInfo);

        const result = await MfaEngine.disable(userId);
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 401 });
    }
}
