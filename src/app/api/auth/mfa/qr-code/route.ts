// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-byte-encryption-key!!!';
const ALGORITHM = 'aes-256-gcm';

function decryptSecret(encrypted: string, iv: string, authTag: string) {
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userIdStr = searchParams.get('userId');
        if (!userIdStr) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

        const userId = parseInt(userIdStr);
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user || !user.totpSecretEncrypted || !user.totpIv || !user.totpAuthTag) {
            return NextResponse.json({ error: 'MFA not enrolled' }, { status: 400 });
        }

        const secret = decryptSecret(user.totpSecretEncrypted, user.totpIv, user.totpAuthTag);
        const otpauthUrl = `otpauth://totp/Namasoft%20ERP:${user.username}?secret=${secret}&issuer=Namasoft%20ERP`;
        const qrCodeImage = await QRCode.toDataURL(otpauthUrl);

        return NextResponse.json({ qrCodeImage });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
