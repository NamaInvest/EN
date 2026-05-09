/**
 * Saudi Compliance Facade
 * Single entry point for ZATCA, GOSI, Qiwa/Nitaqat, PDPL, WPS
 * Eliminates duplicated tenant resolution + audit logging across 4 siloed engines
 *
 * Usage:
 *   import { saudiCompliance } from '@/lib/saudi-compliance';
 *   const result = await saudiCompliance(prisma, tenantId).gosi.calculateForEmployee(...);
 */
import { PrismaClient } from '@prisma/client';

// ─── Audit helper shared by all modules ────────────────────────────────────

async function auditAction(
  prisma: PrismaClient, tenantId: string, engine: string, action: string, details: object
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId,
      action: `COMPLIANCE:${engine}:${action}`,
      tableName: 'compliance',
      details: JSON.stringify({ engine, action, ...details, ts: new Date() }),
    },
  });
}

// ─── GOSI (2024 KSA Rules) ──────────────────────────────────────────────────

export interface GOSIResult {
  employeeContribution: number;
  employerContribution: number;
  subjectWage: number;
  nationality: string;
  breakdown: Record<string, number>;
}

function buildGosiModule(prisma: PrismaClient, tenantId: string) {
  const calcWage = (basic: number, housing: number) =>
    Math.max(1500, Math.min(45000, basic + housing));

  return {
    async calculateForEmployee(
      employeeId: number, basicSalary: number, housingAllowance: number
    ): Promise<GOSIResult> {
      const emp = await prisma.employee.findFirstOrThrow({
        where: { id: employeeId, tenantId }, select: { nationality: true },
      });
      const wage = calcWage(basicSalary, housingAllowance);
      const isSaudi = emp.nationality === 'SAUDI';
      const r = (n: number) => Math.round(n * 100) / 100;

      let employeeContribution = 0;
      let employerContribution = 0;
      const breakdown: Record<string, number> = {};

      if (isSaudi) {
        breakdown.pension_employee  = r(wage * 0.09);
        breakdown.saned_employee    = r(wage * 0.01);
        breakdown.pension_employer  = r(wage * 0.09);
        breakdown.saned_employer    = r(wage * 0.01);
        breakdown.hazards_employer  = r(wage * 0.01);
        employeeContribution = breakdown.pension_employee + breakdown.saned_employee;
        employerContribution = breakdown.pension_employer + breakdown.saned_employer + breakdown.hazards_employer;
      } else {
        breakdown.hazards_employer = r(wage * 0.02);
        employerContribution = breakdown.hazards_employer;
      }

      await auditAction(prisma, tenantId, 'GOSI', 'calculateForEmployee',
        { employeeId, wage, employeeContribution, employerContribution });

      return { employeeContribution, employerContribution, subjectWage: wage,
        nationality: emp.nationality, breakdown };
    },

    async runMonthlyBatch(year: number, month: number): Promise<{
      processed: number; totalEmployee: number; totalEmployer: number;
    }> {
      const employees = await prisma.employee.findMany({
        where: { tenantId, active: true, deletedAt: null },
        select: { id: true, salary: true, housingAllowance: true },
      });
      let totalEmployee = 0, totalEmployer = 0;
      for (const emp of employees) {
        const r = await this.calculateForEmployee(emp.id, Number(emp.salary), Number(emp.housingAllowance));
        totalEmployee += r.employeeContribution;
        totalEmployer += r.employerContribution;
      }
      await auditAction(prisma, tenantId, 'GOSI', 'runMonthlyBatch',
        { year, month, count: employees.length, totalEmployee, totalEmployer });
      return { processed: employees.length, totalEmployee, totalEmployer };
    },
  };
}

// ─── Nitaqat/Saudization ────────────────────────────────────────────────────

export interface NitaqatStatus {
  saudizationPct: number;
  band: 'PLATINUM' | 'GREEN_HIGH' | 'GREEN_MID' | 'GREEN_LOW' | 'YELLOW' | 'RED';
  compliant: boolean;
  headcount: { saudi: number; total: number };
}

function buildNitaqatModule(prisma: PrismaClient, tenantId: string) {
  const BANDS: { band: NitaqatStatus['band']; min: number }[] = [
    { band: 'PLATINUM', min: 0.45 }, { band: 'GREEN_HIGH', min: 0.35 },
    { band: 'GREEN_MID', min: 0.25 }, { band: 'GREEN_LOW', min: 0.15 },
    { band: 'YELLOW', min: 0.10 }, { band: 'RED', min: 0 },
  ];

  return {
    async getStatus(): Promise<NitaqatStatus> {
      const [total, saudi] = await Promise.all([
        prisma.employee.count({ where: { tenantId, active: true } }),
        prisma.employee.count({ where: { tenantId, active: true, nationality: 'SAUDI' } }),
      ]);
      const pct = total > 0 ? saudi / total : 0;
      const band = (BANDS.find((b) => pct >= b.min) ?? BANDS[BANDS.length - 1]).band;

      // Save snapshot (optional, ignore failure)
      await prisma.saudizationSnapshot.create({
        data: {
          tenantId,
          snapshotDate: new Date(),
          totalEmployees: total,
          saudiEmployees: saudi,
          saudiPct: pct,
          activityCode: 'DEFAULT',
          sizeBracket: total < 5 ? 'MICRO' : total < 50 ? 'SMALL' : total < 500 ? 'MEDIUM' : 'LARGE',
          nitaqatBand: band,
          source: 'MANUAL',
        },
      }).catch(() => {});

      return { saudizationPct: Math.round(pct * 10000) / 100, band, compliant: pct >= 0.15, headcount: { saudi, total } };
    },
  };
}

// ─── PDPL ────────────────────────────────────────────────────────────────────

function buildPdplModule(prisma: PrismaClient, tenantId: string) {
  return {
    /** PDPL Art 12 — DSR must be fulfilled within 30 days */
    async createDSR(input: {
      subjectName: string; subjectEmail?: string;
      requestType: 'access' | 'delete' | 'rectify' | 'restrict';
    }): Promise<{ dsrId: number; deadline: Date }> {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30);
      const dsr = await prisma.pdplDataSubjectRequest.create({
        data: {
          tenantId,
          requestType: input.requestType.toUpperCase(),
          subjectType: 'CUSTOMER',
          subjectId: 0,
          subjectIdentifier: input.subjectName,
          status: 'RECEIVED',
          dueDate: deadline,
        },
      });
      await auditAction(prisma, tenantId, 'PDPL', 'createDSR', { dsrId: dsr.id, requestType: input.requestType, deadline });
      return { dsrId: dsr.id, deadline };
    },

    /** PDPL Art 20 — Breach must be reported to SDAIA within 72 hours */
    async reportBreach(details: {
      description: string; affectedCount: number; dataTypes: string[]; discoveredAt: Date;
    }): Promise<{ reportId: number; reportDeadline: Date }> {
      const reportDeadline = new Date(details.discoveredAt);
      reportDeadline.setHours(reportDeadline.getHours() + 72);
      const report = await prisma.pdplBreachIncident.create({
        data: {
          tenantId,
          detectedAt: details.discoveredAt,
          category: 'OTHER',
          severity: 'HIGH',
          affectedRecords: details.affectedCount,
          affectedDataCategories: details.dataTypes,
          rootCause: details.description,
          status: 'DETECTED',
          notificationToSdaia: false,
          notificationToSubjects: false,
        },
      });
      await auditAction(prisma, tenantId, 'PDPL', 'reportBreach', { reportId: report.id, affectedCount: details.affectedCount });
      return { reportId: report.id, reportDeadline };
    },
  };
}

// ─── ZATCA ────────────────────────────────────────────────────────────────────

function buildZatcaModule(prisma: PrismaClient, tenantId: string) {
  return {
    async getComplianceStatus(): Promise<{
      hasValidCertificate: boolean; pendingInvoices: number; lastClearanceAt: Date | null;
    }> {
      const cert = await prisma.setting.findFirst({ where: { tenantId, key: 'zatca_certificate' }, select: { value: true } });
      const pending = await prisma.salesInvoice.count({
        where: { tenantId, status: 'posted', zatcaStatus: { in: ['pending'] } },
      }).catch(() => 0);
      return { hasValidCertificate: !!cert?.value, pendingInvoices: pending, lastClearanceAt: null };
    },

    async markSubmitted(invoiceId: number, icvNumber: string, qrContent?: string): Promise<void> {
      await prisma.salesInvoice.update({
        where: { id: invoiceId },
        data: { zatcaStatus: 'SUBMITTED', ...(qrContent ? { qrCode: qrContent } : {}) },
      });
      await auditAction(prisma, tenantId, 'ZATCA', 'markSubmitted', { invoiceId, icvNumber });
    },
  };
}

// ─── WPS ────────────────────────────────────────────────────────────────────

function buildWpsModule(prisma: PrismaClient, tenantId: string) {
  return {
    /** Generate WPS SIF v3 CSV for MUDAD submission */
    async generateSIF(year: number, month: number): Promise<{
      records: number; totalAmount: number; sifContent: string;
    }> {
      const salaries = await prisma.salary.findMany({
        where: { tenantId, year, month, deletedAt: null },
        include: { employee: { select: { name: true, iban: true, bankName: true, employeeNo: true } } },
      });
      if (!salaries.length) throw new Error(`No salary records for ${year}/${month}`);
      const totalAmount = salaries.reduce((s, r) => s + Number(r.netSalary), 0);
      const rows = salaries.map((s, i) =>
        [String(i + 1).padStart(5, '0'), s.employee.employeeNo ?? s.employeeId,
          s.employee.name, s.employee.iban ?? '', s.employee.bankName ?? '',
          Number(s.netSalary).toFixed(2), `${year}-${String(month).padStart(2, '0')}-25`, 'SAR', 'SALARY'].join(',')
      );
      const sifContent = ['RecordSeq,EmployeeID,Name,IBAN,Bank,NetPay,PayDate,Currency,Type', ...rows].join('\n');
      await auditAction(prisma, tenantId, 'WPS', 'generateSIF', { year, month, records: salaries.length, totalAmount });
      return { records: salaries.length, totalAmount, sifContent };
    },
  };
}

// ─── Main Facade ─────────────────────────────────────────────────────────────

export function saudiCompliance(prisma: PrismaClient, tenantId: string) {
  return {
    gosi:    buildGosiModule(prisma, tenantId),
    nitaqat: buildNitaqatModule(prisma, tenantId),
    pdpl:    buildPdplModule(prisma, tenantId),
    zatca:   buildZatcaModule(prisma, tenantId),
    wps:     buildWpsModule(prisma, tenantId),
  };
}

export type SaudiComplianceFacade = ReturnType<typeof saudiCompliance>;
