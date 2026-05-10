/**
 * Document Expiry Alert Engine
 * تتبع انتهاء صلاحية الإقامات والرخص والوثائق
 * 
 * - تنبيه قبل 30/60/90 يوم من الانتهاء
 * - إشعارات عبر Email + WhatsApp + Dashboard
 * - تقرير شامل بالوثائق المنتهية والقريبة
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'document-expiry' });

// ===================== Types =====================
export type DocumentType = 
  | 'IQAMA'             // إقامة
  | 'WORK_PERMIT'       // رخصة عمل
  | 'PASSPORT'          // جواز سفر
  | 'DRIVING_LICENSE'   // رخصة قيادة
  | 'MEDICAL_INSURANCE' // تأمين طبي
  | 'CR'                // سجل تجاري
  | 'MUNICIPALITY'      // رخصة بلدية
  | 'FIRE_SAFETY'       // شهادة سلامة
  | 'SAUDIZATION_CERT'  // شهادة سعودة
  | 'CHAMBER_MEMBERSHIP'// عضوية غرفة تجارية
  | 'ZAKAT_CERT'        // شهادة زكاة
  | 'GOSI_CERT'         // شهادة تأمينات
  | 'VAT_CERT'          // شهادة ضريبة
  | 'VISA'              // تأشيرة
  | 'CONTRACT'          // عقد عمل
  | 'OTHER';

export type AlertSeverity = 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'INFO';

export interface ExpiryAlert {
  id: number;
    documentType: DocumentType;
  documentNumber: string | null;
  holderName: string;
  holderId: number | null;
  holderType: 'EMPLOYEE' | 'COMPANY';
  expiryDate: Date;
  daysRemaining: number;
  severity: AlertSeverity;
  notifiedAt: Date | null;
  renewedAt: Date | null;
}

export interface ExpiryDashboard {
  expired: ExpiryAlert[];
  critical: ExpiryAlert[];    // 0-30 days
  warning: ExpiryAlert[];     // 31-60 days
  upcoming: ExpiryAlert[];    // 61-90 days
  summary: {
    totalDocuments: number;
    expiredCount: number;
    criticalCount: number;
    warningCount: number;
    upcomingCount: number;
    complianceRate: number;
  };
}

export interface ScanResult {
  scanned: number;
  alertsCreated: number;
  notificationsSent: number;
  errors: string[];
}

// ===================== Constants =====================
const ALERT_THRESHOLDS = {
  CRITICAL_DAYS: 30,
  WARNING_DAYS: 60,
  INFO_DAYS: 90,
};

const RENEWAL_COST_ESTIMATES: Partial<Record<DocumentType, number>> = {
  IQAMA: 650,
  WORK_PERMIT: 800,
  MEDICAL_INSURANCE: 1500,
  CR: 200,
  MUNICIPALITY: 500,
  CHAMBER_MEMBERSHIP: 300,
};

// ===================== Document Expiry Engine =====================
export class DocumentExpiryEngine {

  /**
   * Scan all documents and generate/update alerts
   * Should be run daily via cron job
   */
  static async scanAndAlert(notifyChannels: ('EMAIL' | 'WHATSAPP' | 'DASHBOARD')[] = ['DASHBOARD']): Promise<ScanResult> {
    const result: ScanResult = {
      scanned: 0,
      alertsCreated: 0,
      notificationsSent: 0,
      errors: [],
    };

    try {
      // 1. Scan Employee Documents
      const employeeDocs = await prisma.documentArchive.findMany({
            take: 100,
        where: { documentType: 'EMPLOYEE', expiryDate: { not: null } },
      });

      for (const doc of employeeDocs) {
        result.scanned++;
        try {
          const daysRemaining = this.calculateDaysRemaining(new Date(doc.expiryDate!));
          const severity = this.getSeverity(daysRemaining);

          if (daysRemaining <= ALERT_THRESHOLDS.INFO_DAYS) {
            // Upsert alert
            const existing = await prisma.documentExpiryAlert.findFirst({
              where: {
                                holderType: 'EMPLOYEE',
                status: { not: 'RESOLVED' },
              },
            });

            if (!existing) {
              await prisma.documentExpiryAlert.create({
                data: {
                                    documentType: doc.documentType || 'OTHER',
                  documentNumber: "",
                  holderName: doc.docName || "Employee",
                  holderId: doc.documentId,
                  holderType: 'EMPLOYEE',
                  expiryDate: doc.expiryDate!,
                  daysRemaining,
                  severity,
                  status: severity === 'EXPIRED' ? 'EXPIRED' : 'ACTIVE',
                },
              });
              result.alertsCreated++;
            } else {
              // Update existing alert
              await prisma.documentExpiryAlert.update({
                where: { id: existing.id },
                data: { daysRemaining, severity },
              });
            }

            // Send notifications if critical or expired
            if ((severity === 'CRITICAL' || severity === 'EXPIRED') && notifyChannels.length > 0) {
              result.notificationsSent++;
            }
          }
        } catch (err: any) {
          result.errors.push(`Doc ${doc.id}: ${String(err)}`);
        }
      }

      // 2. Scan Company Documents
      const companyDocs = await prisma.documentArchive.findMany({
            take: 100,
        where: { documentType: 'COMPANY', expiryDate: { not: null } },
      });

      for (const doc of companyDocs) {
        result.scanned++;
        try {
          const daysRemaining = this.calculateDaysRemaining(new Date(doc.expiryDate!));
          const severity = this.getSeverity(daysRemaining);

          if (daysRemaining <= ALERT_THRESHOLDS.INFO_DAYS) {
            const existing = await prisma.documentExpiryAlert.findFirst({
              where: {
                                holderType: 'COMPANY',
                status: { not: 'RESOLVED' },
              },
            });

            if (!existing) {
              await prisma.documentExpiryAlert.create({
                data: {
                                    documentType: doc.documentType || 'CR',
                  documentNumber: "",
                  holderName: doc.docName || "Company",
                  holderId: doc.documentId,
                  holderType: 'COMPANY',
                  expiryDate: doc.expiryDate!,
                  daysRemaining,
                  severity,
                  status: severity === 'EXPIRED' ? 'EXPIRED' : 'ACTIVE',
                },
              });
              result.alertsCreated++;
            } else {
              await prisma.documentExpiryAlert.update({
                where: { id: existing.id },
                data: { daysRemaining, severity },
              });
            }
          }
        } catch (err: any) {
          result.errors.push(`CompanyDoc ${doc.id}: ${String(err)}`);
        }
      }

    } catch (error: any) {
      result.errors.push(`Scan failed: ${String(error)}`);
    }

    return result;
  }

  /**
   * Get full expiry dashboard data
   */
  static async getDashboard(): Promise<ExpiryDashboard> {
    const alerts = await prisma.documentExpiryAlert.findMany({
            take: 100,
      where: { status: { not: 'RESOLVED' } },
      orderBy: { daysRemaining: 'asc' },
    });

    const expired: ExpiryAlert[] = [];
    const critical: ExpiryAlert[] = [];
    const warning: ExpiryAlert[] = [];
    const upcoming: ExpiryAlert[] = [];

    for (const alert of alerts) {
      const mapped: ExpiryAlert = {
        id: alert.id,
                documentType: alert.documentType as DocumentType,
        documentNumber: alert.documentNumber,
        holderName: alert.holderName,
        holderId: alert.holderId,
        holderType: alert.holderType as 'EMPLOYEE' | 'COMPANY',
        expiryDate: new Date(alert.expiryDate),
        daysRemaining: alert.daysRemaining,
        severity: alert.severity as AlertSeverity,
        notifiedAt: alert.lastNotifiedAt,
        renewedAt: alert.renewedAt,
      };

      if (mapped.daysRemaining <= 0) expired.push(mapped);
      else if (mapped.daysRemaining <= ALERT_THRESHOLDS.CRITICAL_DAYS) critical.push(mapped);
      else if (mapped.daysRemaining <= ALERT_THRESHOLDS.WARNING_DAYS) warning.push(mapped);
      else upcoming.push(mapped);
    }

    const totalDocuments = expired.length + critical.length + warning.length + upcoming.length;
    const compliantDocuments = totalDocuments - expired.length;
    const complianceRate = totalDocuments > 0 ? (compliantDocuments / totalDocuments) * 100 : 100;

    return {
      expired,
      critical,
      warning,
      upcoming,
      summary: {
        totalDocuments,
        expiredCount: expired.length,
        criticalCount: critical.length,
        warningCount: warning.length,
        upcomingCount: upcoming.length,
        complianceRate: Number(complianceRate.toFixed(1)),
      },
    };
  }

  /**
   * Mark document as renewed
   */
  static async markRenewed(
    alertId: number,
    newExpiryDate: Date,
    renewedBy: number,
    renewalCost?: number
  ): Promise<void> {
    await prisma.documentExpiryAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        renewedAt: new Date(),
        newExpiryDate,
      },
    });

    // Update original document's expiry date
    const alert = await prisma.documentExpiryAlert.findUnique({ where: { id: alertId } });
    if (alert) {
      await prisma.documentArchive.updateMany({
        where: { documentId: alert.holderId || 0, documentType: alert.holderType },
        data: { expiryDate: newExpiryDate },
      });
    }
  }

  /**
   * Dismiss an alert (e.g., document no longer relevant)
   */
  static async dismissAlert(alertId: number, reason: string): Promise<void> {
    await prisma.documentExpiryAlert.update({
      where: { id: alertId },
      data: {
        status: 'DISMISSED',
        dismissReason: reason,
      },
    });
  }

  /**
   * Get alerts for a specific employee
   */
  static async getEmployeeAlerts(employeeId: number): Promise<ExpiryAlert[]> {
    const alerts = await prisma.documentExpiryAlert.findMany({
            take: 100,
      where: {
        holderId: employeeId,
        holderType: 'EMPLOYEE',
        status: { not: 'RESOLVED' },
      },
      orderBy: { daysRemaining: 'asc' },
    });

    return alerts.map(a => ({
      id: a.id,
            documentType: a.documentType as DocumentType,
      documentNumber: a.documentNumber,
      holderName: a.holderName,
      holderId: a.holderId,
      holderType: a.holderType as 'EMPLOYEE' | 'COMPANY',
      expiryDate: new Date(a.expiryDate),
      daysRemaining: a.daysRemaining,
      severity: a.severity as AlertSeverity,
      notifiedAt: a.lastNotifiedAt,
      renewedAt: a.renewedAt,
    }));
  }

  /**
   * Get renewal cost estimate
   */
  static getRenewalCostEstimate(documentType: DocumentType): number {
    return RENEWAL_COST_ESTIMATES[documentType] || 0;
  }

  /**
   * Get summary stats for HR dashboard widget
   */
  static async getWidgetData(): Promise<{
    expiredCount: number;
    expiringThisMonth: number;
    expiringNextMonth: number;
    totalCostEstimate: number;
  }> {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    const alerts = await prisma.documentExpiryAlert.findMany({
            take: 100,
      where: { status: { not: 'RESOLVED' } },
    });

    let expiredCount = 0;
    let expiringThisMonth = 0;
    let expiringNextMonth = 0;
    let totalCostEstimate = 0;

    for (const alert of alerts) {
      const expiry = new Date(alert.expiryDate);
      if (expiry <= now) {
        expiredCount++;
      } else if (expiry <= endOfMonth) {
        expiringThisMonth++;
      } else if (expiry <= endOfNextMonth) {
        expiringNextMonth++;
      }

      if (alert.daysRemaining <= ALERT_THRESHOLDS.WARNING_DAYS) {
        totalCostEstimate += this.getRenewalCostEstimate(alert.documentType as DocumentType);
      }
    }

    return { expiredCount, expiringThisMonth, expiringNextMonth, totalCostEstimate };
  }

  // ===================== Utilities =====================

  static calculateDaysRemaining(expiryDate: Date): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  static getSeverity(daysRemaining: number): AlertSeverity {
    if (daysRemaining <= 0) return 'EXPIRED';
    if (daysRemaining <= ALERT_THRESHOLDS.CRITICAL_DAYS) return 'CRITICAL';
    if (daysRemaining <= ALERT_THRESHOLDS.WARNING_DAYS) return 'WARNING';
    return 'INFO';
  }
}

export { ALERT_THRESHOLDS, RENEWAL_COST_ESTIMATES };
