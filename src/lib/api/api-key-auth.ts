import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';

export interface ApiKeyAuth {
  keyId: number;
  tenantId: string;
  scopes: string[];
  rateLimit: number;
}

export async function authenticateApiKey(req: NextRequest): Promise<ApiKeyAuth | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer nm_')) return null;

  const rawKey = auth.replace('Bearer ', '');

  // Fetch all active API keys (since we don't have a prefix in the current schema)
  const candidates = await prisma.apiKey.findMany({
    where: { 
      isActive: true, 
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
  });

  for (const candidate of candidates) {
    if (await bcrypt.compare(rawKey, candidate.keyHash)) {
      // Update lastUsedAt asynchronously
      prisma.apiKey.update({
        where: { id: candidate.id },
        data: { lastUsedAt: new Date() },
      }).catch(() => {});

      // Parse scopes from JSON string
      let parsedScopes: string[] = [];
      try {
        parsedScopes = JSON.parse(candidate.scopes || '[]');
      } catch {
        parsedScopes = [];
      }

      return {
        keyId: candidate.id,
        tenantId: candidate.tenantId,
        scopes: parsedScopes,
        rateLimit: 100, // Default since it's missing from schema
      };
    }
  }

  return null;
}

// Scope enforcement helper middleware
export function requireScope(scope: string) {
  return async (req: NextRequest) => {
    const auth = await authenticateApiKey(req);
    if (!auth) {
      return { error: NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }) };
    }

    if (!auth.scopes.includes(scope) && !auth.scopes.includes('*')) {
      return { error: NextResponse.json({ error: 'INSUFFICIENT_SCOPE' }, { status: 403 }) };
    }

    return { auth };
  };
}
