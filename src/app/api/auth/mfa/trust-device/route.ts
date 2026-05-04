// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { MfaEngine } from '@/lib/mfa-engine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, code, deviceName, days } = body;
        if (!userId || !code || !deviceName) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        const requestInfo = {
            ipAddress: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown',
            browser: req.headers.get('sec-ch-ua') || 'unknown',
            os: req.headers.get('sec-ch-ua-platform') || 'unknown'
        };

        // Require MFA verification before trusting the device
        await MfaEngine.verify(userId, code, 'totp', requestInfo);

        const trustedDevice = await MfaEngine.trustDevice(userId, deviceName, days || 30, requestInfo);
        
        return NextResponse.json({ success: true, trustedDevice });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 401 });
    }
}
