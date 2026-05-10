import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { createHmac } from 'crypto';
import { getPrisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'auth.auto-login' });
const SSO_SECRET = process.env.SSO_SECRET || 'namainvest-sso-2024';

async function _GET(request: Request) {
    const prisma = getPrisma(request);
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Token missing' }, { status: 400 });
    }

    try {
        // Token format: base64url(payload):signature
        const parts = token.split(':');
        if (parts.length !== 2) throw new Error('Invalid format');

        const [payloadB64, signature] = parts;
        const expected = createHmac('sha256', SSO_SECRET).update(payloadB64).digest('hex');

        if (signature !== expected) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

        if (payload.type !== 'sso-auto-login') {
            return NextResponse.json({ error: 'Invalid token type' }, { status: 401 });
        }

        if (Date.now() > payload.exp) {
            return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }

        // Find admin user
        const admin = await prisma.user.findFirst({
            where: { role: 'admin', active: true },
            include: { permissions: true },
        });

        if (!admin) {
            return NextResponse.json({ error: 'No admin user found' }, { status: 404 });
        }

        const jwtToken = generateToken({
            userId: admin.id,
            username: admin.username,
            role: admin.role,
        });

        return NextResponse.json({ success: true, token: jwtToken, user: { username: admin.username, role: admin.role } });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'AUTH' });
