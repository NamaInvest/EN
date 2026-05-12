import crypto from 'crypto';

/**
 * 🛡️ ZATCA Vault
 * ══════════════════════════════════════════════════════
 * Secure handling of ZATCA Cryptographic keys (CSR & Private Keys).
 * Never store private keys in plaintext. Uses AES-256-GCM for authenticated encryption.
 */

const ENCRYPTION_KEY = process.env.ZATCA_VAULT_KEY; // Must be 32 bytes (256-bit), provided as 64-char hex
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

export class ZatcaVault {
  
  /**
   * Encrypts a plaintext private key before storing in database.
   * Uses AES-256-GCM with a random IV, Salt, and PBKDF2 Key Derivation.
   */
  static encryptPrivateKey(plaintextKey: string): string {
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
      throw new Error('Critical Security Error: ZATCA_VAULT_KEY (32-byte hex) is missing or invalid in environment variables.');
    }

    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Key derivation for extra security against brute force
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');

    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    let encrypted = cipher.update(plaintextKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:salt:authTag:encryptedData
    return `${iv.toString('hex')}:${salt.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts an encrypted private key stored in database (for signing in RAM only).
   */
  static decryptPrivateKey(encryptedPayload: string): string {
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
      throw new Error('Critical Security Error: ZATCA_VAULT_KEY (32-byte hex) is missing or invalid in environment variables.');
    }

    const parts = encryptedPayload.split(':');
    if (parts.length !== 4) {
      throw new Error('ZATCA Vault Decryption Error: Invalid payload format. Expected iv:salt:authTag:encryptedData');
    }

    const [ivHex, saltHex, authTagHex, encryptedText] = parts;
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const salt = Buffer.from(saltHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');

    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
