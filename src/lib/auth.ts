import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.auth.ts' });

const JWT_SECRET: string = process.env.JWT_SECRET || 'default-jwt-secret-CHANGE-IN-PRODUCTION-2024';

export interface JWTPayload {
    userId: number;
    username: string;
    role: string;
    tenantId?: string;
    sessionToken?: string;
}

export function hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
}

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

export function getTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    const cookie = request.cookies.get('token');
    return cookie?.value || null;
}

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
    const token = getTokenFromRequest(request);
    if (!token) return null;
    return verifyToken(token);
}

export function generateSessionToken(): string {
    return crypto.randomUUID();
}

// Centralized permission check — used by ALL API routes
// Logic: if user role is admin → grant full access
//        if user has explicit permission records → use those
//        otherwise → deny
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function hasPermission(userId: number, module: string, prismaClient?: any): Promise<boolean> {
    const db = prismaClient || prisma;
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, permissions: true },
        });
        if (!user) return false;

        // Admin and Owner always have full access
        if (user.role === 'admin' || user.role === 'owner') return true;

        // Explicit permissions override role
        if (user.permissions.length > 0) {
            return user.permissions.some((p: any) => p.module === module);
        }

        return false;
    } catch (err: any) {
        // logger is async-imported to avoid circular dep at module load time
        import('@/lib/logger').then(({ logger }) => logger.error({}, 'hasPermission error', { err })).catch(() => {});
        return false;
    }
}

// Check if user is a legacy admin (admin role with zero permission records)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function isLegacyAdmin(userId: number, prismaClient?: any): Promise<boolean> {
    const db = prismaClient || prisma;
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, permissions: true },
        });
        if (!user) return false;
        return user.permissions.length === 0 && user.role === 'admin';
    } catch {
        return false;
    }
}

export function withGuard(handler: (request: NextRequest, params: any, user: JWTPayload) => Promise<any> | any) {
    return async (request: NextRequest, params: any) => {
        const start  = Date.now();
        const reqId  = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
        const { logger } = await import('@/lib/logger');

        const user = getUserFromRequest(request);
        if (!user) {
            logger.warn({ route: request.nextUrl.pathname, requestId: reqId }, 'withGuard: Unauthorized');
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const log = logger.child({
            tenantId:  user.tenantId,
            userId:    String(user.userId),
            route:     request.nextUrl.pathname,
            requestId: reqId,
        });

        log.info(`→ ${request.method} ${request.nextUrl.pathname}`);

        try {
            const result = await handler(request, params, user);
            log.info(`← ${request.method} ${request.nextUrl.pathname} ${Date.now() - start}ms`);
            return result;
        } catch (err: any) {
            log.error(`✗ ${request.method} ${request.nextUrl.pathname}`, { error: err.message });
            return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    };
}

