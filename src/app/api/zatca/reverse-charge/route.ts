import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  calculateReverseCharge,
  buildVatReturnRCSection,
  isReverseCharge,
  type PurchaseInvoiceForRC,
} from '@/lib/reverse-charge-vat';

const log = logger.child({ service: 'api-reverse-charge' });

const ReverseChargeCheckSchema = z.object({
  invoiceId:       z.number().int().positive(),
  supplierId:      z.number().int().positive(),
  supplierCountry: z.string().length(2),
  serviceType:     z.enum(['GOODS', 'SERVICE', 'MIXED']),
  lineAmount:      z.number().positive(),
  currency:        z.string().default('SAR'),
  exchangeRate:    z.number().positive().default(1),
  tenantId:        z.string(),
  date:            z.string().optional(),
  applyJournal:    z.boolean().default(false),
});

const VatReturnRCSectionSchema = z.object({
  tenantId: z.string(),
  from:     z.string(),   // ISO date
  to:       z.string(),   // ISO date
});

async function _POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  // ── 1. Check / Calculate Reverse Charge ──────────────────────────────────
  if (action === 'check' || action === 'calculate') {
    const parsed = ReverseChargeCheckSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const invoice: PurchaseInvoiceForRC = parsed.data;
    const result = calculateReverseCharge(invoice);

    // Optionally post the journal entry via postPurchaseInvoice-compatible call
    if (result.isReverseCharge && body.applyJournal) {
      try {
        const { createJournalEntry } = await import('@/lib/auto-journal') as any;
        if (typeof createJournalEntry === 'function') {
          await createJournalEntry({
            description: `Reverse Charge VAT - فاتورة #${invoice.invoiceId} من ${invoice.supplierCountry}`,
            reference:   `RC-${invoice.invoiceId}`,
            date:        invoice.date,
            tenantId:    invoice.tenantId,
            userId:      invoice.userId,
            lines:       result.journalLines,
          }).catch(() => null);
        }
      } catch {
        log.warn('Could not auto-post RC journal entry');
      }
    }

    return NextResponse.json(result);
  }

  // ── 2. VAT Return RC Section (Boxes 8-10) ────────────────────────────────
  if (action === 'vat-return-section') {
    const parsed = VatReturnRCSectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { tenantId, from, to } = parsed.data;
    const fromDate = new Date(from);
    const toDate   = new Date(to);

    // Fetch purchase invoices in the period
    const purchaseInvoices = await (prisma as any).purchaseInvoice.findMany({
      where: {
        tenantId,
        date: { gte: fromDate, lte: toDate },
        status: { in: ['posted', 'POSTED', 'approved'] },
      },
      include: {
        vendor: { select: { id: true, country: true } },
      },
    }).catch(() => []);

    // Map to PurchaseInvoiceForRC format
    const mappedInvoices: PurchaseInvoiceForRC[] = purchaseInvoices.map((inv: any) => ({
      invoiceId:       inv.id,
      supplierId:      inv.vendorId ?? inv.supplierId ?? 0,
      supplierCountry: inv.vendor?.country ?? inv.supplierCountry ?? 'SA',
      serviceType:     inv.serviceType ?? (inv.isService ? 'SERVICE' : 'GOODS'),
      lineAmount:      Number(inv.totalAmount ?? inv.amount ?? 0),
      currency:        inv.currency ?? 'SAR',
      exchangeRate:    Number(inv.exchangeRate ?? 1),
      tenantId,
      date:            inv.date?.toISOString?.()?.split('T')[0] ?? from,
    }));

    const section = buildVatReturnRCSection(mappedInvoices);
    const totalInvoices = mappedInvoices.length;
    const rcInvoices    = mappedInvoices.filter(isReverseCharge).length;

    return NextResponse.json({
      ...section,
      meta: { totalInvoices, rcInvoices, period: { from, to } },
    });
  }

  return NextResponse.json({ error: 'action يجب أن يكون: check | calculate | vat-return-section' }, { status: 400 });
}

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const from     = searchParams.get('from') ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const to       = searchParams.get('to')   ?? new Date().toISOString().split('T')[0];

  // Return summary for current period
  const fromDate = new Date(from);
  const toDate   = new Date(to);

  const purchaseInvoices = await (prisma as any).purchaseInvoice.findMany({
    where: {
      tenantId,
      date: { gte: fromDate, lte: toDate },
      status: { in: ['posted', 'POSTED', 'approved'] },
    },
    include: { vendor: { select: { id: true, country: true } } },
  }).catch(() => []);

  const mapped: PurchaseInvoiceForRC[] = purchaseInvoices.map((inv: any) => ({
    invoiceId:       inv.id,
    supplierId:      inv.vendorId ?? 0,
    supplierCountry: inv.vendor?.country ?? 'SA',
    serviceType:     inv.serviceType ?? 'GOODS',
    lineAmount:      Number(inv.totalAmount ?? 0),
    currency:        inv.currency ?? 'SAR',
    exchangeRate:    Number(inv.exchangeRate ?? 1),
    tenantId,
    date:            inv.date?.toISOString?.()?.split('T')[0] ?? from,
  }));

  const section = buildVatReturnRCSection(mapped);
  return NextResponse.json({ ...section, period: { from, to }, tenantId });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });
