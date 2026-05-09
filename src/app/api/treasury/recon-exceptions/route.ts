/**
 * Bank Reconciliation Exception Queue API
 *
 * GET  /api/treasury/recon-exceptions              — list + summary
 * POST /api/treasury/recon-exceptions/sync         — sync from bank import
 * POST /api/treasury/recon-exceptions/age          — run aging (cron)
 * POST /api/treasury/recon-exceptions/resolve      — resolve exception
 * POST /api/treasury/recon-exceptions/dismiss      — dismiss exception
 * POST /api/treasury/recon-exceptions/assign       — assign to user
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRoute } from '@/lib/api/with-route';
import { validateRequest } from '@/lib/api/validate-request';
import { BankReconExceptionEngine, ExceptionStatus, ResolutionType } from '@/lib/bank-recon-exceptions';

const TREASURY_ROLES = ['admin', 'owner', 'cfo', 'finance', 'accountant', 'treasurer'];

const ResolveSchema = z.object({
  exceptionId:       z.number().int().positive(),
  resolution:        z.enum(['MANUAL_MATCH', 'TIMING_DIFFERENCE', 'BANK_ERROR', 'BOOK_ADJUSTMENT', 'WRITEOFF'] as [ResolutionType, ...ResolutionType[]]),
  notes:             z.string().optional(),
  matchedTreasuryId: z.number().int().optional(),
});

const DismissSchema = z.object({
  exceptionId: z.number().int().positive(),
  reason:      z.string().min(5),
});

const AssignSchema = z.object({
  exceptionId:   z.number().int().positive(),
  assignToEmail: z.string().email(),
});

export const GET = withRoute(async ({ req, prisma, auth }) => {
  if (!TREASURY_ROLES.includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

  const params        = req.nextUrl.searchParams;
  const path          = req.nextUrl.pathname;
  const bankAccountId = params.get('bankAccountId') ? parseInt(params.get('bankAccountId')!) : undefined;

  if (path.endsWith('/summary')) {
    const summary = await BankReconExceptionEngine.getSummary(prisma, bankAccountId);
    return NextResponse.json(summary);
  }

  // Default: list with pagination
  const status = params.get('status') as ExceptionStatus | undefined;
  const page   = parseInt(params.get('page') ?? '1');
  const take   = parseInt(params.get('take') ?? '50');

  const [list, summary] = await Promise.all([
    BankReconExceptionEngine.listExceptions(prisma, { status, bankAccountId, page, take }),
    BankReconExceptionEngine.getSummary(prisma, bankAccountId),
  ]);

  return NextResponse.json({ ...list, summary });
}, { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req, prisma, auth }) => {
  if (!TREASURY_ROLES.includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

  const path = req.nextUrl.pathname;

  if (path.endsWith('/sync')) {
    const body          = await req.json().catch(() => ({}));
    const bankAccountId = body?.bankAccountId ? parseInt(body.bankAccountId) : undefined;
    const created       = await BankReconExceptionEngine.syncExceptions(prisma, bankAccountId);
    return NextResponse.json({ success: true, created, message: `تم إنشاء ${created} استثناء جديد` });
  }

  if (path.endsWith('/age')) {
    // Only admins/finance can run aging manually
    if (!['admin', 'owner', 'cfo', 'finance'].includes(auth.role)) {
      return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });
    }
    const body  = await req.json().catch(() => ({}));
    const asOf  = body?.asOfDate ? new Date(body.asOfDate) : new Date();
    const result = await BankReconExceptionEngine.ageExceptions(prisma, asOf);
    return NextResponse.json({ success: true, ...result });
  }

  if (path.endsWith('/resolve')) {
    const { data: body, error } = await validateRequest(req, ResolveSchema);
    if (error) return error;

    const result = await BankReconExceptionEngine.resolveException(
      prisma,
      body.exceptionId,
      body.resolution,
      auth.userId,
      body.notes,
      body.matchedTreasuryId,
    );
    return NextResponse.json({ success: true, exception: result });
  }

  if (path.endsWith('/dismiss')) {
    const { data: body, error } = await validateRequest(req, DismissSchema);
    if (error) return error;

    const result = await BankReconExceptionEngine.dismissException(prisma, body.exceptionId, body.reason, auth.userId);
    return NextResponse.json({ success: true, exception: result });
  }

  if (path.endsWith('/assign')) {
    const { data: body, error } = await validateRequest(req, AssignSchema);
    if (error) return error;

    const result = await BankReconExceptionEngine.assignException(prisma, body.exceptionId, body.assignToEmail);
    return NextResponse.json({ success: true, exception: result });
  }

  return NextResponse.json({ error: 'Route not found' }, { status: 404 });
}, { rateLimit: 'FINANCIAL' });
