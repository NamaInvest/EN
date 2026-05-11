/**
 * IFRS 16 Lease API
 * GET  /api/finance/ifrs16-lease?leaseId=X   — Get schedule for a lease
 * POST /api/finance/ifrs16-lease { action: 'recognize', ...LeaseInput }
 * POST /api/finance/ifrs16-lease { action: 'monthly-entry', leaseId, period }
 * GET  /api/finance/ifrs16-lease?action=portfolio — All active leases summary
 */
import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getUserFromRequest } from '@/lib/auth';
import { IFRS16LeaseEngine, LeaseInput } from '@/lib/ifrs16-lease-engine';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.finance.ifrs16-lease' });

async function _GET(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const action   = searchParams.get('action');
    const leaseId  = searchParams.get('leaseId') ? parseInt(searchParams.get('leaseId')!) : null;

    // Portfolio summary from DB
    if (action === 'portfolio') {
      const leases = await prisma.ifrsLeaseContract.findMany({
        where: { status: { in: ['ACTIVE', 'DRAFT'] } },
        select: {
          id: true, assetDescription: true, leaseClass: true,
          startDate: true, endDate: true,
          termMonths: true, paymentAmount: true,
          ibr: true, currency: true,
          rouAssetValue: true, liabilityValue: true, status: true,
        },
        orderBy: { startDate: 'desc' },
        take: 100,
      }).catch(() => [] as any[]);

      return NextResponse.json({
        count: leases.length,
        totalROU:       (leases as any[]).reduce((s: number, l: any) => s + Number(l.rouAssetValue  || 0), 0),
        totalLiability: (leases as any[]).reduce((s: number, l: any) => s + Number(l.liabilityValue || 0), 0),
        leases,
      });
    }

    // Single lease schedule (in-memory calculation)
    if (leaseId) {
      const dbLease = await prisma.ifrsLeaseContract.findUnique({
        where: { id: leaseId },
      }).catch(() => null);

      if (!dbLease) return NextResponse.json({ error: 'عقد الإيجار غير موجود' }, { status: 404 });

      const input: LeaseInput = {
        leaseId:                  (dbLease as any).id,
        description:              (dbLease as any).assetDescription || '',
        commencementDate:         new Date((dbLease as any).startDate),
        leaseTerm:                Number((dbLease as any).termMonths || 12),
        monthlyPayment:           Number((dbLease as any).paymentAmount || 0),
        incrementalBorrowingRate: Number((dbLease as any).ibr || 0.06),
        currency:                 (dbLease as any).currency || 'SAR',
        initialDirectCosts:       Number((dbLease as any).initialDirectCosts || 0),
        incentivesReceived:       Number((dbLease as any).leaseIncentive || 0),
        isShortTerm:              (dbLease as any).exemption === 'SHORT_TERM',
        isLowValue:               (dbLease as any).exemption === 'LOW_VALUE',
      };

      const schedule = IFRS16LeaseEngine.recognize(input);
      return NextResponse.json(schedule);
    }

    return NextResponse.json({ error: 'أرسل leaseId أو action=portfolio' }, { status: 400 });
  } catch (error: any) {
    log.error('IFRS16 GET error:', error);
    return NextResponse.json({ error: 'فشل جلب بيانات عقد الإيجار' }, { status: 500 });
  }
}

async function _POST(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body   = await request.json();
    const action = body.action;

    // Recognize new lease (pure calculation — no DB save yet)
    if (action === 'recognize') {
      const input: LeaseInput = {
        leaseId:                  body.leaseId,
        description:              body.description || 'عقد إيجار',
        commencementDate:         new Date(body.commencementDate),
        leaseTerm:                parseInt(body.leaseTerm),
        monthlyPayment:           parseFloat(body.monthlyPayment),
        incrementalBorrowingRate: parseFloat(body.incrementalBorrowingRate),
        currency:                 body.currency || 'SAR',
        isShortTerm:              body.isShortTerm || false,
        isLowValue:               body.isLowValue  || false,
        initialDirectCosts:       parseFloat(body.initialDirectCosts || 0),
        incentivesReceived:       parseFloat(body.incentivesReceived || 0),
        residualValueGuarantee:   parseFloat(body.residualValueGuarantee || 0),
      };

      const result = IFRS16LeaseEngine.recognize(input);
      return NextResponse.json(result);
    }

    // Get monthly journal entry for a specific period
    if (action === 'monthly-entry') {
      const { leaseId, period } = body;
      if (!leaseId || !period) {
        return NextResponse.json({ error: 'leaseId و period مطلوبان' }, { status: 400 });
      }

      const dbLease = await prisma.ifrsLeaseContract.findUnique({
        where: { id: parseInt(leaseId) },
      }).catch(() => null);

      if (!dbLease) return NextResponse.json({ error: 'عقد غير موجود' }, { status: 404 });

      const input: LeaseInput = {
        leaseId:                  (dbLease as any).id,
        description:              (dbLease as any).assetDescription || '',
        commencementDate:         new Date((dbLease as any).startDate),
        leaseTerm:                Number((dbLease as any).termMonths || 12),
        monthlyPayment:           Number((dbLease as any).paymentAmount || 0),
        incrementalBorrowingRate: Number((dbLease as any).ibr || 0.06),
        initialDirectCosts:       Number((dbLease as any).initialDirectCosts || 0),
        incentivesReceived:       Number((dbLease as any).leaseIncentive || 0),
        isShortTerm:              (dbLease as any).exemption === 'SHORT_TERM',
        isLowValue:               (dbLease as any).exemption === 'LOW_VALUE',
      };

      const lease   = IFRS16LeaseEngine.recognize(input);
      const entries = IFRS16LeaseEngine.getMonthlyEntries(lease, parseInt(period));
      return NextResponse.json(entries);
    }

    return NextResponse.json({ error: 'action غير معروف' }, { status: 400 });
  } catch (error: any) {
    log.error('IFRS16 POST error:', error);
    return NextResponse.json({ error: 'فشل معالجة عقد الإيجار' }, { status: 500 });
  }
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
