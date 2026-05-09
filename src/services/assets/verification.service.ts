/**
 * Asset Verification Service
 * Physical verification, barcode/QR generation
 * Annual fixed asset physical count
 */
import { PrismaClient } from '@prisma/client';

export interface BarcodeData {
  assetId: number;
  assetNumber: string;
  barcodeUrl: string;
  qrCodeUrl: string;
  qrPayload: string;
}

export interface VerificationScheduleRow {
  team: number;
  assetsTarget: number;
  dailyTarget: number;
  startDate: Date;
  endDate: Date;
}

export class AssetVerificationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate barcode + QR code data for an asset
   */
  async generateBarcode(assetId: number, tenantId: string): Promise<BarcodeData> {
    const asset = await this.prisma.fixedAsset.findFirstOrThrow({
      where: { id: assetId, tenantId },
      select: { id: true, assetNumber: true, name: true, locationId: true, categoryId: true },
    });

    const qrPayload = JSON.stringify({
      id: asset.id,
      code: asset.assetNumber,
      name: asset.name,
      t: tenantId,
    });

    const encoded = encodeURIComponent(asset.assetNumber ?? String(asset.id));
    const qrEncoded = encodeURIComponent(qrPayload);

    return {
      assetId: asset.id,
      assetNumber: asset.assetNumber ?? String(asset.id),
      barcodeUrl: `https://barcode.tec-it.com/barcode.ashx?data=${encoded}&code=Code128`,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrEncoded}`,
      qrPayload,
    };
  }

  /**
   * Start a verification session (stored as AuditLog JSON)
   */
  async startVerificationSession(tenantId: string, data: {
    name: string;
    startDate: Date;
    endDate: Date;
    branchId?: number;
    assignedTo: string[];
  }): Promise<{ sessionId: string }> {
    // Store session as an AuditLog record with details JSON
    const log = await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'CREATE',
        tableName: 'asset_verification_session',
        details: JSON.stringify({ ...data, status: 'IN_PROGRESS', createdAt: new Date() }),
      },
    });
    return { sessionId: log.id };
  }

  /**
   * Record a verification scan result
   */
  async recordScan(tenantId: string, sessionId: string, data: {
    assetId: number;
    verified: boolean;
    foundAtLocationId?: number;
    condition: 'GOOD' | 'FAIR' | 'POOR' | 'MISSING';
    notes?: string;
    verifiedBy: string;
  }): Promise<void> {
    // Update asset's last verified timestamp via notes field
    await this.prisma.fixedAsset.update({
      where: { id: data.assetId },
      data: {
        lastPhysicalCountDate: new Date(),
        lastPhysicalCountStatus: data.condition === 'MISSING' ? 'MISSING' : 'FOUND',
        locationId: data.foundAtLocationId ?? undefined,
      },
    });

    // Log verification
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'UPDATE',
        tableName: 'fixed_assets',
        recordId: String(data.assetId),
        details: JSON.stringify({ sessionId, ...data }),
      },
    });
  }

  /**
   * Close session and generate discrepancy summary
   */
  async closeSession(tenantId: string, sessionId: string, verifiedAssetIds: number[]): Promise<{
    total: number;
    verified: number;
    missing: number;
  }> {
    const allAssets = await this.prisma.fixedAsset.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: { id: true },
    });

    const verifiedSet = new Set(verifiedAssetIds);
    const missing = allAssets.filter((a) => !verifiedSet.has(a.id)).length;

    // Update session log
    await this.prisma.auditLog.update({
      where: { id: sessionId },
      data: {
        details: JSON.stringify({
          status: 'COMPLETED',
          completedAt: new Date(),
          total: allAssets.length,
          verified: verifiedAssetIds.length,
          missing,
        }),
      },
    });

    return { total: allAssets.length, verified: verifiedAssetIds.length, missing };
  }

  /**
   * Generate verification schedule
   */
  generateVerificationSchedule(
    totalAssets: number,
    teamsCount: number,
    startDate: Date,
    daysAvailable: number,
  ): VerificationScheduleRow[] {
    const perTeam = Math.ceil(totalAssets / teamsCount);
    const dailyTarget = Math.ceil(perTeam / daysAvailable);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysAvailable);

    return Array.from({ length: teamsCount }, (_, i) => ({
      team: i + 1,
      assetsTarget: i === teamsCount - 1 ? totalAssets - perTeam * i : perTeam,
      dailyTarget,
      startDate,
      endDate,
    }));
  }
}
