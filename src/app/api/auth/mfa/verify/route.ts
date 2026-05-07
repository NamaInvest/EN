import { NextRequest, NextResponse } from 'next/server';
import { MfaEngine } from '@/lib/mfa-engine';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, token } = body;
        
        if (!userId || !token) {
            return NextResponse.json({ error: 'User ID and TOTP token are required' }, { status: 400 });
        }

        let isValid = false;
        try {
            isValid = await MfaEngine.verify(parseInt(userId), token, 'totp', {
                ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown'
            });
        } catch (err: any) {
            return NextResponse.json({
                status: 'error',
                message: err.message || 'Invalid TOTP token'
            }, { status: 401 });
        }

        if (isValid) {
            return NextResponse.json({
                status: 'success',
                message: 'MFA verification successful',
                sessionToken: 'mfa-verified-token-' + userId // You would ideally sign a real JWT here
            });
        } else {
            return NextResponse.json({
                status: 'error',
                message: 'Invalid TOTP token'
            }, { status: 401 });
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
