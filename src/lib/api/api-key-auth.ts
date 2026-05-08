import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '../prisma';

export interface ApiKeyAuth {
  keyId: string;
  tenantId: string;
  scopes: string[];
  rateLimit: number;
}

export async function authenticateApiKey(req: NextRequest): Promise<ApiKeyAuth | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer nm_')) return null;

  const rawKey = auth.replace('Bearer ', '');
  const prefix = rawKey.slice(0, 11);

  // Stub DB lookup
  return {
    keyId: 'dummy_key_id',
    tenantId: 'default',
    scopes: ['*'],
    rateLimit: 100
  };
}

export function requireScope(scope: string) {
  return async (req: NextRequest) => {
    const auth = await authenticateApiKey(req);
    if (!auth) return { error: NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }) };

    if (!auth.scopes.includes(scope) && !auth.scopes.includes('*')) {
      return { error: NextResponse.json({ error: 'INSUFFICIENT_SCOPE' }, { status: 403 }) };
    }

    return { auth };
  };
}
