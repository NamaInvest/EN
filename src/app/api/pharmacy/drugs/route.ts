/**
 * Pharmacy Drugs API — إدارة الأدوية
 * GET  /api/pharmacy/drugs  — قائمة الأدوية
 * POST /api/pharmacy/drugs  — إضافة دواء جديد (مع Product)
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRoute } from '@/lib/api/with-route';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'pharmacy.drugs' });

const CreateDrugSchema = z.object({
  name:            z.string().min(1, 'اسم الدواء مطلوب'),
  nameEn:          z.string().optional().default(''),
  barcode:         z.string().optional().nullable(),
  buyPrice:        z.number().min(0).default(0),
  sellPrice:       z.number().min(0).default(0),
  mohMaxPrice:     z.number().min(0).default(0),
  minQuantity:     z.number().min(0).default(5),
  categoryId:      z.number().int().positive().optional().nullable(),
  unitId:          z.number().int().positive().default(1),
  sfdaNumber:      z.string().optional().default(''),
  genericName:     z.string().min(1, 'الاسم العلمي مطلوب'),
  genericNameEn:   z.string().optional().default(''),
  drugClass:       z.enum(['OTC', 'RX', 'CONTROLLED', 'SUPPLEMENT']).default('OTC'),
  manufacturer:    z.string().optional().nullable(),
  countryOfOrigin: z.string().optional().nullable(),
  storageTemp:     z.enum(['room', 'refrigerated', 'frozen']).default('room'),
  requiresRx:      z.boolean().default(false),
  isControlled:    z.boolean().default(false),
});

export const GET = withRoute(async ({ req, prisma }) => {
  const url         = new URL(req.url);
  const search      = url.searchParams.get('q') || '';
  const drugClass   = url.searchParams.get('class') || '';
  const lowStock    = url.searchParams.get('lowStock') === 'true';
  const expiringSoon = url.searchParams.get('expiringSoon') === 'true';

  const where: any = { active: true };
  if (drugClass) where.drugClass = drugClass;
  if (search) {
    where.OR = [
      { genericName: { contains: search, mode: 'insensitive' } },
      { sfdaNumber:  { contains: search } },
      { product:     { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  // pharmacyDrug model is pending `prisma generate` — use `as any` until then
  const drugs = await (prisma as any).pharmacyDrug.findMany({
    take: 100,
    where,
    include: {
      product: {
        select: {
          id: true, name: true, nameEn: true, barcode: true,
          currentStock: true, minQuantity: true, sellPrice: true,
          buyPrice: true, expiryDate: true,
          batches: {
            select: { batchNumber: true, expiryDate: true, currentQuantity: true },
            orderBy: { expiryDate: 'asc' },
          },
        },
      },
    },
    orderBy: { genericName: 'asc' },
  });

  let result: any[] = drugs;

  if (lowStock) {
    result = result.filter((d: any) => d.product.currentStock <= d.product.minQuantity);
  }

  if (expiringSoon) {
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    result = result.filter((d: any) =>
      d.product.batches.some((b: any) => b.expiryDate && new Date(b.expiryDate) <= in30)
    );
  }

  return NextResponse.json({ total: result.length, drugs: result });
}, { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req, prisma }) => {
  const raw = await req.json().catch(() => ({}));
  const parsed = CreateDrugSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const body = parsed.data;

  // 1. Create Product first
  const product = await prisma.product.create({
    data: {
      name:        body.name,
      nameEn:      body.nameEn,
      barcode:     body.barcode ?? null,
      buyPrice:    body.buyPrice,
      sellPrice:   body.sellPrice || body.mohMaxPrice,
      minQuantity: body.minQuantity,
      taxRate:     0, // أدوية معفاة من الضريبة في السعودية
      categoryId:  body.categoryId ?? null,
      unitId:      body.unitId,
    },
  });

  // 2. Create PharmacyDrug linked to product
  const drug = await (prisma as any).pharmacyDrug.create({
    data: {
      productId:       product.id,
      sfdaNumber:      body.sfdaNumber,
      genericName:     body.genericName,
      genericNameEn:   body.genericNameEn,
      drugClass:       body.drugClass,
      manufacturer:    body.manufacturer ?? null,
      countryOfOrigin: body.countryOfOrigin ?? null,
      storageTemp:     body.storageTemp,
      mohMaxPrice:     body.mohMaxPrice,
      requiresRx:      body.requiresRx,
      isControlled:    body.isControlled,
    },
    include: { product: true },
  });

  return NextResponse.json(drug, { status: 201 });
}, { rateLimit: 'DEFAULT' });
