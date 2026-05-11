import { prisma } from './prisma';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'field-encryption-engine' });

const ALGORITHM = 'aes-256-gcm';

export class FieldEncryptionEngine {
  private static getKey(): Buffer {
    const keyHex = process.env.FIELD_ENCRYPTION_KEY;
    if (!keyHex) throw new Error('FIELD_ENCRYPTION_KEY not set');
    return Buffer.from(keyHex, 'hex');
  }

  static encrypt(plaintext: string): { ciphertext: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, this.getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return { ciphertext: encrypted.toString('base64'), iv: iv.toString('hex'), authTag: authTag.toString('hex') };
  }

  static decrypt(ciphertext: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(ALGORITHM, this.getKey(), Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]);
    return decrypted.toString('utf8');
  }

  static async storeEncryptedField(entityType: string, entityId: number, fieldName: string, plaintext: string) {
    const { ciphertext, iv, authTag } = this.encrypt(plaintext);
    const dekId = `DEK-${Date.now()}`;
    log.info(`Encrypting ${entityType}#${entityId}.${fieldName}`);
    return prisma.encryptedField.create({ data: { entityType, entityId, fieldName, ciphertext, iv, authTag, dekId } });
  }

  static async getDecryptedField(entityType: string, entityId: number, fieldName: string): Promise<string | null> {
    const record = await prisma.encryptedField.findFirst({ where: { entityType, entityId, fieldName } });
    if (!record) return null;
    return this.decrypt(record.ciphertext, record.iv, record.authTag);
  }
}
