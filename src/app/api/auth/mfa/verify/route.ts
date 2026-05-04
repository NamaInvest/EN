import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, token } = body;
        
        if (!userId || !token) {
            return NextResponse.json({ error: 'User ID and TOTP token are required' }, { status: 400 });
        }

        // Mock verification
        const isValid = token.length === 6;

        if (isValid) {
            return NextResponse.json({
                status: 'success',
                message: 'MFA verification successful',
                sessionToken: 'mfa-verified-token-123'
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
