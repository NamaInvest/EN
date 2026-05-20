import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROVISION_SECRET = process.env.PROVISION_SECRET || 'namainvest-provision-2024';

const VerifySchema = z.object({
  trialToken: z.string().optional(),
  subdomain: z.string().optional(),
  fingerprint: z.string().optional()
});

async function _POST(req: Request) {
  let masterPrisma: PrismaClient | null = null;
  try {
    const body = await req.json();
    const parsed = VerifySchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'Invalid payload' 
      }, { status: 400 });
    }

    const { trialToken, subdomain, fingerprint } = parsed.data;
    
    // Validate Token if provided
    let tokenPayload: any = null;
    if (trialToken) {
      const [payload64, sig] = trialToken.split('.');
      if (payload64 && sig) {
        const expectedSig = createHmac('sha256', PROVISION_SECRET).update(payload64).digest('hex');
        if (expectedSig === sig) {
          try {
            tokenPayload = JSON.parse(Buffer.from(payload64, 'base64url').toString('utf-8'));
          } catch(e) {}
        }
      }
    }

    // Determine target subdomain
    const targetSubdomain = tokenPayload?.subdomain || subdomain;
    if (!targetSubdomain) {
      return NextResponse.json({ 
        valid: false, 
        reason: 'Missing subdomain or invalid token' 
      }, { status: 400 });
    }

    const baseDbUrl = process.env.DATABASE_URL;
    if (!baseDbUrl) throw new Error('DATABASE_URL is missing');
    const masterUrl = baseDbUrl.replace(/\/([^/?]+)(\?|$)/, `/n11_db$2`);
    
    masterPrisma = new PrismaClient({ datasources: { db: { url: masterUrl } } });

    // Lookup tenant account
    const tenantAccount = await masterPrisma.tenantAccount.findUnique({
      where: { subdomain: targetSubdomain }
    });

    if (!tenantAccount) {
      return NextResponse.json({ valid: false, reason: 'Company not found' }, { status: 404 });
    }

    // Lookup Desktop License
    const license = await masterPrisma.desktopLicense.findFirst({
      where: { tenantAccountId: tenantAccount.id },
      orderBy: { id: 'desc' }
    });

    const now = new Date();
    
    const trialEndsAt = license?.trialEndsAt || tenantAccount.trialEndsAt;
    
    if (!trialEndsAt) {
      return NextResponse.json({ valid: false, reason: 'No trial date registered' }, { status: 403 });
    }

    const daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining <= 0;

    if (isExpired) {
       return NextResponse.json({
         valid: false,
         trialStatus: 'EXPIRED',
         reason: 'Trial has expired',
         serverTime: now.toISOString(),
         trialEndsAt: trialEndsAt.toISOString(),
         daysRemaining: 0,
         tenantId: tenantAccount.id.toString(),
         workspaceUrl: `https://${tenantAccount.subdomain}.namainvist.com`
       });
    }

    return NextResponse.json({
         valid: true,
         trialStatus: 'ACTIVE',
         serverTime: now.toISOString(),
         trialStartsAt: license?.activatedAt?.toISOString() || tenantAccount.createdAt.toISOString(),
         trialEndsAt: trialEndsAt.toISOString(),
         daysRemaining,
         tenantId: tenantAccount.id.toString(),
         workspaceUrl: `https://${tenantAccount.subdomain}.namainvist.com`
    });

  } catch (err: any) {
    return NextResponse.json({ valid: false, reason: err.message }, { status: 500 });
  } finally {
    if (masterPrisma) await masterPrisma.$disconnect();
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'AUTH', requireAuth: false });
