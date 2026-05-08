/**
 * PDPLService — نظام حماية البيانات الشخصية
 *
 * النماذج: PdplConsent, PdplDataSubjectRequest, PdplBreachIncident
 *
 * يُطبِّق متطلبات نظام حماية البيانات الشخصية السعودي (PDPL) الصادر 1443هـ:
 *  - المادة 12: الرد على طلبات أصحاب البيانات خلال 30 يوماً
 *  - المادة 18: إخطار الجهة المختصة (NDMO) بالاختراق خلال 72 ساعة
 *  - المادة 8: الحصول على موافقة صريحة لكل غرض
 */

import type { PrismaClient } from '@prisma/client';
import type { BusinessContext } from '@/services/shared/event-bus.service';

export type ConsentPurpose = 'MARKETING' | 'HR_PROCESSING' | 'DATA_SHARING' | 'ANALYTICS';
export type LegalBasis = 'CONSENT' | 'CONTRACT' | 'LEGAL_OBLIGATION' | 'VITAL_INTEREST' | 'PUBLIC_INTEREST';
export type DSRType = 'ACCESS' | 'ERASE' | 'RECTIFY' | 'RESTRICT' | 'PORTABILITY';

export class PDPLService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly ctx: BusinessContext,
  ) {}

  // ─── Consent Management ───────────────────────────────────────────────────

  async grantConsent(
    subjectType: string,
    subjectId: number,
    purpose: ConsentPurpose,
    legalBasis: LegalBasis,
    evidenceHash?: string,
  ): Promise<void> {
    const prisma = this.prisma as any;
    await prisma.pdplConsent.upsert({
      where: { subjectType_subjectId_purpose: { subjectType, subjectId, purpose } },
      update: { granted: true, grantedAt: new Date(), revokedAt: null, legalBasis, evidenceHash },
      create: {
        tenantId: this.ctx.tenant.id,
        subjectType, subjectId, purpose, legalBasis,
        granted: true, grantedAt: new Date(), evidenceHash,
      },
    });
  }

  async revokeConsent(subjectType: string, subjectId: number, purpose: ConsentPurpose): Promise<void> {
    await (this.prisma as any).pdplConsent.updateMany({
      where: { tenantId: this.ctx.tenant.id, subjectType, subjectId, purpose },
      data: { granted: false, revokedAt: new Date() },
    });
  }

  async checkConsent(subjectType: string, subjectId: number, purpose: ConsentPurpose): Promise<boolean> {
    const record = await (this.prisma as any).pdplConsent.findUnique({
      where: { subjectType_subjectId_purpose: { subjectType, subjectId, purpose } },
    });
    return record?.granted === true && record.revokedAt === null;
  }

  async getActiveConsents(subjectType: string, subjectId: number) {
    return (this.prisma as any).pdplConsent.findMany({
      where: { tenantId: this.ctx.tenant.id, subjectType, subjectId, granted: true, revokedAt: null },
    });
  }

  // ─── Data Subject Rights ─────────────────────────────────────────────────

  /**
   * تقديم طلب صاحب البيانات — الرد خلال 30 يوماً (المادة 12)
   */
  async submitDSR(
    requestType: DSRType,
    subjectType: string,
    subjectId: number,
    subjectIdentifier: string,
  ) {
    const receivedAt = new Date();
    const dueDate = new Date(receivedAt);
    dueDate.setDate(dueDate.getDate() + 30); // 30 يوماً كما تشترط المادة 12

    return (this.prisma as any).pdplDataSubjectRequest.create({
      data: {
        tenantId: this.ctx.tenant.id,
        requestType, subjectType, subjectId, subjectIdentifier,
        status: 'RECEIVED', receivedAt, dueDate,
      },
    });
  }

  /**
   * قائمة الطلبات المتأخرة — تجاوزت 30 يوماً
   */
  async getOverdueRequests() {
    return (this.prisma as any).pdplDataSubjectRequest.findMany({
      where: {
        tenantId: this.ctx.tenant.id,
        status: { in: ['RECEIVED', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async completeDSR(requestId: number, evidenceUrl?: string): Promise<void> {
    await (this.prisma as any).pdplDataSubjectRequest.update({
      where: { id: requestId },
      data: { status: 'COMPLETED', completedAt: new Date(), evidenceUrl, handledByUserId: parseInt(this.ctx.user.id) || null },
    });
  }

  // ─── Data Breach ─────────────────────────────────────────────────────────

  /**
   * تسجيل اختراق بيانات — يجب الإخطار خلال 72 ساعة (المادة 18)
   */
  async reportBreach(params: {
    description: string;
    affectedRecords: number;
    dataCategories: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }) {
    const reportedAt = new Date();
    const notifyDeadline = new Date(reportedAt);
    notifyDeadline.setHours(notifyDeadline.getHours() + 72); // 72 ساعة

    const breach = await (this.prisma as any).pdplBreachIncident.create({
      data: {
        tenantId: this.ctx.tenant.id,
        description: params.description,
        affectedRecords: params.affectedRecords,
        dataCategories: JSON.stringify(params.dataCategories),
        severity: params.severity,
        reportedAt,
        ndmoNotifyDeadline: notifyDeadline,
        status: 'OPEN',
        reportedByUserId: parseInt(this.ctx.user.id) || null,
      },
    });
    return { breachId: breach.id, notifyDeadline };
  }

  /**
   * تقرير لوحة DPO: إحصائيات الامتثال
   */
  async getDPODashboard() {
    const tenantId = this.ctx.tenant.id;
    const prisma = this.prisma as any;
    const now = new Date();

    const [totalConsents, activeConsents, pendingDSRs, overdueDSRs, openBreaches] = await Promise.all([
      prisma.pdplConsent.count({ where: { tenantId } }),
      prisma.pdplConsent.count({ where: { tenantId, granted: true, revokedAt: null } }),
      prisma.pdplDataSubjectRequest.count({ where: { tenantId, status: { in: ['RECEIVED', 'IN_PROGRESS'] } } }),
      prisma.pdplDataSubjectRequest.count({ where: { tenantId, status: { in: ['RECEIVED', 'IN_PROGRESS'] }, dueDate: { lt: now } } }),
      prisma.pdplBreachIncident.count({ where: { tenantId, status: 'OPEN' } }).catch(() => 0),
    ]);

    return { totalConsents, activeConsents, pendingDSRs, overdueDSRs, openBreaches };
  }
}
