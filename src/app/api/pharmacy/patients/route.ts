import { requireTenantId } from '@/lib/tenant/tenant-guard';
/**
 * Pharmacy Patients API — إدارة المرضى
 * GET  /api/pharmacy/patients?nationalId=1XXXXXXXXX
 * POST /api/pharmacy/patients — إنشاء/تحديث مريض (upsert)
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRoute } from '@/lib/api/with-route';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pharmacy.patients' });

const UpsertPatientSchema = z.object({
  nationalId:       z.string().min(10, 'الهوية الوطنية مطلوبة').max(15),
  name:             z.string().min(1, 'الاسم مطلوب'),
  nameEn:           z.string().optional().nullable(),
  phone:            z.string().optional().nullable(),
  dateOfBirth:      z.string().optional().nullable(),
  gender:           z.enum(['male', 'female']).optional().nullable(),
  allergies:        z.array(z.string()).optional().nullable(),
  insuranceCompany: z.string().optional().nullable(),
  insuranceCardNo:  z.string().optional().nullable(),
  copayPercent:     z.number().min(0).max(100).default(20),
  notes:            z.string().optional().nullable(),
});

export const GET = withRoute(async ({ req, prisma }) => {
  const tenantId = requireTenantId(req as any);
  const url        = new URL(req.url);
  const nationalId = url.searchParams.get('nationalId');
  const phone      = url.searchParams.get('phone');
  const search     = url.searchParams.get('q');

  if (nationalId) {
    // pharmacyPatient model pending `prisma generate`
    const patient = await (prisma as any).pharmacyPatient.findUnique({
      where: { nationalId, tenantId },
      include: {
        prescriptions: {
          include:  { items: { include: { drug: true } } },
          orderBy:  { createdAt: 'desc' },
          take:     10,
        },
        medicationLogs:   { orderBy: { dispensedAt: 'desc' }, take: 20 },
        insuranceClaims:  { orderBy: { submittedAt: 'desc' }, take: 10 },
      },
    });
    if (!patient) {
      return NextResponse.json({ error: 'المريض غير موجود' }, { status: 404 });
    }
    return NextResponse.json(patient);
  }

  const where: any = { tenantId };
  if (phone)  where.phone = { contains: phone };
  if (search) {
    where.OR = [
      { name:       { contains: search, mode: 'insensitive' } },
      { nationalId: { contains: search } },
      { phone:      { contains: search } },
    ];
  }

  const patients = await (prisma as any).pharmacyPatient.findMany({
    where,
    select: {
      id: true, nationalId: true, name: true, phone: true,
      insuranceCompany: true, copayPercent: true, allergies: true,
    },
    orderBy: { name: 'asc' },
    take:    50,
  }).catch(() => []) as any[];

  return NextResponse.json({ total: patients.length, patients });
}, { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req, prisma }) => {
  const tenantId = requireTenantId(req as any);
  const raw    = await req.json().catch(() => ({}));
  const parsed = UpsertPatientSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const b       = parsed.data;
  const shared  = {
    name:             b.name,
    phone:            b.phone ?? null,
    dateOfBirth:      b.dateOfBirth ?? null,
    gender:           b.gender ?? null,
    allergies:        b.allergies ? JSON.stringify(b.allergies) : null,
    insuranceCompany: b.insuranceCompany ?? null,
    insuranceCardNo:  b.insuranceCardNo ?? null,
    copayPercent:     b.copayPercent,
    notes:            b.notes ?? null,
  };

  const patient = await (prisma as any).pharmacyPatient.upsert({
    where: { nationalId_tenantId: { nationalId: b.nationalId, tenantId } },
    update: shared,
    create: { tenantId, nationalId: b.nationalId, nameEn: b.nameEn ?? null, ...shared },
  });

  return NextResponse.json(patient, { status: 201 });
}, { rateLimit: 'DEFAULT' });
