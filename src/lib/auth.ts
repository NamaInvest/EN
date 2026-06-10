/**
 * @fileoverview Authentication & Authorization utilities
 *
 * Central auth library for NamaInvest ERP covering:
 * - JWT token lifecycle (sign / verify / extract)
 * - Password hashing (bcrypt, cost 10)
 * - Permission resolution (role → explicit permissions)
 * - `withGuard` HOF for route-level authentication
 *
 * @module auth
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'auth' });

const JWT_SECRET: string = process.env.JWT_SECRET || 'default-jwt-secret-CHANGE-IN-PRODUCTION-2024';

/**
 * JWT payload structure embedded in every authenticated request token.
 * Carries identity + tenant context for multi-tenant isolation.
 */
export interface JWTPayload {
    userId: number;
    username: string;
    role: string;
    /** Database name for tenant isolation (e.g. 'n11_db', 'n1_db') */
    tenantId?: string;
    /** Session token for logout invalidation */
    sessionToken?: string;
}

/**
 * Hashes a plaintext password using bcrypt (cost factor 10).
 * @param password - Plaintext password to hash
 * @returns bcrypt hash string
 */
export function hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
}

/**
 * Compares a plaintext password against a bcrypt hash.
 * @param password - Plaintext password to verify
 * @param hash - bcrypt hash to compare against
 * @returns `true` if password matches the hash
 */
export function comparePassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
}

/**
 * Signs a JWT token with the application secret. Expires in 24h.
 * @param payload - User identity and tenant context to embed
 * @returns Signed JWT string
 */
export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verifies and decodes a JWT token.
 * @param token - JWT string to verify
 * @returns Decoded `JWTPayload` or `null` if invalid/expired
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
        return null;
    }
}

/**
 * Extracts the Bearer token from an HTTP request.
 * Checks `Authorization` header first, then `token` cookie.
 * @param request - Incoming Next.js request
 * @returns Raw JWT string, or `null` if not present
 */
export function getTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    const cookie = request.cookies.get('token');
    return cookie?.value || null;
}

/**
 * Extracts and verifies the authenticated user from a request.
 * Convenience wrapper around `getTokenFromRequest` + `verifyToken`.
 * @param request - Incoming Next.js request
 * @returns Decoded `JWTPayload` or `null` if unauthenticated/expired
 */
export function getUserFromRequest(request: NextRequest): JWTPayload | null {
    const token = getTokenFromRequest(request);
    if (!token) return null;
    return verifyToken(token);
}

/**
 * Generates a cryptographically random session token (UUID v4).
 * Used for logout invalidation and concurrent session tracking.
 * @returns UUID string
 */
export function generateSessionToken(): string {
    return crypto.randomUUID();
}

/**
 * Checks if a user has permission to access a specific module.
 *
 * Permission resolution order:
 * 1. `admin` / `owner` roles → always granted
 * 2. Explicit `Permission` records → module must match
 * 3. No records → denied
 *
 * @param userId - User ID to check
 * @param module - Module name (e.g. 'hr', 'sales', 'accounting')
 * @param prismaClient - Optional Prisma client (defaults to shared instance)
 * @returns `true` if access is granted
 */
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
            if (user.permissions.some((p: any) => p.module === module)) {
                return true;
            }
            // Fallback mapping for sales.quotation.*
            if (module.startsWith('sales.quotation.')) {
                const parentPerm = user.permissions.find((p: any) => p.module === 'price_quotes' || p.module === 'sales_quotes');
                if (parentPerm) {
                    const action = module.replace('sales.quotation.', '');
                    if (action === 'view') return parentPerm.canView;
                    if (action === 'create') return parentPerm.canAdd;
                    if (action === 'update') return parentPerm.canEdit;
                    if (action === 'delete') return parentPerm.canDelete;
                    if (['print', 'send', 'accept', 'reject', 'convert_to_invoice', 'cancel'].includes(action)) return parentPerm.canPrint;
                }
            }
            // Fallback mapping for sales.invoice_register.*
            if (module.startsWith('sales.invoice_register.')) {
                const parentPerm = user.permissions.find((p: any) => p.module === 'sales' || p.module === 'invoice_register');
                if (parentPerm) {
                    const action = module.replace('sales.invoice_register.', '');
                    if (action === 'view') return parentPerm.canView;
                    if (action === 'export') return parentPerm.canPrint || parentPerm.canView;
                    if (action === 'print') return parentPerm.canPrint;
                    if (action === 'send') return parentPerm.canPrint || parentPerm.canEdit;
                    if (action === 'collect_payment') return parentPerm.canAdd || parentPerm.canEdit;
                    if (action === 'zatca_retry') return parentPerm.canEdit;
                    if (action === 'void') return parentPerm.canDelete || parentPerm.canEdit;
                }
            }
        }

        return false;
    } catch (err: any) {
        // logger is async-imported to avoid circular dep at module load time
        import('@/lib/logger').then(({ logger }) => logger.error({}, 'hasPermission error', { err })).catch(() => {});
        return false;
    }
}

/**
 * Returns `true` if the user is a "legacy admin" — has the `admin` role
 * but zero explicit Permission records configured.
 *
 * Used to detect accounts that pre-date the granular permissions system
 * and need to be migrated.
 *
 * @param userId - User ID to check
 * @param prismaClient - Optional Prisma client (defaults to shared instance)
 */
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

/**
 * Higher-Order Function that wraps an API route handler with authentication.
 *
 * Provides out-of-the-box:
 * - JWT verification → 401 if invalid/missing
 * - Structured request logging (tenantId, userId, requestId, latency)
 * - Unhandled exception guard → 500 with structured error
 *
 * @example
 * ```ts
 * export const GET = withGuard(async (req, params, user) => {
 *   // user.tenantId, user.userId, user.role available here
 *   const data = await prisma.customer.findMany({ where: { tenantId: user.tenantId } });
 *   return NextResponse.json(data);
 * });
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
