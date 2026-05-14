/**
 * Chart of Accounts Import API
 * POST /api/accounting/chart-of-accounts-import
 * GET  /api/accounting/chart-of-accounts-import?tenantId=X  (preview existing)
 *
 * يستورد دليل الحسابات دفعةً واحدة:
 *   - يدعم JSON: مصفوفة { code, name, name, type, parentCode? }
 *   - يُنشئ هيكل شجري (parent-child)
 *   - يمنع الكودات المكررة (UPSERT)
 *   - dry-run للمعاينة قبل الحفظ
 *
 * أنواع الحسابات:
 *   ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE | CONTRA
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { z } from 'zod';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.coa-import' });

const AccountLineSchema = z.object({
  code:       z.string().min(2).max(20),
  nameEn:   z.string().min(1),
  name:       z.string().optional(),
  type:       z.enum(['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE','CONTRA','BANK','CASH']),
  parentCode: z.string().optional(),
  isHeader:   z.boolean().optional().default(false),
  currency:   z.string().optional().default('SAR'),
  notes:      z.string().optional(),
});

const ImportSchema = z.object({
  tenantId:  z.string(),
  userId:    z.number().int().positive().or(z.string()).transform(Number),
  dryRun:    z.boolean().optional().default(false),
  overwrite: z.boolean().optional().default(false),
  accounts:  z.array(AccountLineSchema).min(1).max(5000),
});

async function _GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'default';
  const search   = searchParams.get('search');
  const type     = searchParams.get('type');
  const p        = getPrisma(req as any) as any;

  const where: any = { tenantId };
  if (search) where.OR = [{ code: { contains: search } }, { nameEn: { contains: search } }, { nameEn: { contains: search } }];
  if (type)   where.type = type;

  const accounts = await p.account?.findMany?.({
    where,
    orderBy: { code: 'asc' },
    take: 1000,
  }).catch(() => []) ?? [];

  const byType = accounts.reduce((acc: Record<string, number>, a: any) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    tenantId,
    count: accounts.length,
    byType,
    accounts,
  });
}

async function _POST(req: NextRequest) {
  const body   = await req.json();
  const parsed = ImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { tenantId, userId, dryRun, overwrite, accounts } = parsed.data;
  const p = getPrisma(req as any) as any;

  // ── Validate: detect duplicate codes in input ──────────────────────────
  const inputCodes = accounts.map(a => a.code);
  const duplicateInputCodes = inputCodes.filter((c, i) => inputCodes.indexOf(c) !== i);

  if (duplicateInputCodes.length > 0) {
    return NextResponse.json({
      error:      'كودات مكررة في البيانات المستوردة',
      duplicates: [...new Set(duplicateInputCodes)],
    }, { status: 400 });
  }

  // ── Check existing accounts ──────────────────────────────────────────────
  const existingAccounts = await p.account?.findMany?.({
    where: { tenantId, code: { in: inputCodes } },
    select: { code: true, id: true },
  }).catch(() => []) ?? [];

  const existingCodes = new Set(existingAccounts.map((a: any) => a.code));
  const newCodes      = inputCodes.filter(c => !existingCodes.has(c));
  const updateCodes   = inputCodes.filter(c => existingCodes.has(c));

  // ── Validate parent codes exist (or will be created in this batch) ─────
  const parentCodes = accounts.filter(a => a.parentCode).map(a => a.parentCode!);
  const invalidParents = parentCodes.filter(pc => !existingCodes.has(pc) && !inputCodes.includes(pc));

  const validation = {
    totalAccounts:    accounts.length,
    newAccounts:      newCodes.length,
    existingAccounts: updateCodes.length,
    invalidParents:   [...new Set(invalidParents)],
    byType: accounts.reduce((acc: Record<string, number>, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1;
      return acc;
    }, {}),
    preview: accounts.slice(0, 5).map(a => ({
      code: a.code, name: a.name, type: a.type,
      action: existingCodes.has(a.code) ? (overwrite ? 'UPDATE' : 'SKIP') : 'CREATE',
    })),
  };

  if (dryRun) {
    return NextResponse.json({
      dryRun:  true,
      message: `📋 معاينة: ${newCodes.length} جديد، ${updateCodes.length} موجود، ${invalidParents.length > 0 ? `⚠️ ${invalidParents.length} حساب أب غير موجود` : '✅ جميع الحسابات الأب موجودة'}`,
      validation,
    });
  }

  // ── Sort: headers/parents first (by code length), then children ────────
  const sorted = [...accounts].sort((a, b) => {
    if (a.code.length !== b.code.length) return a.code.length - b.code.length;
    return a.code.localeCompare(b.code);
  });

  // ── Import ────────────────────────────────────────────────────────────────
  let created = 0; let updated = 0; let skipped = 0;
  const errors: string[] = [];

  // Build parent ID map
  const codeIdMap = new Map<string, number>(existingAccounts.map((a: any) => [a.code, a.id]));

  for (const acct of sorted) {
    const isExisting = existingCodes.has(acct.code);

    if (isExisting && !overwrite) {
      skipped++;
      continue;
    }

    const parentId = acct.parentCode ? codeIdMap.get(acct.parentCode) ?? null : null;

    const data: any = {
      tenantId,
      code:     acct.code,
      name:   acct.name,
      nameEn:   acct.nameEn ?? acct.name,
      type:     acct.type,
      parentId,
      isHeader: acct.isHeader ?? false,
      currency: acct.currency ?? 'SAR',
      notes:    acct.notes ?? null,
      createdBy:String(userId),
    };

    const result = await p.account?.upsert?.({
      where: { tenantId_code: { tenantId, code: acct.code } },
      create: data,
      update: isExisting ? { nameEn: data.nameEn, nameEn: data.nameEn, type: data.type, parentId, notes: data.notes } : {},
    }).catch(async () =>
      p.account?.create?.({ data }).catch((e: any) => { errors.push(`${acct.code}: ${e.message}`); return null; })
    );

    if (result) {
      codeIdMap.set(acct.code, result.id);
      if (isExisting) updated++; else created++;
    }
  }

  log.info('CoA imported', { tenantId, created, updated, skipped, errors: errors.length });

  return NextResponse.json({
    success:    created > 0 || updated > 0,
    created,
    updated,
    skipped,
    errors:     errors.slice(0, 10),
    validation,
    message:    `✅ تم استيراد ${created} حساب جديد، تحديث ${updated}، تجاهل ${skipped}`,
  }, { status: 201 });
}

export const GET  = withRoute(async ({ req }) => _GET(req as any),  { rateLimit: 'DEFAULT' });
export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'FINANCIAL', roles: ['admin','CFO','accountant'] });
