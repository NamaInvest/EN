/**
 * TOTP (Time-based One-Time Password) — RFC 6238
 * Lightweight implementation using Node.js crypto (no external deps)
 */
import crypto from 'crypto';

const DIGITS = 6;
const PERIOD = 30; // seconds
const ALGORITHM = 'sha1';

/** Generate a random Base32 secret (20 bytes = 32 chars) */
export function generateTOTPSecret(): string {
    const buffer = crypto.randomBytes(20);
    return base32Encode(buffer);
}

/** Generate current TOTP code for a given secret */
export function generateTOTP(secret: string, time?: number): string {
    const epoch = Math.floor((time ?? Date.now() / 1000) / PERIOD);
    const buf = Buffer.alloc(8);
    buf.writeBigInt64BE(BigInt(epoch));
    const hmac = crypto.createHmac(ALGORITHM, base32Decode(secret));
    hmac.update(buf);
    const hash = hmac.digest();
    const offset = hash[hash.length - 1] & 0x0f;
    const code = (
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff)
    ) % (10 ** DIGITS);
    return code.toString().padStart(DIGITS, '0');
}

/** Verify a TOTP token (allows ±1 window drift) */
export function verifyTOTP(secret: string, token: string): boolean {
    const now = Math.floor(Date.now() / 1000);
    for (let drift = -1; drift <= 1; drift++) {
        const expected = generateTOTP(secret, now + drift * PERIOD);
        if (expected === token) return true;
    }
    return false;
}

/** Build otpauth:// URI for QR code scanning (Google Auth, Authy, etc.) */
export function buildTOTPUri(secret: string, username: string, issuer = 'NamaInvest'): string {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${PERIOD}`;
}

// ─── Base32 helpers ──────────────────────────────────────────────────────────
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
    let bits = 0, value = 0, output = '';
    for (const byte of buffer) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            output += B32[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) output += B32[(value << (5 - bits)) & 31];
    return output;
}

function base32Decode(encoded: string): Buffer {
    const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
    let bits = 0, value = 0;
    const output: number[] = [];
    for (const c of cleaned) {
        value = (value << 5) | B32.indexOf(c);
        bits += 5;
        if (bits >= 8) {
            output.push((value >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }
    return Buffer.from(output);
}
