import { prisma } from './prisma';
import crypto from 'crypto';

export class MFAEngine {

    /**
     * Generate a new TOTP Secret for a user
     */
    static async setupTOTP(userId: number) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        // In production, use `otplib` or `speakeasy`
        // const secret = authenticator.generateSecret();
        const secret = crypto.randomBytes(20).toString('hex'); // Mock secret
        
        // Generate OTP Auth URL for QR Code
        const otpauthUrl = `otpauth://totp/namainvistERP:${user.username}?secret=${secret}&issuer=namainvistERP`;

        // Save secret temporarily until verified
        await prisma.user.update({
            where: { id: userId },
            data: { totpSecret: secret, totpEnabled: false }
        });

        return { secret, otpauthUrl };
    }

    /**
     * Verify the first TOTP token to fully enable MFA
     */
    static async verifyAndEnableTOTP(userId: number, token: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.totpSecret) throw new Error("MFA setup not initiated");

        // In production: const isValid = authenticator.check(token, user.totpSecret);
        const isValid = token.length === 6; // Mock validation

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

        // In production: return authenticator.check(token, user.totpSecret);
        return token.length === 6; // Mock validation
    }

    /**
     * Step-Up Authentication logic:
     * Used before highly sensitive operations (e.g. posting large JE, changing vendor bank)
     */
    static async requireStepUpAuth(userId: number, operationContext: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        // If MFA is not enabled, we either block or allow depending on tenant policy.
        // For Enterprise PDPL compliance, we should block highly sensitive ops if MFA is off.
        if (!user?.totpEnabled) {
            throw new Error(`MFA is required for operation: ${operationContext}. Please enable MFA in security settings.`);
        }

        return {
            status: 'MFA_REQUIRED',
            message: `Please provide your 2FA token to authorize: ${operationContext}`
        };
    }
}
