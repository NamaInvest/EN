import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'namainvest-secret';

export interface JWTPayload {
    userId: number;
    username: string;
    role: string;
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
export async function hasPermission(userId: number, module: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { permissions: true },
    });
    if (!user) return false;

    // Admin and Owner always have full access
    if (user.role === 'admin' || user.role === 'owner') return true;

    // Explicit permissions override role
    if (user.permissions.length > 0) {
        return user.permissions.some(p => p.module === module);
    }

    return false;
}

// Check if user is a legacy admin (admin role with zero permission records)
export async function isLegacyAdmin(userId: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { permissions: true },
    });
    if (!user) return false;
    return user.permissions.length === 0 && user.role === 'admin';
}
