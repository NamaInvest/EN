import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/auth/session — Check if current session is still valid
 * Returns { valid: true } if the session token matches the DB
 * Returns { valid: false, reason: 'session_replaced' } if logged in elsewhere
 */
export async function GET(request: NextRequest) {
    try {
        const payload = getUserFromRequest(request);
        if (!payload) return NextResponse.json({ valid: false, reason: 'no_token' });

        // If old tokens without sessionToken, still valid (backward compatibility)
        if (!payload.sessionToken) return NextResponse.json({ valid: true });

        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { sessionToken: true, active: true },
        });

        if (!user || !user.active) {
            return NextResponse.json({ valid: false, reason: 'user_disabled' });
        }

        if (user.sessionToken && user.sessionToken !== payload.sessionToken) {
            return NextResponse.json({ valid: false, reason: 'session_replaced' });
        }

        return NextResponse.json({ valid: true });
    } catch {
        return NextResponse.json({ valid: true }); // Don't block on errors
    }
}
