import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'b2b-auth' });

const JWT_SECRET: string = process.env.JWT_SECRET || 'default-jwt-secret-CHANGE-IN-PRODUCTION-2024';

export interface B2BJWTPayload {
    customerId: number;
    phone: string;
    b2b: boolean;
}

export function generateB2BToken(payload: B2BJWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyB2BToken(token: string): B2BJWTPayload | null {
    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        if (!payload.b2b) return null;
        return payload as B2BJWTPayload;
    } catch {
        return null;
    }
}

export function getB2BUserFromRequest(request: NextRequest): B2BJWTPayload | null {
    const authHeader = request.headers.get('authorization');
    let token = null;
    if (authHeader?.startsWith('Bearer ')) token = authHeader.substring(7);
    if (!token) token = request.cookies.get('b2b_token')?.value || null;
    if (!token) return null;
    return verifyB2BToken(token);
}
