// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { MfaEngine } from '@/lib/mfa-engine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, code } = body;
        if (!userId || !code) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        const requestInfo = {
            ipAddress: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown'
        };

        const result = await MfaEngine.verifyBackupCode(userId, code, requestInfo);
        return NextResponse.json({ success: result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 401 });
    }
}
