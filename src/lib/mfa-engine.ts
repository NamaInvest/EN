// @ts-nocheck
import { prisma } from './prisma';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef'; // Must be 32 bytes
const ALGORITHM = 'aes-256-gcm';

function encryptSecret(text: string) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return { encrypted, iv: iv.toString('hex'), authTag };
}

function decryptSecret(encrypted: string, iv: string, authTag: string) {
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export class MfaEngine {
    static async enroll(userId: number, method: 'TOTP') {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        const secret = authenticator.generateSecret();
        const { encrypted, iv, authTag } = encryptSecret(secret);

        await prisma.user.update({
            where: { id: userId },
            data: {
                totpSecretEncrypted: encrypted,
                totpIv: iv,
                totpAuthTag: authTag,
                mfaPendingActivation: true,
                mfaMethod: method
            }
        });

        const otpauthUrl = authenticator.keyuri(user.username, 'Namasoft ERP', secret);
        const qrCodeImage = await QRCode.toDataURL(otpauthUrl);

        return { qrCodeImage, secret };
    }

    static async confirmEnrollment(userId: number, code: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.totpSecretEncrypted || !user.totpIv || !user.totpAuthTag) {
            throw new Error('Enrollment not initiated');
        }

        const secret = decryptSecret(user.totpSecretEncrypted, user.totpIv, user.totpAuthTag);
        const isValid = authenticator.verify({ token: code, secret });

        if (!isValid) throw new Error('Invalid code');

        // Generate backup codes
        const backupCodes = Array.from({ length: 10 }, () => {
            const c1 = crypto.randomBytes(2).toString('hex').toUpperCase();
            const c2 = crypto.randomBytes(2).toString('hex').toUpperCase();
            return `${c1}-${c2}`;
        });

        const batchId = crypto.randomUUID();
        const backupCodePromises = backupCodes.map(async code => {
            const codeHash = await bcrypt.hash(code, 10);
            return prisma.userBackupCode.create({
                data: {
                    userId,
                    codeHash,
                    codeHint: code.substring(0, 2) + '••-••' + code.substring(7),
                    generatedBatchId: batchId
                }
            });
        });

        await Promise.all(backupCodePromises);

        await prisma.user.update({
            where: { id: userId },
            data: {
                mfaEnabled: true,
                mfaPendingActivation: false,
                mfaEnrolledAt: new Date()
            }
        });

        await prisma.auditLog.create({
            data: {
                action: 'MFA_ENROLLED',
                entity: 'User',
                entityId: userId.toString(),
                details: JSON.stringify({ method: 'TOTP' }),
                userId: userId
            }
        });

        return { success: true, backupCodes };
    }

    static async verify(userId: number, code: string, method: string = 'totp', requestInfo: any = {}) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.mfaEnabled) throw new Error('MFA not enabled');

        if (user.mfaLockedUntil && user.mfaLockedUntil > new Date()) {
            throw new Error('Account locked due to too many failed MFA attempts. Try again later.');
        }

        let isValid = false;

        if (method === 'totp') {
            if (!user.totpSecretEncrypted || !user.totpIv || !user.totpAuthTag) throw new Error('TOTP not configured');
            
            // Replay protection check
            const codeHash = crypto.createHash('sha256').update(code).digest('hex');
            const usedToken = await prisma.mfaUsedToken.findUnique({ where: { userId_tokenHash: { userId, tokenHash: codeHash } } });
            if (usedToken) {
                await this._logAttempt(userId, false, method, requestInfo, 'replay');
                throw new Error('Token already used. Please wait for the next code.');
            }

            const secret = decryptSecret(user.totpSecretEncrypted, user.totpIv, user.totpAuthTag);
            isValid = authenticator.verify({ token: code, secret });

            if (isValid) {
                // Save token for replay protection (TTL 90s)
                await prisma.mfaUsedToken.create({
                    data: {
                        userId,
                        tokenHash: codeHash,
                        expiresAt: new Date(Date.now() + 90000)
                    }
                });
            }
        }

        if (isValid) {
            await prisma.user.update({
                where: { id: userId },
                data: { mfaFailedAttempts: 0, mfaLockedUntil: null, mfaLastUsedAt: new Date() }
            });
            await this._logAttempt(userId, true, method, requestInfo);
            return true;
        } else {
            const failedAttempts = user.mfaFailedAttempts + 1;
            let lockedUntil = null;
            if (failedAttempts >= 5) {
                lockedUntil = new Date(Date.now() + 30 * 60000); // lock for 30 mins
            }
            await prisma.user.update({
                where: { id: userId },
                data: { mfaFailedAttempts: failedAttempts, mfaLockedUntil: lockedUntil }
            });
            await this._logAttempt(userId, false, method, requestInfo, 'invalid_code');
            throw new Error('Invalid code');
        }
    }

    static async verifyBackupCode(userId: number, code: string, requestInfo: any = {}) {
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { backupCodes: true } });
        if (!user || !user.mfaEnabled) throw new Error('MFA not enabled');

        const availableCodes = user.backupCodes.filter(c => !c.usedAt);
        let validCode = null;

        for (const backupCode of availableCodes) {
            const isMatch = await bcrypt.compare(code, backupCode.codeHash);
            if (isMatch) {
                validCode = backupCode;
                break;
            }
        }

        if (validCode) {
            await prisma.userBackupCode.update({
                where: { id: validCode.id },
                data: { usedAt: new Date(), ipUsedFrom: requestInfo.ipAddress, userAgentUsed: requestInfo.userAgent }
            });
            await prisma.user.update({
                where: { id: userId },
                data: { mfaFailedAttempts: 0, mfaLockedUntil: null, mfaLastUsedAt: new Date() }
            });
            await this._logAttempt(userId, true, 'backup_code', requestInfo);
            return true;
        } else {
            await this._logAttempt(userId, false, 'backup_code', requestInfo, 'invalid_code');
            throw new Error('Invalid backup code');
        }
    }

    static async trustDevice(userId: number, deviceName: string, days: number, requestInfo: any = {}) {
        const deviceFingerprint = crypto.randomUUID(); // Simplified fingerprint
        return prisma.trustedDevice.create({
            data: {
                userId,
                deviceFingerprint,
                deviceName,
                browser: requestInfo.browser,
                os: requestInfo.os,
                ipAddress: requestInfo.ipAddress || 'unknown',
                trustedUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
            }
        });
    }

    static async disable(userId: number) {
        // Assume password/code were verified before calling this
        await prisma.user.update({
            where: { id: userId },
            data: {
                totpSecretEncrypted: null,
                totpIv: null,
                totpAuthTag: null,
                mfaEnabled: false,
                mfaMethod: null,
                mfaPendingActivation: false,
                mfaEnrolledAt: null,
                mfaLastUsedAt: null,
                mfaFailedAttempts: 0,
                mfaLockedUntil: null
            }
        });

        // Also delete backup codes and trusted devices
        await prisma.userBackupCode.deleteMany({ where: { userId } });
        await prisma.trustedDevice.deleteMany({ where: { userId } });

        await prisma.auditLog.create({
            data: {
                action: 'MFA_DISABLED',
                entity: 'User',
                entityId: userId.toString(),
                userId: userId
            }
        });

        return { success: true };
    }

    private static async _logAttempt(userId: number, success: boolean, method: string, requestInfo: any, failureReason?: string) {
        await prisma.mfaAttempt.create({
            data: {
                userId,
                success,
                method,
                ipAddress: requestInfo.ipAddress,
                userAgent: requestInfo.userAgent,
                failureReason
            }
        });
    }
}
