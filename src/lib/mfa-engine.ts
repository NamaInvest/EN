import { prisma } from './prisma';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { encrypt, decrypt } from './encryption';

export class MFAEngine {
    /**
     * Generate a new TOTP Secret for a user
     */
    static async setupTOTP(userId: number, username: string) {
        const secret = authenticator.generateSecret();
        const otpauthUrl = authenticator.keyuri(username, 'Namasoft ERP', secret);
        
        await prisma.user.update({
            where: { id: userId },
            data: { totpSecret: encrypt(secret), totpEnabled: false }
        });

        const qrCodeUri = await QRCode.toDataURL(otpauthUrl);
        return { secret, qrCodeUri };
    }

    /**
     * Verify the first TOTP token to fully enable MFA
     */
    static async verifyAndEnableTOTP(userId: number, token: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.totpSecret) throw new Error("MFA setup not initiated");

        const secret = decrypt(user.totpSecret);
        const isValid = authenticator.verify({ token, secret });

        if (!isValid) throw new Error("Invalid TOTP token");

        await prisma.user.update({
            where: { id: userId },
            data: { totpEnabled: true }
        });

        return true;
    }

    /**
     * Verify MFA Token during Login or Step-Up Authentication
     */
    static async verifyToken(userId: number, token: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.totpEnabled || !user.totpSecret) return false;

        const secret = decrypt(user.totpSecret);
        return authenticator.verify({ token, secret });
    }

    /**
     * Generate Backup Codes (10 random 8-char codes)
     */
    static async generateBackupCodes(userId: number) {
        const codes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex').toUpperCase());
        const hashedCodes = await Promise.all(codes.map(c => bcrypt.hash(c, 10)));
        
        await prisma.user.update({
            where: { id: userId },
            data: { totpBackupCodes: hashedCodes }
        });
        
        return codes;
    }

    /**
     * Verify a backup code and consume it
     */
    static async verifyBackupCode(userId: number, code: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.totpBackupCodes?.length) return false;

        for (let i = 0; i < user.totpBackupCodes.length; i++) {
            const hashed = user.totpBackupCodes[i];
            const isValid = await bcrypt.compare(code, hashed);
            if (isValid) {
                const newCodes = [...user.totpBackupCodes];
                newCodes.splice(i, 1); // Mark as used by removing it
                await prisma.user.update({
                    where: { id: userId },
                    data: { totpBackupCodes: newCodes }
                });
                return true;
            }
        }
        return false;
    }

    /**
     * Step-Up Authentication logic:
     * Used before highly sensitive operations (e.g. posting large JE, changing vendor bank)
     */
    static async requireStepUpAuth(userId: number, operationContext: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        if (!user?.totpEnabled) {
            throw new Error(`MFA is required for operation: ${operationContext}. Please enable MFA in security settings.`);
        }

        return {
            status: 'MFA_REQUIRED',
            message: `Please provide your 2FA token to authorize: ${operationContext}`
        };
    }
}
