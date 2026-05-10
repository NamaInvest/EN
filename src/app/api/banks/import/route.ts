import { NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'banks.import' });
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/banks/import — استيراد كشف حساب بنكي (CSV)
 * يقبل ملف CSV ويحوله إلى حركات بنكية مع مطابقة تلقائية
 */

const _POSTSchema = z.object({
  bankAccountId: z.union([z.string(), z.number()]).optional(),
  csvData: z.any().optional(),
  dateFormat: z.string().optional(),
}).passthrough();

async function _POST(req: Request) {
  const user = getUserFromRequest(req as any);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const body = await req.json();

        const _parsed = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }
    const { bankAccountId, csvData, dateFormat } = body;

    if (!csvData) {
      return NextResponse.json({ error: 'بيانات CSV مطلوبة' }, { status: 400 });
    }

    // تحليل CSV
    const lines = csvData.split('\n').filter((l: string) => l.trim());
    if (lines.length < 2) {
      return NextResponse.json({ error: 'الملف فارغ أو غير صالح' }, { status: 400 });
    }

    // اكتشاف تلقائي للأعمدة من السطر الأول (Header)
    const header = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
    const dateCol = header.findIndex((h: string) => h.includes('date') || h.includes('تاريخ'));
    const descCol = header.findIndex((h: string) => h.includes('desc') || h.includes('وصف') || h.includes('narration'));
    const debitCol = header.findIndex((h: string) => h.includes('debit') || h.includes('مدين') || h.includes('withdrawal'));
    const creditCol = header.findIndex((h: string) => h.includes('credit') || h.includes('دائن') || h.includes('deposit'));
    const amountCol = header.findIndex((h: string) => h.includes('amount') || h.includes('مبلغ'));

    const imported: any[] = [];
    const matched: any[] = [];
    const unmatched: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c: string) => c.trim().replace(/"/g, ''));
      if (cols.length < 2) continue;

      const date = dateCol >= 0 ? cols[dateCol] : cols[0];
      const description = descCol >= 0 ? cols[descCol] : cols[1];
      let amount = 0;

      if (amountCol >= 0) {
        amount = parseFloat(cols[amountCol]) || 0;
      } else {
        const debit = debitCol >= 0 ? parseFloat(cols[debitCol]) || 0 : 0;
        const credit = creditCol >= 0 ? parseFloat(cols[creditCol]) || 0 : 0;
        amount = credit - debit; // موجب = إيداع، سالب = سحب
      }

      const txn = {
        date,
        description,
        amount,
        type: amount >= 0 ? 'credit' : 'debit',
        status: 'pending',
      };

      imported.push(txn);

      // محاولة مطابقة تلقائية بالمبلغ
      const absAmount = Math.abs(amount);
      if (absAmount > 0) {
        // البحث عن فواتير بنفس المبلغ (±1%)
        const tolerance = absAmount * 0.01;
        const matchingSales = await prisma.salesInvoice.findFirst({
          where: {
            total: { gte: absAmount - tolerance, lte: absAmount + tolerance },
            paymentType: { not: 'cash' },
          },
          select: { id: true, invoiceNo: true, total: true },
        });

        if (matchingSales && amount > 0) {
          matched.push({ ...txn, matchedTo: `فاتورة مبيعات #${matchingSales.invoiceNo}` });
        } else {
          unmatched.push(txn);
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: imported.length,
        matched: matched.length,
        unmatched: unmatched.length,
      },
      transactions: imported,
      matched,
      unmatched,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
