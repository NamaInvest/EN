/**
 * Open Items API — Multi-currency AR/AP with FX, Disputes, Tolerance
 *
 * POST /api/accounting/open-items/apply-payment
 * POST /api/accounting/open-items/mark-disputed
 * POST /api/accounting/open-items/resolve-dispute
 * POST /api/accounting/open-items/reverse-application
 * GET  /api/accounting/open-items/aging?partyType=CUSTOMER&partyId=X&asOfDate=YYYY-MM-DD
 * GET  /api/accounting/open-items/disputes
 * GET  /api/accounting/open-items/by-party?partyType=CUSTOMER&partyId=X
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRoute } from '@/lib/api/with-route';
import { validateRequest } from '@/lib/api/validate-request';
import { OpenItemsEngine, DisputeResolution } from '@/lib/open-items-engine';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'accounting.open-items' });

const FINANCE_ROLES = ['admin', 'owner', 'cfo', 'finance', 'accountant'];

const ApplyPaymentSchema = z.object({
  paymentOpenItemId: z.number().int().positive(),
  toleranceSAR:      z.number().optional().default(1.0),
  allocations: z.array(z.object({
    invoiceOpenItemId: z.number().int().positive(),
    amount:            z.number().positive(),
    discount:          z.number().min(0).optional(),
    writeoff:          z.number().min(0).optional(),
    writeoffReason:    z.string().optional(),
    currency:          z.string().default('SAR'),
    exchangeRate:      z.number().positive().optional().default(1),
  })).min(1),
});

const MarkDisputedSchema = z.object({
  openItemId:             z.number().int().positive(),
  disputedAmount:         z.number().positive(),
  reason:                 z.string().min(5),
  expectedResolutionDate: z.string().min(8),
});

const ResolveDisputeSchema = z.object({
  openItemId:  z.number().int().positive(),
  resolution:  z.enum(['CUSTOMER_PAYS', 'WRITEOFF', 'CREDIT_NOTE'] as [DisputeResolution, ...DisputeResolution[]]),
  notes:       z.string().optional(),
});

const ReverseSchema = z.object({
  applicationId: z.number().int().positive(),
  reason:        z.string().min(5),
});

export const GET = withRoute(async ({ req, prisma, auth }) => {
  if (!FINANCE_ROLES.includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

  const path      = req.nextUrl.pathname;
  const params    = req.nextUrl.searchParams;

  if (path.endsWith('/aging')) {
    const partyType = (params.get('partyType') ?? 'CUSTOMER') as 'CUSTOMER' | 'SUPPLIER';
    const partyId   = params.get('partyId') ? parseInt(params.get('partyId')!) : undefined;
    const asOfDate  = params.get('asOfDate') ? new Date(params.get('asOfDate')!) : new Date();
    const currency  = params.get('currency') ?? 'SAR';
    const report    = await OpenItemsEngine.getAgingReport(prisma as any, partyType, partyId, asOfDate, currency);
    return NextResponse.json(report);
  }

  if (path.endsWith('/disputes')) {
    const items = await (prisma as any).openItem.findMany({
      take:    200,
      where:   { status: 'DISPUTED' },
      orderBy: { disputedAt: 'desc' },
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });
    return NextResponse.json(items);
  }

  if (path.endsWith('/by-party')) {
    const partyType = params.get('partyType');
    const partyId   = parseInt(params.get('partyId') ?? '0');
    if (!partyType || !partyId) return NextResponse.json({ error: 'partyType و partyId مطلوبان' }, { status: 400 });
    const items = await (prisma as any).openItem.findMany({
      take:    200,
      where:   { partyType, partyId },
      orderBy: { dueDate: 'asc' },
    });
    return NextResponse.json(items);
  }

  return NextResponse.json({ error: 'Route not found' }, { status: 404 });
}, { rateLimit: 'FINANCIAL' });

export const POST = withRoute(async ({ req, prisma, auth }) => {
  if (!FINANCE_ROLES.includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

  const path = req.nextUrl.pathname;

  if (path.endsWith('/apply-payment')) {
    const { data: body, error } = await validateRequest(req, ApplyPaymentSchema);
    if (error) return error;
    const result = await OpenItemsEngine.applyPayment(prisma as any, { ...body, appliedByUserId: auth.userId });
    return NextResponse.json(result, { status: 201 });
  }

  if (path.endsWith('/mark-disputed')) {
    const { data: body, error } = await validateRequest(req, MarkDisputedSchema);
    if (error) return error;
    const result = await OpenItemsEngine.markDisputed(prisma as any, body.openItemId, body.disputedAmount, body.reason, new Date(body.expectedResolutionDate), auth.userId);
    return NextResponse.json(result);
  }

  if (path.endsWith('/resolve-dispute')) {
    const { data: body, error } = await validateRequest(req, ResolveDisputeSchema);
    if (error) return error;
    const result = await OpenItemsEngine.resolveDispute(prisma as any, body.openItemId, body.resolution, auth.userId, body.notes);
    return NextResponse.json(result);
  }

  if (path.endsWith('/reverse-application')) {
    const { data: body, error } = await validateRequest(req, ReverseSchema);
    if (error) return error;
    const result = await OpenItemsEngine.reverseApplication(prisma as any, body.applicationId, body.reason, auth.userId);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Route not found' }, { status: 404 });
}, { rateLimit: 'FINANCIAL' });
