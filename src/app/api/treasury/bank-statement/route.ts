/**
 * Bank Statement Import API (B.1-B.3)
 * POST /api/treasury/bank-statement/import
 *   — Upload MT940 / CAMT.053 / CSV, get parsed transactions
 * POST /api/treasury/bank-statement/match
 *   — Auto-match parsed transactions to open invoices
 * GET  /api/treasury/bank-statement/unmatched
 *   — List unmatched payments pending review
 */

import { NextResponse, NextRequest } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { parseBankStatement, detectFormat } from '@/lib/bank-statement-parser';
import { CashApplicationEngine } from '@/lib/cash-application-engine';

const log = logger.child({ service: 'api.treasury.bank-statement' });

async function _POST(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const contentType = request.headers.get('content-type') || '';

    // Handle multipart form data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file     = formData.get('file') as File | null;
      const action   = (formData.get('action') as string) || 'parse';
      const format   = (formData.get('format') as string) || undefined;

      if (!file) {
        return NextResponse.json({ error: 'لم يتم إرسال ملف' }, { status: 400 });
      }

      const content     = await file.text();
      const detectedFmt = format || detectFormat(content);
      const parsed      = parseBankStatement(content, detectedFmt as any);

      if (action === 'parse') {
        return NextResponse.json({
          format: detectedFmt,
          accountNumber: parsed.accountNumber,
          currency: parsed.currency,
          openingBalance: parsed.openingBalance,
          closingBalance: parsed.closingBalance,
          transactionCount: parsed.transactions.length,
          parseErrors: parsed.parseErrors,
          transactions: parsed.transactions.slice(0, 200), // limit response
        });
      }

      if (action === 'match') {
        // Auto-match all credit transactions
        const credits = parsed.transactions.filter(t => t.credit > 0);
        const matches = await CashApplicationEngine.batchMatch(credits);

        const summary = {
          total: matches.length,
          exactRef:    matches.filter(m => m.strategy === 'EXACT_REF').length,
          exactAmount: matches.filter(m => m.strategy === 'EXACT_AMOUNT').length,
          multi:       matches.filter(m => m.strategy === 'MULTI_INVOICE').length,
          partial:     matches.filter(m => m.strategy === 'PARTIAL').length,
          unallocated: matches.filter(m => m.strategy === 'UNALLOCATED').length,
        };

        return NextResponse.json({
          format: detectedFmt,
          parseErrors: parsed.parseErrors,
          matchSummary: summary,
          matches,
        });
      }

      return NextResponse.json({ error: 'action غير معروف. استخدم: parse | match' }, { status: 400 });
    }

    // Handle JSON body (manual match request)
    const body   = await request.json();
    const action = body.action;

    if (action === 'match-single') {
      const { paymentAmount, paymentReference, paymentDate, customerId } = body;
      if (!paymentAmount) {
        return NextResponse.json({ error: 'paymentAmount مطلوب' }, { status: 400 });
      }

      const match = await CashApplicationEngine.match({
        paymentAmount: parseFloat(paymentAmount),
        paymentReference: paymentReference || '',
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        customerId: customerId ? parseInt(customerId) : undefined,
      });

      return NextResponse.json(match);
    }

    if (action === 'apply') {
      const { matchResult, customerId, paymentDate, paymentMethod, reference, notes, userId } = body;
      if (!matchResult) {
        return NextResponse.json({ error: 'matchResult مطلوب' }, { status: 400 });
      }

      const result = await CashApplicationEngine.apply({
        matchResult,
        customerId: customerId ? parseInt(customerId) : undefined,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        reference: reference || '',
        notes,
        userId: userId ? parseInt(userId) : undefined,
      });

      return NextResponse.json({ success: true, ...result });
    }

    return NextResponse.json({ error: 'action غير معروف' }, { status: 400 });

  } catch (error: any) {
    log.error('Bank statement import error:', error);
    return NextResponse.json({ error: 'فشل معالجة كشف الحساب البنكي' }, { status: 500 });
  }
}

async function _GET(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    // Return list of unmatched (unallocated) payments from suspense
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Invoices with remaining balance > 0 as indicator of unmatched AR
    const { prisma: db } = await import('@/lib/prisma');
    const unpaid = await (db as any).salesInvoice.findMany({
      where: { remaining: { gt: 0 }, deletedAt: null },
      select: {
        id: true,
        invoiceNo: true,
        date: true,
        total: true,
        remaining: true,
        customer: { select: { name: true, phone: true } },
      },
      orderBy: { date: 'asc' },
      take: limit,
    }).catch(() => []);

    const totalUnpaid = (unpaid as any[]).reduce((s: number, i: any) => s + Number(i.remaining || 0), 0);

    return NextResponse.json({
      unpaidInvoices: unpaid,
      count: (unpaid as any[]).length,
      totalUnpaidAmount: Math.round(totalUnpaid * 100) / 100,
    });

  } catch (error: any) {
    log.error('Bank statement GET error:', error);
    return NextResponse.json({ error: 'فشل جلب البيانات' }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
