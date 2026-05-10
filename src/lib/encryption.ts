/**
 * Application-Level Encryption — تشفير البيانات الحساسة
 * يستخدم AES-256-GCM لتشفير الحقول مثل IBAN وأرقام الهوية
 */

import crypto from 'crypto';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'encryption' });

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || 'nama-invest-default-encryption-key-2026';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * تشفير نص عادي → نص مشفر (base64)
 * التنسيق: IV:AuthTag:CipherText (الكل base64)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // IV:Tag:Cipher
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

/**
 * فك تشفير نص مشفر → نص عادي
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext || !ciphertext.includes(':')) return ciphertext;

  try {
    const key = getKey();
    const parts = ciphertext.split(':');
    if (parts.length !== 3) return ciphertext;

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    // إذا فشل فك التشفير، ارجع النص كما هو (ربما غير مشفر)
    return ciphertext;
  }
}

/**
 * تحقق مما إذا كان النص مشفراً
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;
  const parts = text.split(':');
  return parts.length === 3 && parts[0].length >= 20;
}

/**
 * قناع النص لعرضه مخفياً (مثل IBAN)
 * مثال: "SA03800000006080" → "SA03****6080"
 */
export function maskSensitive(text: string, showFirst: number = 4, showLast: number = 4): string {
  if (!text || text.length <= showFirst + showLast) return text;
  const first = text.slice(0, showFirst);
  const last = text.slice(-showLast);
  const masked = '*'.repeat(Math.min(text.length - showFirst - showLast, 8));
  return `${first}${masked}${last}`;
}
