/**
 * Multi-Book / Multi-GAAP API
 *
 * GET  /api/accounting/books               — list all books
 * POST /api/accounting/books               — create book
 * GET  /api/accounting/books/reconcile?sourceBookId=X&targetBookId=Y&from=&to=
 * POST /api/accounting/books/post-multi    — post JE across all books
 * POST /api/accounting/books/mapping       — upsert account mapping
 * PATCH /api/accounting/books/:id/toggle   — activate / deactivate
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRoute } from '@/lib/api/with-route';
import { validateRequest } from '@/lib/api/validate-request';
import { MultiBookEngineV2 } from '@/lib/multi-book-engine-v2';

const BOOK_ROLES = ['admin', 'owner', 'cfo', 'finance'];

const CreateBookSchema = z.object({
  code:          z.string().min(2).max(20),
  name:          z.string().min(2),
  nameAr:        z.string().optional(),
  type:          z.enum(['PRIMARY', 'TAX', 'MANAGEMENT', 'GROUP', 'STATUTORY', 'REGULATORY']).default('MANAGEMENT'),
  gaapStandard:  z.enum(['IFRS', 'SOCPA', 'US_GAAP', 'ZAKAT', 'MANAGEMENT', 'CUSTOM']).default('IFRS'),
  baseCurrency:  z.string().default('SAR'),
  isPrimary:     z.boolean().default(false),
  sourceBookId:  z.number().int().optional(),
  autoReplicate: z.boolean().default(true),
  description:   z.string().optional(),
});

const PostMultiSchema = z.object({
  entryNumber:  z.string().min(3),
  entryDate:    z.string().min(8),
  description:  z.string().min(3),
  lines: z.array(z.object({
    accountId:   z.number().int().positive(),
    debit:       z.number().min(0),
    credit:      z.number().min(0),
    description: z.string().optional(),
    costCenterId: z.number().int().optional(),
  })).min(2),
  excludeBookTypes: z.array(z.string()).optional(),
});

const MappingSchema = z.object({
  bookId:          z.number().int().positive(),
  sourceAccountId: z.number().int().positive(),
  targetAccountId: z.number().int().positive(),
});

export const GET = withRoute(async ({ req, prisma, auth }) => {
  if (!BOOK_ROLES.includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

  const path   = req.nextUrl.pathname;
  const params = req.nextUrl.searchParams;

  if (path.endsWith('/reconcile')) {
    const sourceBookId = parseInt(params.get('sourceBookId') ?? '0');
    const targetBookId = parseInt(params.get('targetBookId') ?? '0');
    const from         = params.get('from') ?? new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const to           = params.get('to')   ?? new Date().toISOString().split('T')[0];

    if (!sourceBookId || !targetBookId) return NextResponse.json({ error: 'sourceBookId و targetBookId مطلوبان' }, { status: 400 });

    const report = await MultiBookEngineV2.getBookReconciliation(prisma as any, sourceBookId, targetBookId, from, to);
    return NextResponse.json(report);
  }

  // GET /books — list
  const books = await MultiBookEngineV2.listBooks(prisma as any, params.get('all') !== 'true');
  return NextResponse.json(books);
}, { rateLimit: 'FINANCIAL' });

export const POST = withRoute(async ({ req, prisma, auth }) => {
  if (!BOOK_ROLES.includes(auth.role)) return NextResponse.json({ error: 'صلاحيات غير كافية' }, { status: 403 });

  const path = req.nextUrl.pathname;

  if (path.endsWith('/post-multi')) {
    const { data: body, error } = await validateRequest(req, PostMultiSchema);
    if (error) return error;

    const result = await MultiBookEngineV2.postMultiBookJournal(
      prisma as any,
      { entryNumber: body.entryNumber, entryDate: body.entryDate, description: body.description },
      body.lines,
      auth.userId,
      { excludeBookTypes: body.excludeBookTypes },
    );
    return NextResponse.json({ success: true, replicatedTo: result }, { status: 201 });
  }

  if (path.endsWith('/mapping')) {
    const { data: body, error } = await validateRequest(req, MappingSchema);
    if (error) return error;

    const mapping = await MultiBookEngineV2.upsertAccountMapping(
      prisma as any,
      body.bookId, body.sourceAccountId, body.targetAccountId, auth.userId,
    );
    return NextResponse.json(mapping, { status: 201 });
  }

  if (path.endsWith('/toggle')) {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.isActive !== 'boolean' || !body?.bookId) {
      return NextResponse.json({ error: 'bookId و isActive مطلوبان' }, { status: 400 });
    }
    const book = await MultiBookEngineV2.setBookActive(prisma as any, body.bookId, body.isActive);
    return NextResponse.json(book);
  }

  // POST /books — create
  const { data: body, error } = await validateRequest(req, CreateBookSchema);
  if (error) return error;

  const book = await prisma.accountingBook.create({ data: body as any });
  return NextResponse.json(book, { status: 201 });
}, { rateLimit: 'FINANCIAL' });
