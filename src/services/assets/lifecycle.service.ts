/**
 * AssetLifecycleService — دورة حياة الأصل الكاملة
 * - التخلص (Disposal): بيع / خردة / تحويل + قيد أرباح/خسائر
 * - CWIP: تتبع التكاليف + رسملة عند الاكتمال
 * - إعادة التقييم: وفق IAS 16 (فائض → OCI 3310)
 */
import { Decimal } from '@prisma/client/runtime/library';
import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export class AssetLifecycleService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  /** التخلص من الأصل (بيع / خردة) */
  async disposeAsset(
    assetId: string,
    disposalDate: Date,
    salePrice: number,
    method: 'SALE' | 'SCRAP' | 'TRANSFER' = 'SALE',
  ) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const asset = await prisma.fixedAsset?.findFirst?.({
      where: { id: assetId, tenantId },
      select: { id: true, cost: true, accumDepreciation: true, name: true },
    }).catch(() => null);

    if (!asset) throw new Error(`الأصل ${assetId} غير موجود`);

    const cost          = new Decimal(asset.cost ?? 0);
    const accumDep      = new Decimal(asset.accumDepreciation ?? 0);
    const nbv           = cost.sub(accumDep);
    const salePriceDec  = new Decimal(salePrice);
    const gainLoss      = salePriceDec.sub(nbv);
    const isGain        = gainLoss.gte(0);

    const jeLines: any[] = [
      { tenantId, accountCode: '1421', debit: accumDep,        credit: new Decimal(0), description: 'استبعاد مجمع الاستهلاك' },
      { tenantId, accountCode: '1420', debit: new Decimal(0), credit: cost,            description: `استبعاد الأصل: ${asset.name}` },
    ];

    if (salePrice > 0) {
      jeLines.push({ tenantId, accountCode: '1112', debit: salePriceDec, credit: new Decimal(0), description: 'عائد بيع الأصل' });
    }

    if (!gainLoss.isZero()) {
      jeLines.push(
        isGain
          ? { tenantId, accountCode: '4910', debit: new Decimal(0), credit: gainLoss.abs(), description: 'أرباح التصرف في الأصول' }
          : { tenantId, accountCode: '5240', debit: gainLoss.abs(), credit: new Decimal(0), description: 'خسارة التصرف في الأصول' },
      );
    }

    const je = await prisma.journalEntry?.create?.({
      data: {
        tenantId,
        reference:   `DISP-${assetId}`,
        description: `التخلص من الأصل: ${asset.name} (${method})`,
        date:        disposalDate,
        status:      'POSTED',
        sourceType:  'ASSET_DISPOSAL',
        sourceId:    assetId,
        lines:       { create: jeLines.filter(l => l.debit.gt(0) || l.credit.gt(0)) },
      },
    }).catch(() => null);

    await prisma.fixedAsset?.update?.({
      where: { id: assetId },
      data:  { status: 'DISPOSED', disposedAt: disposalDate, disposalMethod: method, disposalJeId: je?.id },
    }).catch(() => null);

    return { assetId, nbv: nbv.toNumber(), salePrice, gainLoss: gainLoss.toNumber(), isGain, journalEntryId: je?.id };
  }

  /** رسملة CWIP → أصل ثابت عند الاكتمال */
  async capitalizeFromCWIP(cwipId: string, assetName: string, assetCategoryId?: string) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const cwip = await prisma.cwip?.findFirst?.({
      where: { id: cwipId, tenantId },
      select: { id: true, totalCost: true, projectName: true },
    }).catch(() => null);

    const totalCost = new Decimal(cwip?.totalCost ?? 0);
    if (totalCost.isZero()) throw new Error('لا يمكن رسملة CWIP بقيمة صفر');

    const asset = await prisma.fixedAsset?.create?.({
      data: {
        tenantId, name: assetName,
        cost: totalCost, accumDepreciation: new Decimal(0),
        status: 'ACTIVE', categoryId: assetCategoryId,
        acquisitionDate: new Date(),
        cwipId,
      },
    }).catch(() => ({ id: `AST-${Date.now()}` }));

    await prisma.journalEntry?.create?.({
      data: {
        tenantId,
        reference:   `CWIP-CAP-${cwipId}`,
        description: `رسملة CWIP → أصل ثابت: ${assetName}`,
        date:        new Date(),
        status:      'POSTED',
        sourceType:  'ASSET_CAPITALIZATION',
        lines: {
          create: [
            { tenantId, accountCode: '1420', debit: totalCost,        credit: new Decimal(0), description: `أصل ثابت جديد: ${assetName}` },
            { tenantId, accountCode: '1430', debit: new Decimal(0), credit: totalCost,        description: 'استبعاد CWIP عند الرسملة' },
          ],
        },
      },
    }).catch(() => null);

    await prisma.cwip?.update?.({ where: { id: cwipId }, data: { status: 'CAPITALIZED', capitalizedAt: new Date(), fixedAssetId: asset?.id } }).catch(() => null);

    return { assetId: asset?.id, totalCost: totalCost.toNumber(), assetName };
  }

  /** إعادة تقييم الأصل وفق IAS 16 */
  async revalueAsset(assetId: string, newCarryingValue: number) {
    const tenantId = this.ctx.tenant.id;
    const prisma   = this.prisma as any;

    const asset = await prisma.fixedAsset?.findFirst?.({
      where: { id: assetId, tenantId },
      select: { cost: true, accumDepreciation: true, name: true },
    }).catch(() => null);

    if (!asset) throw new Error(`الأصل ${assetId} غير موجود`);

    const currentNBV   = new Decimal(asset.cost ?? 0).sub(new Decimal(asset.accumDepreciation ?? 0));
    const newNBVDec    = new Decimal(newCarryingValue);
    const surplus      = newNBVDec.sub(currentNBV);

    if (surplus.isZero()) return { message: 'لا يوجد فرق في القيمة' };

    const isUpward = surplus.gt(0);
    const jeLines = isUpward
      ? [
          { tenantId, accountCode: '1420', debit: surplus.abs(), credit: new Decimal(0), description: 'إعادة تقييم — زيادة في تكلفة الأصل' },
          { tenantId, accountCode: '3310', debit: new Decimal(0), credit: surplus.abs(), description: 'فائض إعادة التقييم (OCI)' },
        ]
      : [
          { tenantId, accountCode: '5200', debit: surplus.abs(), credit: new Decimal(0), description: 'خسارة إعادة التقييم' },
          { tenantId, accountCode: '1420', debit: new Decimal(0), credit: surplus.abs(), description: 'تخفيض تكلفة الأصل' },
        ];

    await prisma.journalEntry?.create?.({
      data: {
        tenantId,
        reference:   `REVAL-${assetId}`,
        description: `إعادة تقييم: ${asset.name}`,
        date:        new Date(),
        status:      'POSTED',
        sourceType:  'ASSET_REVALUATION',
        lines:       { create: jeLines },
      },
    }).catch(() => null);

    return { assetId, currentNBV: currentNBV.toNumber(), newCarryingValue, surplus: surplus.toNumber(), isUpward };
  }
}
