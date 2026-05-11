/**
 * Asset Lifecycle API
 * GET  /api/finance/asset-lifecycle?action=portfolio
 * GET  /api/finance/asset-lifecycle?action=schedule&assetId=X
 * GET  /api/finance/asset-lifecycle?action=impairment&assetId=X&fairValue=X&valueInUse=X
 * POST /api/finance/asset-lifecycle { action: 'schedule', ...AssetInput }
 * POST /api/finance/asset-lifecycle { action: 'disposal', assetId, proceeds }
 * POST /api/finance/asset-lifecycle { action: 'cwip-transfer', cwipName, cwipAmount, assetCategory }
 */
import { NextResponse, NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { AssetLifecycleEngine, AssetInput, DepreciationMethod } from '@/lib/asset-lifecycle-engine';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api.finance.asset-lifecycle' });

export async function GET(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const action  = searchParams.get('action') || 'portfolio';
    const assetId = searchParams.get('assetId') ? parseInt(searchParams.get('assetId')!) : null;

    if (action === 'portfolio') {
      const summary = await AssetLifecycleEngine.getCurrentYearCharge();
      const assets  = await prisma.fixedAsset.findMany({
        where:   { status: { in: ['ACTIVE', 'active'] } },
        select:  {
          id: true, name: true, category: true,
          acquisitionCost: true, accumulatedDepreciation: true, currentBookValue: true,
          acquisitionDate: true, usefulLifeYears: true,
          depreciationMethod: true, salvageValue: true,
        },
        orderBy: { acquisitionDate: 'desc' },
        take: 200,
      }).catch(() => [] as any[]);

      return NextResponse.json({ ...summary, assets });
    }

    if (action === 'schedule' && assetId) {
      const asset = await prisma.fixedAsset.findUnique({
        where: { id: assetId },
      }).catch(() => null);

      if (!asset) return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });

      const input: AssetInput = {
        assetId:            (asset as any).id,
        name:               (asset as any).name,
        category:           String((asset as any).categoryId || 'General'),
        acquisitionDate:    new Date((asset as any).acquisitionDate),
        acquisitionCost:    Number((asset as any).acquisitionCost || 0),
        residualValue:      Number((asset as any).salvageValue || 0),
        usefulLifeYears:    Number((asset as any).usefulLifeYears || 5),
        depreciationMethod: ((asset as any).depreciationMethod || 'STRAIGHT_LINE') as DepreciationMethod,
      };

      const schedule = AssetLifecycleEngine.generateSchedule(input);
      return NextResponse.json(schedule);
    }

    if (action === 'impairment' && assetId) {
      const asset = await prisma.fixedAsset.findUnique({
        where:  { id: assetId },
        select: { id: true, name: true, acquisitionCost: true, accumulatedDepreciation: true },
      }).catch(() => null);

      if (!asset) return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });

      const bookValue      = Number((asset as any).acquisitionCost || 0) - Number((asset as any).accumulatedDepreciation || 0);
      const fairValueLessCD = parseFloat(searchParams.get('fairValue') || '0');
      const valueInUse      = parseFloat(searchParams.get('valueInUse') || '0');

      const result = AssetLifecycleEngine.testImpairment({
        assetId: (asset as any).id,
        assetName: (asset as any).name,
        bookValue,
        fairValueLessCD,
        valueInUse,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'action غير معروف أو assetId مفقود' }, { status: 400 });
  } catch (error: any) {
    log.error('Asset lifecycle GET error:', error);
    return NextResponse.json({ error: error.message || 'خطأ داخلي' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = getUserFromRequest(request as any);
    if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body   = await request.json();
    const action = body.action;

    if (action === 'schedule') {
      const input: AssetInput = {
        name:               body.name,
        category:           body.category,
        acquisitionDate:    new Date(body.acquisitionDate),
        acquisitionCost:    parseFloat(body.acquisitionCost),
        residualValue:      parseFloat(body.residualValue || 0),
        usefulLifeYears:    parseInt(body.usefulLifeYears),
        depreciationMethod: body.depreciationMethod as DepreciationMethod,
        currency:           body.currency || 'SAR',
      };

      const result = AssetLifecycleEngine.generateSchedule(input);
      return NextResponse.json(result);
    }

    if (action === 'disposal') {
      const { assetId, proceeds } = body;
      if (!assetId) return NextResponse.json({ error: 'assetId مطلوب' }, { status: 400 });

      const asset = await prisma.fixedAsset.findUnique({
        where:  { id: parseInt(assetId) },
        select: { id: true, name: true, acquisitionCost: true, accumulatedDepreciation: true },
      }).catch(() => null);

      if (!asset) return NextResponse.json({ error: 'الأصل غير موجود' }, { status: 404 });

      const result = AssetLifecycleEngine.calculateDisposal({
        assetId:                 (asset as any).id,
        assetName:               (asset as any).name,
        acquisitionCost:         Number((asset as any).acquisitionCost         || 0),
        accumulatedDepreciation: Number((asset as any).accumulatedDepreciation || 0),
        proceedsFromDisposal:    parseFloat(proceeds || 0),
      });

      return NextResponse.json(result);
    }

    if (action === 'cwip-transfer') {
      const result = AssetLifecycleEngine.generateCWIPTransfer({
        cwipName:      body.cwipName,
        cwipAmount:    parseFloat(body.cwipAmount),
        assetCategory: body.assetCategory,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'action غير معروف' }, { status: 400 });
  } catch (error: any) {
    log.error('Asset lifecycle POST error:', error);
    return NextResponse.json({ error: error.message || 'خطأ داخلي' }, { status: 500 });
  }
}
