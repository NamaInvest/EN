/**
 * Bank Statement Import API
 *
 * POST /api/treasury/bank-import          — upload OFX/CAMT.053 file
 * GET  /api/treasury/bank-import          — list imported statement lines
 * PATCH /api/treasury/bank-import/:lineId — manually match a pending line
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRoute } from '@/lib/api/with-route';
import { validateRequest } from '@/lib/api/validate-request';
import { BankStatementImporter } from '@/lib/bank-statement-importer';
import { checkRateLimit, getClientIp } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'treasury.bank-import' });

const TREASURY_ROLES = ['admin', 'owner', 'finance', 'treasury', 'accountant'];

const MatchSchema = z.object({
  lineId:      z.number().int().positive(),
  treasuryId:  z.number().int().positive(),
});

export const GET = withRoute(async ({ req, prisma, auth }) => {
  if (!TREASURY_ROLES.includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

  const params        = req.nextUrl.searchParams;
  const bankAccountId = parseInt(params.get('bankAccountId') ?? '0');
  const status        = params.get('status');   // MATCHED | PENDING_REVIEW
  const page          = parseInt(params.get('page') ?? '1');
  const take          = 50;

  const where: any = {};
  if (bankAccountId) where.bankAccountId = bankAccountId;
  if (status) where.status = status;

  const [lines, total] = await Promise.all([
    (prisma as any).bankStatementLine.findMany({
      where,
      take,
      skip:    (page - 1) * take,
      orderBy: { transactionDate: 'desc' },
    }),
    (prisma as any).bankStatementLine.count({ where }),
  ]);

  return NextResponse.json({ lines, total, page, pages: Math.ceil(total / take) });
}, { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req, prisma, auth }) => {
  if (!TREASURY_ROLES.includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

  const path = req.nextUrl.pathname;

  // ── Manual match ────────────────────────────────────────────────────────────
  if (path.endsWith('/match')) {
    const { data: body, error } = await validateRequest(req, MatchSchema);
    if (error) return error;

    await Promise.all([
      (prisma as any).bankStatementLine.update({
        where: { id: body.lineId },
        data:  { status: 'MATCHED', matchedTreasuryId: body.treasuryId },
      }),
      (prisma as any).treasury.update({
        where: { id: body.treasuryId },
        data:  { reconStatus: 'MATCHED' },
      }).catch(() => null),
    ]);

    return NextResponse.json({ success: true });
  }

  // ── File upload + parse + import ────────────────────────────────────────────
  // Apply tighter rate limit for uploads
  const uploadBlock = checkRateLimit(req, 'UPLOAD', `UPLOAD:${getClientIp(req)}:bank-import`);
  if (uploadBlock) return uploadBlock;

  const body = await req.json().catch(() => ({}));
  const { content, bankAccountId, fileName } = body;

  if (!content)       return NextResponse.json({ error: 'محتوى الملف مطلوب (base64 أو text)' }, { status: 400 });
  if (!bankAccountId) return NextResponse.json({ error: 'bankAccountId مطلوب' }, { status: 400 });

  // Decode if base64
  let fileContent = content as string;
  if (/^[A-Za-z0-9+/]+=*$/.test(fileContent.substring(0, 100))) {
    try { fileContent = Buffer.from(fileContent, 'base64').toString('utf-8'); } catch { /* keep as-is */ }
  }

  const { format, transactions } = BankStatementImporter.parse(fileContent);

  if (format === 'UNKNOWN' || transactions.length === 0) {
    return NextResponse.json({
      error: 'صيغة الملف غير مدعومة. الصيغ المدعومة: OFX، CAMT.053',
      detected: format,
    }, { status: 422 });
  }

  const result = await BankStatementImporter.importToDatabase(
    prisma,
    parseInt(String(bankAccountId)),
    transactions,
    auth.userId,
  );

  return NextResponse.json({
    success:    true,
    format,
    fileName:   fileName ?? 'unknown',
    ...result,
  }, { status: 201 });
}, { rateLimit: 'UPLOAD' }); // Tighter rate limit applied manually inside for file uploads
