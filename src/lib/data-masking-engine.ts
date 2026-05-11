import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'data-masking-engine' });

/** P-08: Data Masking for GDPR / privacy compliance */
export class DataMaskingEngine {
  /** Mask email: j***@domain.com */
  static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local[0]}***@${domain}`;
  }

  /** Mask phone: +966-5X-XXXX-1234 */
  static maskPhone(phone: string): string {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  /** Mask IBAN: SA44 2000 **** **** **** 1234 */
  static maskIBAN(iban: string): string {
    return iban.slice(0, 4) + ' **** **** **** ' + iban.slice(-4);
  }

  /** Mask national ID: 1***5 */
  static maskNationalId(id: string): string {
    return id[0] + '*'.repeat(id.length - 2) + id[id.length - 1];
  }

  /** Apply masking based on field type */
  static mask(value: string, type: 'EMAIL' | 'PHONE' | 'IBAN' | 'NATIONAL_ID' | 'NAME'): string {
    switch (type) {
      case 'EMAIL':       return this.maskEmail(value);
      case 'PHONE':       return this.maskPhone(value);
      case 'IBAN':        return this.maskIBAN(value);
      case 'NATIONAL_ID': return this.maskNationalId(value);
      case 'NAME':        return value.split(' ').map((w, i) => i === 0 ? w : '*'.repeat(w.length)).join(' ');
      default:            return '***';
    }
  }

  /** Audit log for data access */
  static async logAccess(tenantId: string, userId: number, tableName: string, recordId: string, fieldsAccessed: string[]) {
    return prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'DATA_ACCESS',
        tableName,
        recordId,
        details: JSON.stringify({ fieldsAccessed }),
      },
    });
  }
}
