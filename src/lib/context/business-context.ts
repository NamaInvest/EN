import { NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'context.business-context' });

export interface BusinessContext {
  tenant: any;
  user: any;
  branch: any;
  fiscal: any;
  settings: any;
  meta: any;
  requirePermission?: (permission: string) => void;
}

export async function buildBusinessContext(req: NextRequest): Promise<BusinessContext> {
  const { userId, sessionClaims } = await auth();
  const tenantId = req.headers.get('x-tenant-id') || (sessionClaims?.tenantId as string);
  const prisma = getPrisma();

  let tenant = null;
  let user = null;
  let branch = null;
  let fiscal = null;
  let settings = null;

  if (tenantId) {
      tenant = await (prisma as any).tenantAccount?.findUnique({ where: { id: tenantId } }).catch(() => null);
  }
  
  if (userId) {
      user = await (prisma as any).user?.findUnique({ where: { id: userId } }).catch(() => null);
  }

  // Fallbacks if they fail or models don't exist exactly like this
  return { 
      tenant, 
      user, 
      branch, 
      fiscal, 
      settings, 
      meta: {
          requestId: req.headers.get('x-request-id'),
          userAgent: req.headers.get('user-agent'),
      } 
  };
}
