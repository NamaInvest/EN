/**
 * API Keys Runtime
 * ──────────────────────────────────────────────────────────
 * Manages API keys for external integrations (B2B, partners, POS devices).
 * Keys are hashed (SHA-256) and never stored in plain text.
 *
 * Usage:
 *   import { apiKeys } from '@/lib/api-keys';
 *
 *   // Generate new key
 *   const { key, keyId } = apiKeys.generate('Partner XYZ', ['read:invoices', 'write:orders']);
 *
 *   // Validate in middleware
 *   const valid = apiKeys.validate(req.headers.get('x-api-key'));
 */

import crypto from 'crypto';
import { logger } from '@/lib/logger';

const log = logger.child({ route: 'APIKeys' });

interface APIKeyRecord {
  id: string;
  name: string;
  hashedKey: string;
  prefix: string; // First 8 chars for identification
  scopes: string[];
  active: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  rateLimit: number; // requests per minute
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

// In-memory store — migrate to DB for persistence
const keyStore = new Map<string, APIKeyRecord>();

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export const apiKeys = {
  /** Generate a new API key */
  generate(
    name: string,
    scopes: string[] = ['*'],
    options: { expiresInDays?: number; rateLimit?: number; metadata?: Record<string, unknown> } = {}
  ): { key: string; keyId: string; prefix: string } {
    const key = `nk_${crypto.randomBytes(32).toString('hex')}`; // nk_ = nama key
    const prefix = key.substring(0, 11); // nk_XXXXXXXX
    const hashedKey = hashKey(key);
    const id = crypto.randomBytes(8).toString('hex');

    const record: APIKeyRecord = {
      id,
      name,
      hashedKey,
      prefix,
      scopes,
      active: true,
      rateLimit: options.rateLimit || 60,
      createdAt: new Date(),
      expiresAt: options.expiresInDays
        ? new Date(Date.now() + options.expiresInDays * 86400000)
        : undefined,
      metadata: options.metadata,
    };

    keyStore.set(hashedKey, record);
    log.info(`API key generated: ${id} (${name}) — scopes: [${scopes.join(', ')}]`);

    return { key, keyId: id, prefix };
  },

  /** Validate an API key and return the record if valid */
  validate(key: string | null): APIKeyRecord | null {
    if (!key) return null;

    const hashed = hashKey(key);
    const record = keyStore.get(hashed);

    if (!record) return null;
    if (!record.active) return null;
    if (record.expiresAt && record.expiresAt < new Date()) {
      record.active = false;
      return null;
    }

    // Update last used
    record.lastUsedAt = new Date();
    return record;
  },

  /** Check if a key has a specific scope */
  hasScope(record: APIKeyRecord, scope: string): boolean {
    return record.scopes.includes('*') || record.scopes.includes(scope);
  },

  /** Revoke an API key by ID */
  revoke(keyId: string): boolean {
    for (const [hash, record] of keyStore.entries()) {
      if (record.id === keyId) {
        record.active = false;
        log.info(`API key revoked: ${keyId} (${record.name})`);
        return true;
      }
    }
    return false;
  },

  /** List all keys (without revealing the actual key) */
  list(): Array<Omit<APIKeyRecord, 'hashedKey'>> {
    return [...keyStore.values()].map(({ hashedKey, ...rest }) => rest);
  },

  /** Stats */
  stats(): { total: number; active: number; expired: number } {
    const all = [...keyStore.values()];
    const now = new Date();
    return {
      total: all.length,
      active: all.filter(k => k.active && (!k.expiresAt || k.expiresAt > now)).length,
      expired: all.filter(k => k.expiresAt && k.expiresAt <= now).length,
    };
  },
};

// ── Available Scopes ──
export const API_SCOPES = [
  'read:invoices', 'write:invoices',
  'read:products', 'write:products',
  'read:customers', 'write:customers',
  'read:inventory', 'write:inventory',
  'read:accounting', 'write:accounting',
  'read:reports',
  'read:employees',
  'pos:checkout',
  '*', // Full access
] as const;
