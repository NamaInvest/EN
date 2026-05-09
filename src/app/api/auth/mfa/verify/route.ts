import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { MfaEngine } from '@/lib/mfa-engine';
import { getPrisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

async function _POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, token } = body;
        
        if (!userId || !token) {
            return NextResponse.json(
                { error: 'User ID and TOTP token are required' },
                { status: 400 }
            );
        }

        // Validate token is 6 digits
        if (!/^\d{6}$/.test(String(token))) {
            return NextResponse.json(
                { error: 'TOTP token must be exactly 6 digits' },
                { status: 400 }
            );
        }

        let isValid = false;
        try {
            isValid = await MfaEngine.verify(parseInt(userId), String(token), 'totp', {
                ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown'
            });
        } catch (err: any) {
            return NextResponse.json(
                { status: 'error', message: err.message || 'Invalid TOTP token' },
                { status: 401 }
            );
        }

        if (!isValid) {
            return NextResponse.json(
                { status: 'error', message: 'Invalid or expired TOTP token' },
                { status: 401 }
            );
        }

        // MFA passed — issue a full JWT with mfa_verified flag
        const prisma = getPrisma(req);
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            select: { id: true, username: true, role: true, branchId: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('CRITICAL: JWT_SECRET not set');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const sessionToken = jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: user.role,
                branchId: user.branchId,
                mfaVerified: true,
                iat: Math.floor(Date.now() / 1000),
            },
            jwtSecret,
            { expiresIn: '8h' }
        );

        return NextResponse.json({
            status: 'success',
            message: 'MFA verification successful',
            sessionToken,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            }
        });

    } catch (e: any) {
        console.error('[MFA verify] error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH' });
