/**
 * API Key Authentication — P2.8
 * ─────────────────────────────────────────────────────────────────────────────
 * DB-backed API key verification using the ApiKey model.
 *
 * Key format:  nm_<random_hex_48_chars>   (total 51 chars)
 * Storage:     SHA-256 hash of the key (never plaintext)
 * Scopes:      JSON array e.g. ['READ:GL', 'WRITE:AP', '*']
 *
 * Usage:
 *   Authorization: Bearer nm_<key>
 *
 * Key generation (one-time, on creation):
 *   node -e "log.info('nm_' + require('crypto').randomBytes(24).toString('hex'))"
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPrisma } from '../prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.api.api-key-' });

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiKeyAuth {
  keyId:    number;
  tenantId: string;
  name:     string;
  scopes:   string[];
  rateLimit: number;  // requests per minute
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const KEY_PREFIX = 'nm_';

function hashKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function parseScopes(scopesJson: string): string[] {
  try {
    const parsed = JSON.parse(scopesJson);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return scopesJson.split(',').map((s) => s.trim());
  }
}

// Simple in-memory LRU cache to avoid repeated DB hits (TTL: 5 min)
const keyCache = new Map<string, { auth: ApiKeyAuth | null; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// ── Main Authenticator ────────────────────────────────────────────────────────

export async function authenticateApiKey(req: NextRequest): Promise<ApiKeyAuth | null> {
  const authHeader = req.headers.get('Authorization') ?? req.headers.get('X-API-Key');
  if (!authHeader) return null;

  // Accept both "Bearer nm_..." and raw "nm_..."
  const rawKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!rawKey.startsWith(KEY_PREFIX)) return null;

  // Check cache
  const hash = hashKey(rawKey);
  const cached = keyCache.get(hash);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.auth;
  }

  // DB lookup
  try {
    const prisma = getPrisma() as any;
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        keyHash: hash,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { id: true, tenantId: true, name: true, scopes: true },
    });

    if (!apiKey) {
      keyCache.set(hash, { auth: null, expiresAt: Date.now() + CACHE_TTL });
      return null;
    }

    // Update last used (fire-and-forget)
    prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    const auth: ApiKeyAuth = {
      keyId:     apiKey.id,
      tenantId:  apiKey.tenantId,
      name:      apiKey.name,
      scopes:    parseScopes(apiKey.scopes),
      rateLimit: 100, // default rpm (could be on the model)
    };

    keyCache.set(hash, { auth, expiresAt: Date.now() + CACHE_TTL });
    return auth;

  } catch {
    return null;
  }
}

// ── Scope Guard ───────────────────────────────────────────────────────────────

export function requireScope(scope: string) {
  return async (req: NextRequest): Promise<{ error?: NextResponse; auth?: ApiKeyAuth }> => {
    const auth = await authenticateApiKey(req);

    if (!auth) {
      return {
        error: NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Valid API key required (X-API-Key or Authorization: Bearer nm_...)' },
          { status: 401 }
        ),
      };
    }

    const hasScope = auth.scopes.includes('*') || auth.scopes.includes(scope);
    if (!hasScope) {
      return {
        error: NextResponse.json(
          { error: 'INSUFFICIENT_SCOPE', required: scope, granted: auth.scopes },
          { status: 403 }
        ),
      };
    }

    return { auth };
  };
}

// ── Cache Invalidation ────────────────────────────────────────────────────────

export function invalidateApiKeyCache(rawKey?: string) {
  if (rawKey) {
    keyCache.delete(hashKey(rawKey));
  } else {
    keyCache.clear();
  }
}

// ── Key Generation Helper (for admin API) ─────────────────────────────────────

export function generateApiKey(): { rawKey: string; keyHash: string } {
  const rawKey = KEY_PREFIX + crypto.randomBytes(24).toString('hex');
  return { rawKey, keyHash: hashKey(rawKey) };
}
