// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { MfaEngine } from '@/lib/mfa-engine';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, code } = body;
        if (!userId || !code) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

        // First verify the code
        const requestInfo = {
            ipAddress: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
            userAgent: req.headers.get('user-agent') || 'unknown'
        };
        await MfaEngine.verify(userId, code, 'totp', requestInfo);

        // Delete old backup codes
        await prisma.userBackupCode.deleteMany({ where: { userId } });

        // Generate new backup codes
        const backupCodes = Array.from({ length: 10 }, () => {
            const c1 = crypto.randomBytes(2).toString('hex').toUpperCase();
            const c2 = crypto.randomBytes(2).toString('hex').toUpperCase();
            return `${c1}-${c2}`;
        });

        const batchId = crypto.randomUUID();
        const backupCodePromises = backupCodes.map(async backupCode => {
            const codeHash = await bcrypt.hash(backupCode, 10);
            return prisma.userBackupCode.create({
                data: {
                    userId,
                    codeHash,
                    codeHint: backupCode.substring(0, 2) + '••-••' + backupCode.substring(7),
                    generatedBatchId: batchId
                }
            });
        });

        await Promise.all(backupCodePromises);

        await prisma.auditLog.create({
            data: {
                action: 'MFA_BACKUP_CODES_REGENERATED',
                entity: 'User',
                entityId: userId.toString(),
                userId: userId
            }
        });

        return NextResponse.json({ success: true, backupCodes });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 401 });
    }
}
