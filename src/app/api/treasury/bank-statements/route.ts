/**
 * Bank Statements Import API
 * POST /api/treasury/bank-statements              — Upload & parse a statement file
 * GET  /api/treasury/bank-statements              — List all statements
 * GET  /api/treasury/bank-statements?id=X         — Get single statement with lines
 * GET  /api/treasury/bank-statements?id=X&export=csv — Export lines as CSV
 */
import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import {
  MT940Parser, CAMT053Parser, CSVBankParser,
  detectFormat, ParseResult,
} from '@/lib/bank-statement-parser';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.treasury.bank-statements' });

/** Parse any supported format to a unified ParseResult */
function parseContent(content: string, hint: string): ParseResult {
  const fmt = hint === 'AUTO' ? detectFormat(content) : (hint as any);
  if (fmt === 'MT940')   return MT940Parser.parse(content);
  if (fmt === 'CAMT053') return CAMT053Parser.parse(content);
  // CSV / OFX / unknown — use CSV parser with default column mapping
  return CSVBankParser.parse(content, {
    date:        0,
    description: 1,
    debit:       2,
    credit:      3,
    delimiter:   ',',
    dateFormat:  'YYYY-MM-DD',
    skipRows:    1,
  });
}

export const GET = withRoute(async ({ req, prisma, auth }) => {
  try {

    const { searchParams } = new URL(req.url);
    const id        = searchParams.get('id')            ? parseInt(searchParams.get('id')!)            : null;
    const acctId    = searchParams.get('bankAccountId') ? parseInt(searchParams.get('bankAccountId')!) : null;
    const exportFmt = searchParams.get('export');

    const tenantId = (auth as any).tenantId;
    // ── Single statement with lines ────────────────────────────────────
    if (id) {
      const stmt = await prisma.bankStatement.findFirst({
        where:   { id, tenantId },
        include: { lines: { orderBy: { transactionDate: 'asc' }, take: 2000 } },
      }).catch(() => null);

      if (!stmt) return NextResponse.json({ error: 'الكشف غير موجود' }, { status: 404 });

      if (exportFmt === 'csv') {
        const hdr  = 'Row,Date,Value Date,Description,Reference,Amount,Type,Counterparty\n';
        const rows = (stmt as any).lines.map((l: any, idx: number) =>
          `${idx + 1},${new Date(l.transactionDate).toLocaleDateString('en-SA')},${l.valueDate ? new Date(l.valueDate).toLocaleDateString('en-SA') : ''},"${(l.description || '').replace(/"/g, "'")}", "${l.reference || ''}",${l.amount},${l.type},"${l.counterpartyName || ''}"`
        ).join('\n');
        return new NextResponse(hdr + rows, {
          headers: {
            'Content-Type':        'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="statement-${id}-${new Date().toISOString().split('T')[0]}.csv"`,
          },
        });
      }

      return NextResponse.json(stmt);
    }

    // ── List statements ────────────────────────────────────────────────
    const where: any = { tenantId, ...(acctId ? { bankAccountId: acctId } : {}) };
    const statements = await prisma.bankStatement.findMany({
      where,
      select: {
        id: true, statementNumber: true,
        openingBalance: true, closingBalance: true,
        openingDate: true, closingDate: true,
        currency: true, fileFormat: true, fileName: true,
        importedAt: true,
        bankAccountId: true,
        validationStatus: true,
        _count: { select: { lines: true } },
      },
      orderBy: { importedAt: 'desc' },
      take: 100,
    }).catch(() => [] as any[]);

    const withStats = await Promise.all(
      (statements as any[]).map(async (s: any) => {
        const [matched, unmatched] = await Promise.all([
          prisma.bankStatementLine.count({
            where: { statementId: s.id, matchStatus: { not: 'UNMATCHED' } },
          }).catch(() => 0),
          prisma.bankStatementLine.count({
            where: { statementId: s.id, matchStatus: 'UNMATCHED' },
          }).catch(() => 0),
        ]);
        return { ...s, matchedLines: matched, unmatchedLines: unmatched, totalLines: s._count?.lines ?? 0 };
      })
    );

    return NextResponse.json({ count: withStats.length, statements: withStats });
  } catch (error: any) {
    log.error('Bank statement GET error:', error);
    return NextResponse.json({ error: error.message || 'خطأ داخلي' }, { status: 500 });
  }
}, { rateLimit: 'DEFAULT', tenantRequired: true });

export const POST = withRoute(async ({ req, prisma, auth }) => {
  try {

    const contentType = req.headers.get('content-type') || '';
    let fileContent: string;
    let fileName: string;
    let bankAccountId: number;
    let fileFormat: string = 'AUTO';

    if (contentType.includes('multipart/form-data')) {
      const formData  = await req.formData();
      const file      = formData.get('file') as File | null;
      if (!file) return NextResponse.json({ error: 'الملف مطلوب' }, { status: 400 });
      fileContent   = await file.text();
      fileName      = file.name;
      bankAccountId = parseInt(String(formData.get('bankAccountId') || '0'));
      fileFormat    = String(formData.get('format') || 'AUTO');
    } else {
      const body    = await req.json();
      fileContent   = body.content || '';
      fileName      = body.fileName || 'statement.txt';
      bankAccountId = parseInt(body.bankAccountId || '0');
      fileFormat    = body.format || 'AUTO';
    }

    if (!fileContent)   return NextResponse.json({ error: 'محتوى الملف فارغ' },  { status: 400 });
    if (!bankAccountId) return NextResponse.json({ error: 'bankAccountId مطلوب' }, { status: 400 });

    const parsed = parseContent(fileContent, fileFormat);

    if (!parsed.transactions?.length) {
      return NextResponse.json({
        warning:  'تم تحليل الملف لكن لم يُعثر على حركات',
        errors:   parsed.parseErrors,
        format:   detectFormat(fileContent),
      }, { status: 200 });
    }

    // Determine date range from transactions
    const dates       = parsed.transactions.map((t: any) => new Date(t.date).getTime()).filter(Boolean);
    const openingDate = dates.length ? new Date(Math.min(...dates)) : new Date();
    const closingDate = dates.length ? new Date(Math.max(...dates)) : new Date();

    // Detect actual format
    const detectedFmt = fileFormat === 'AUTO' ? detectFormat(fileContent) : fileFormat;

    const tenantId = (auth as any).tenantId;
    const stmt = await prisma.bankStatement.create({
      data: {
        tenantId,
        bankAccountId,
        statementNumber:  parsed.accountNumber || `STMT-${Date.now()}`,
        openingBalance:   parsed.openingBalance ?? 0,
        openingDate,
        closingBalance:   parsed.closingBalance ?? 0,
        closingDate,
        currency:         parsed.currency || 'SAR',
        fileFormat:       detectedFmt,
        fileName,
        importedByUserId: String((auth as any).userId || 'system'),
        importMethod:     'MANUAL',
        validationStatus: 'VALID',
        lines: {
          create: parsed.transactions.map((tx: any) => ({
            tenantId,
            transactionDate:  new Date(tx.date),
            valueDate:        tx.valueDate ? new Date(tx.valueDate) : null,
            amount:           Math.abs(tx.debit || tx.credit || 0),
            type:             (tx.debit || 0) > 0 ? 'DEBIT' : 'CREDIT',
            currency:         parsed.currency || 'SAR',
            description:      tx.description || '',
            reference:        tx.reference   || null,
            counterpartyName: tx.counterpartyName || null,
            counterpartyIBAN: tx.counterpartyIban || null,
            counterpartyBank: tx.transactionCode  || null,
            matchStatus:      'UNMATCHED',
          })),
        },
      },
      include: { lines: false },
    }).catch(async (e: any) => {
      if (e.code === 'P2002') {
        return prisma.bankStatement.findFirst({
          where: { tenantId, bankAccountId, statementNumber: parsed.accountNumber || '' },
        });
      }
      throw e;
    });

    log.info(`Bank statement imported: ${parsed.transactions.length} transactions, accountId=${bankAccountId}`);

    return NextResponse.json({
      success:          true,
      statementId:      (stmt as any)?.id,
      transactionCount: parsed.transactions.length,
      openingBalance:   parsed.openingBalance,
      closingBalance:   parsed.closingBalance,
      parseErrors:      parsed.parseErrors,
      format:           detectedFmt,
      message:          `تم استيراد ${parsed.transactions.length} حركة بنجاح`,
    });
  } catch (error: any) {
    log.error('Bank statement POST error:', error);
    return NextResponse.json({ error: error.message || 'فشل الاستيراد' }, { status: 500 });
  }
}, { rateLimit: 'FINANCIAL', tenantRequired: true });
