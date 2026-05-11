import crypto from 'crypto';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'esignature-engine' });

/**
 * P-13: eSignature Engine — pure logic layer
 * SignatureEnvelope/SignatureEvent not in DB schema.
 * Uses in-memory store; persist to DocumentVersion or AuditLog for production.
 */

interface Signatory {
  userId: number;
  order: number;
  signedAt?: Date;
  token?: string;
  ipAddress?: string;
}

interface Envelope {
  id: string;
  documentId: number;
  tenantId: string;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
  signatories: Signatory[];
  createdAt: Date;
  expiresAt: Date;
}

const envelopes = new Map<string, Envelope>();

export class ESignatureEngine {
  static createEnvelope(tenantId: string, documentId: number, signatories: Array<{ userId: number; order: number }>): Envelope {
    const id = `ENV-${Date.now()}`;
    const envelope: Envelope = {
      id, tenantId, documentId,
      status: 'PENDING',
      signatories: signatories.map(s => ({ ...s })),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 86400000),
    };
    envelopes.set(id, envelope);
    log.info(`Envelope ${id} created for document ${documentId}`);
    return envelope;
  }

  static generateToken(envelopeId: string, userId: number): string {
    const data = `${envelopeId}:${userId}:${Date.now()}`;
    return crypto.createHmac('sha256', process.env.ESIGN_SECRET ?? 'default').update(data).digest('hex');
  }

  static sign(envelopeId: string, userId: number, ipAddress: string, token: string): Envelope {
    const envelope = envelopes.get(envelopeId);
    if (!envelope) throw new Error(`Envelope ${envelopeId} not found`);
    if (envelope.status === 'EXPIRED' || new Date() > envelope.expiresAt) throw new Error('Envelope expired');

    const signatory = envelope.signatories.find(s => s.userId === userId);
    if (!signatory) throw new Error(`User ${userId} not in signatories`);

    signatory.signedAt = new Date();
    signatory.token = token;
    signatory.ipAddress = ipAddress;

    const allSigned = envelope.signatories.every(s => s.signedAt);
    if (allSigned) {
      envelope.status = 'COMPLETED';
      log.info(`Envelope ${envelopeId} fully executed`);
    }
    return envelope;
  }

  static getEnvelope(id: string): Envelope | undefined {
    return envelopes.get(id);
  }
}
