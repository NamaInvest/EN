/**
 * Insurance Claims API — مطالبات التأمين CCHI/NPHIES
 * GET  /api/pharmacy/insurance
 * POST /api/pharmacy/insurance — تقديم مطالبة
 * PUT  /api/pharmacy/insurance — تحديث حالة المطالبة
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRoute } from '@/lib/api/with-route';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pharmacy.insurance' });

const ClaimStatusEnum = z.enum(['submitted', 'approved', 'rejected', 'paid', 'pending']);

const CreateClaimSchema = z.object({
  patientId:        z.number().int().positive(),
  prescriptionId:   z.number().int().positive().optional().nullable(),
  salesInvoiceId:   z.number().int().positive().optional().nullable(),
  insuranceCompany: z.string().min(1, 'شركة التأمين مطلوبة'),
  claimRef:         z.string().optional(),
  totalAmount:      z.number().min(0),
  insuranceAmount:  z.number().min(0),
  patientAmount:    z.number().min(0),
});

const UpdateClaimSchema = z.object({
  id:              z.number().int().positive(),
  status:          ClaimStatusEnum,
  rejectionReason: z.string().optional().nullable(),
});

export const GET = withRoute(async ({ req, prisma }) => {
  const url     = new URL(req.url);
  const status  = url.searchParams.get('status');
  const company = url.searchParams.get('company');

  const where: any = {};
  if (status)  where.status = status;
  if (company) where.insuranceCompany = { contains: company, mode: 'insensitive' };

  // insuranceClaim model pending `prisma generate`
  const claims = await (prisma as any).insuranceClaim.findMany({
    take: 100,
    where,
    include: { patient: { select: { nationalId: true, name: true, phone: true } } },
    orderBy: { submittedAt: 'desc' },
  }).catch(() => []) as any[];

  const totalInsurance = claims.reduce((s: number, c: any) => s + Number(c.insuranceAmount), 0);
  const collected      = claims.filter((c: any) => c.status === 'paid').reduce((s: number, c: any) => s + Number(c.insuranceAmount), 0);

  const byCompany: Record<string, any> = {};
  for (const c of claims) {
    if (!byCompany[c.insuranceCompany]) {
      byCompany[c.insuranceCompany] = { total: 0, approved: 0, rejected: 0, amount: 0 };
    }
    byCompany[c.insuranceCompany].total++;
    byCompany[c.insuranceCompany].amount += Number(c.insuranceAmount);
    if (c.status === 'approved' || c.status === 'paid') byCompany[c.insuranceCompany].approved++;
    if (c.status === 'rejected') byCompany[c.insuranceCompany].rejected++;
  }

  return NextResponse.json({
    summary: {
      total:          claims.length,
      approved:       claims.filter((c: any) => c.status === 'approved').length,
      rejected:       claims.filter((c: any) => c.status === 'rejected').length,
      pending:        claims.filter((c: any) => c.status === 'submitted').length,
      totalInsurance: Math.round(totalInsurance * 100) / 100,
      collected:      Math.round(collected * 100) / 100,
      outstanding:    Math.round((totalInsurance - collected) * 100) / 100,
    },
    byCompany,
    claims,
  });
}, { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req, prisma }) => {
  const raw    = await req.json().catch(() => ({}));
  const parsed = CreateClaimSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const body  = parsed.data;
  const claim = await (prisma as any).insuranceClaim.create({
    data: {
      patientId:        body.patientId,
      prescriptionId:   body.prescriptionId ?? null,
      salesInvoiceId:   body.salesInvoiceId ?? null,
      insuranceCompany: body.insuranceCompany,
      claimRef:         body.claimRef || `CLM-${Date.now()}`,
      totalAmount:      body.totalAmount,
      insuranceAmount:  body.insuranceAmount,
      patientAmount:    body.patientAmount,
      status:           'submitted',
    },
    include: { patient: { select: { name: true, nationalId: true } } },
  });

  return NextResponse.json(claim, { status: 201 });
}, { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req, prisma }) => {
  const raw    = await req.json().catch(() => ({}));
  const parsed = UpdateClaimSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { id, status, rejectionReason } = parsed.data;
  const resolved = ['approved', 'rejected', 'paid'].includes(status) ? new Date() : null;

  const claim = await (prisma as any).insuranceClaim.update({
    where: { id },
    data:  { status, rejectionReason: rejectionReason ?? null, resolvedAt: resolved },
  });

  return NextResponse.json(claim);
}, { rateLimit: 'DEFAULT' });
