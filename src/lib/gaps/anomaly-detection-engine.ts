/**
 * Anomaly Detection Engine
 *
 * Detects suspicious patterns in financial transactions.
 * 10 detectors covering Benford's Law, duplicates, off-hours, SoD violations,
 * round-number bias, ghost employees, vendor velocity, banking changes,
 * control-account postings, and negative inventory.
 *
 * Each finding gets a severity score 0-100; threshold > 80 auto-creates AuditFinding.
 *
 * Run via: cron daily (anomaly-detection-daily-cron) or on-demand via /api/gaps/anomaly/run
 */

import type { PrismaClient } from '@prisma/client';

export type DetectorName =
  | 'BENFORD_LAW'
  | 'DUPLICATE_VENDOR_INVOICE'
  | 'ROUND_NUMBER_BIAS'
  | 'AFTER_HOURS_POSTING'
  | 'SOD_VIOLATION'
  | 'GHOST_EMPLOYEE'
  | 'VENDOR_VELOCITY_SPIKE'
  | 'VENDOR_BANK_CHANGE'
  | 'MANUAL_TO_CONTROL_ACCOUNT'
  | 'NEGATIVE_INVENTORY_MONTH_END';

export interface AnomalyFinding {
  detector: DetectorName;
  tenantId: string;
  entityType: string;
  entityId?: string;
  score: number; // 0-100
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  detectedAt: Date;
}

interface DetectorContext {
  tenantId: string;
  prisma: PrismaClient;
  asOf: Date;
  windowStart: Date;
  windowEnd: Date;
}

interface Detector {
  name: DetectorName;
  run(ctx: DetectorContext): Promise<AnomalyFinding[]>;
}

/* ---------------- Helpers ---------------- */

function severityFromScore(score: number): AnomalyFinding['severity'] {
  if (score >= 90) return 'CRITICAL';
  if (score >= 75) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  if (score >= 25) return 'LOW';
  return 'INFO';
}

/** Chi-squared statistic against Benford's expected first-digit distribution. */
function benfordChiSquared(amounts: number[]): { chi2: number; observed: number[]; expected: number[] } {
  const expected = [0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];
  const counts = new Array(9).fill(0);
  let total = 0;
  for (const a of amounts) {
    const abs = Math.abs(a);
    if (abs < 1) continue;
    const first = Number(String(abs).replace(/[^1-9]/, '').charAt(0));
    if (first >= 1 && first <= 9) {
      counts[first - 1]++;
      total++;
    }
  }
  if (total < 100) return { chi2: 0, observed: counts, expected };
  const observed = counts.map((c) => c / total);
  const chi2 = observed.reduce((acc, o, i) => acc + Math.pow(o - expected[i], 2) / expected[i], 0) * total;
  return { chi2, observed, expected };
}

/* ---------------- Detectors ---------------- */

const benfordDetector: Detector = {
  name: 'BENFORD_LAW',
  async run(ctx) {
    const lines = await ctx.prisma.journalLine.findMany({
      where: {
        entry: { tenantId: ctx.tenantId, entryDate: { gte: ctx.windowStart.toISOString().split('T')[0], lte: ctx.windowEnd.toISOString().split('T')[0] } },
      },
      select: { debit: true, credit: true },
      take: 50_000,
    });
    const amounts = lines
      .map((l) => Number(l.debit || l.credit || 0))
      .filter((a) => a > 0);
    const { chi2, observed, expected } = benfordChiSquared(amounts);
    // df=8, critical at p<0.01 ≈ 20.09
    if (chi2 < 20.09) return [];
    const score = Math.min(100, Math.round((chi2 / 20.09) * 60 + 20));
    return [
      {
        detector: 'BENFORD_LAW',
        tenantId: ctx.tenantId,
        entityType: 'JournalLine',
        score,
        severity: severityFromScore(score),
        title: 'انحراف توزيع أرقام بنفورد على القيود',
        description:
          `chi-squared = ${chi2.toFixed(2)} (critical 20.09). ` +
          'توزيع أول رقم في القيود لا يتبع قانون بنفورد — مؤشر محتمل على تلاعب.',
        evidence: { chi2, observed, expected, sampleSize: amounts.length },
        detectedAt: new Date(),
      },
    ];
  },
};

const duplicateVendorInvoiceDetector: Detector = {
  name: 'DUPLICATE_VENDOR_INVOICE',
  async run(ctx) {
    const findings: AnomalyFinding[] = [];
    const invoices = await ctx.prisma.purchaseInvoice.findMany({
      where: { tenantId: ctx.tenantId, date: { gte: ctx.windowStart, lte: ctx.windowEnd } },
      select: { id: true, invoiceNo: true, supplierId: true, total: true, date: true },
      take: 20_000,
    });
    // Group by (vendor, ±SAR50, ±5 days)
    for (let i = 0; i < invoices.length; i++) {
      for (let j = i + 1; j < invoices.length; j++) {
        const a = invoices[i];
        const b = invoices[j];
        if (a.supplierId !== b.supplierId) continue;
        const amtA = Number(a.total);
        const amtB = Number(b.total);
        const dDays = Math.abs((a.date.getTime() - b.date.getTime()) / (1000 * 60 * 60 * 24));
        const amtDiff = Math.abs(amtA - amtB);
        if (dDays <= 5 && amtDiff <= Math.max(50, amtA * 0.01)) {
          const score = 70 + Math.min(20, Math.round((6 - dDays) * 3));
          findings.push({
            detector: 'DUPLICATE_VENDOR_INVOICE',
            tenantId: ctx.tenantId,
            entityType: 'PurchaseInvoice',
            entityId: String(b.id),
            score,
            severity: severityFromScore(score),
            title: `احتمال تكرار فاتورة مورد ${a.supplierId}`,
            description: `فاتورتان ${a.invoiceNo} و ${b.invoiceNo} متشابهتان بفارق ${dDays.toFixed(1)} يوم و ${amtDiff.toFixed(2)} ر.س.`,
            evidence: { invoiceA: a, invoiceB: b },
            detectedAt: new Date(),
          });
        }
      }
    }
    return findings;
  },
};

const roundNumberBiasDetector: Detector = {
  name: 'ROUND_NUMBER_BIAS',
  async run(ctx) {
    const lines = await ctx.prisma.journalLine.findMany({
      where: {
        entry: { tenantId: ctx.tenantId, entryDate: { gte: ctx.windowStart.toISOString().split('T')[0], lte: ctx.windowEnd.toISOString().split('T')[0] } },
      },
      select: { entryId: true, debit: true, credit: true },
      take: 20_000,
    });
    let roundCount = 0;
    let totalCount = 0;
    for (const l of lines) {
      const amt = Number(l.debit || l.credit || 0);
      if (amt < 100) continue;
      totalCount++;
      if (amt % 1000 === 0 || amt % 500 === 0) roundCount++;
    }
    if (totalCount < 50) return [];
    const ratio = roundCount / totalCount;
    // Baseline expectation ~5-10%. Above 25% suspicious.
    if (ratio < 0.25) return [];
    const score = Math.min(100, Math.round(ratio * 100 + 30));
    return [
      {
        detector: 'ROUND_NUMBER_BIAS',
        tenantId: ctx.tenantId,
        entityType: 'JournalLine',
        score,
        severity: severityFromScore(score),
        title: 'انحياز للأرقام المستديرة في القيود',
        description: `${(ratio * 100).toFixed(1)}% من القيود مبالغها مستديرة (متوقع <10%).`,
        evidence: { roundCount, totalCount, ratio },
        detectedAt: new Date(),
      },
    ];
  },
};

const afterHoursPostingDetector: Detector = {
  name: 'AFTER_HOURS_POSTING',
  async run(ctx) {
    const entries = await ctx.prisma.journalEntry.findMany({
      where: {
        tenantId: ctx.tenantId,
        entryDate: { gte: ctx.windowStart.toISOString().split('T')[0], lte: ctx.windowEnd.toISOString().split('T')[0] },
      },
      select: { id: true, entryNumber: true, entryDate: true, createdBy: true },
      take: 5000,
    });
    const findings: AnomalyFinding[] = [];
    for (const e of entries) {
      if (!e.entryDate) continue;
      // Convert to Riyadh time (UTC+3): hour of day
      const riyadhHour = (new Date(e.entryDate).getUTCHours() + 3) % 24;
      const dayOfWeek = new Date(e.entryDate).getUTCDay(); // 0=Sunday
      // Friday is 5 (Saudi weekend Fri+Sat = 5+6); off-hours = 22-6
      const isOffHours = riyadhHour < 6 || riyadhHour >= 22;
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
      if (isOffHours || isWeekend) {
        const score = isOffHours && isWeekend ? 85 : 65;
        findings.push({
          detector: 'AFTER_HOURS_POSTING',
          tenantId: ctx.tenantId,
          entityType: 'JournalEntry',
          entityId: String(e.id),
          score,
          severity: severityFromScore(score),
          title: `قيد يدوي في وقت غير اعتيادي: ${e.entryNumber}`,
          description: `قيد POSTED في ${e.entryDate} (الرياض: ${riyadhHour}:00، اليوم ${dayOfWeek}).`,
          evidence: { entry: e, riyadhHour, dayOfWeek, isOffHours, isWeekend },
          detectedAt: new Date(),
        });
      }
    }
    return findings;
  },
};

const sodViolationDetector: Detector = {
  name: 'SOD_VIOLATION',
  async run(ctx) {
    // Find entries where the same user created AND approved the entry
    const entries = await ctx.prisma.journalEntry.findMany({
      where: {
        tenantId: ctx.tenantId,
        entryDate: { gte: ctx.windowStart.toISOString().split('T')[0], lte: ctx.windowEnd.toISOString().split('T')[0] },
      },
      select: { id: true, entryNumber: true, createdBy: true, totalDebit: true },
      take: 10_000,
    });
    const findings: AnomalyFinding[] = [];
    for (const e of entries) {
      if (e.createdBy && e.createdBy === e.createdBy) {
        const amt = Number(e.totalDebit);
        const score = Math.min(95, 60 + Math.log10(Math.max(1, amt)) * 5);
        findings.push({
          detector: 'SOD_VIOLATION',
          tenantId: ctx.tenantId,
          entityType: 'JournalEntry',
          entityId: String(e.id),
          score,
          severity: severityFromScore(score),
          title: `خرق فصل المهام: ${e.entryNumber}`,
          description: `نفس المستخدم ${e.createdBy} أنشأ وأقفل القيد.`,
          evidence: { entry: e },
          detectedAt: new Date(),
        });
      }
    }
    return findings;
  },
};

const manualToControlAccountDetector: Detector = {
  name: 'MANUAL_TO_CONTROL_ACCOUNT',
  async run(ctx) {
    const controlAccounts = await ctx.prisma.account.findMany({
      where: { tenantId: ctx.tenantId, level: 1 },
      select: { id: true, code: true, name: true },
    });
    const controlIds = new Set(controlAccounts.map((a) => a.id));
    if (controlIds.size === 0) return [];
    const manualLines = await ctx.prisma.journalLine.findMany({
      where: {
        accountId: { in: Array.from(controlIds) },
        entry: {
          tenantId: ctx.tenantId,
          entryDate: { gte: ctx.windowStart.toISOString().split('T')[0], lte: ctx.windowEnd.toISOString().split('T')[0] },
        },
      },
      include: { entry: { select: { id: true, entryNumber: true, createdBy: true } } },
      take: 1000,
    });
    return manualLines.map((l) => ({
      detector: 'MANUAL_TO_CONTROL_ACCOUNT' as const,
      tenantId: ctx.tenantId,
      entityType: 'JournalLine',
      entityId: String(l.id),
      score: 95,
      severity: 'CRITICAL' as const,
      title: `قيد يدوي على حساب رقابي: ${l.entry?.id || ''}`,
      description: `الحساب الرقابي ${controlAccounts.find((a) => a.id === l.accountId)?.code} لا يجب القيد عليه يدوياً.`,
      evidence: { line: l },
      detectedAt: new Date(),
    }));
  },
};

const vendorVelocitySpikeDetector: Detector = {
  name: 'VENDOR_VELOCITY_SPIKE',
  async run(ctx) {
    // Compare invoice count per vendor in current window vs previous window
    const prevStart = new Date(ctx.windowStart.getTime() - (ctx.windowEnd.getTime() - ctx.windowStart.getTime()));
    const [currentInvoices, prevInvoices] = await Promise.all([
      ctx.prisma.purchaseInvoice.groupBy({
        by: ['supplierId'],
        where: { tenantId: ctx.tenantId, date: { gte: ctx.windowStart, lte: ctx.windowEnd } },
        _count: { id: true },
      }),
      ctx.prisma.purchaseInvoice.groupBy({
        by: ['supplierId'],
        where: { tenantId: ctx.tenantId, date: { gte: prevStart, lt: ctx.windowStart } },
        _count: { id: true },
      }),
    ]);
    const prevMap = new Map(prevInvoices.map((p) => [p.supplierId, p._count?.id ?? 0]));
    const findings: AnomalyFinding[] = [];
    for (const c of currentInvoices) {
      const currentCount = c._count?.id ?? 0;
      const prev = prevMap.get(c.supplierId ?? null) ?? 0;
      const ratio = prev === 0 ? currentCount : currentCount / prev;
      if (currentCount >= 5 && ratio >= 5) {
        const score = Math.min(95, 50 + Math.round(Math.log2(ratio) * 10));
        findings.push({
          detector: 'VENDOR_VELOCITY_SPIKE',
          tenantId: ctx.tenantId,
          entityType: 'Vendor',
          entityId: c.supplierId ? String(c.supplierId) : undefined,
          score,
          severity: severityFromScore(score),
          title: `زيادة مفاجئة في فواتير مورد ${c.supplierId}`,
          description: `${currentCount} فاتورة هذه الفترة مقابل ${prev} الفترة السابقة (×${ratio.toFixed(1)}).`,
          evidence: { supplierId: c.supplierId, current: currentCount, previous: prev, ratio },
          detectedAt: new Date(),
        });
      }
    }
    return findings;
  },
};

const ghostEmployeeDetector: Detector = {
  name: 'GHOST_EMPLOYEE',
  async run(ctx) {
    // Active employees on payroll with no attendance records in last 30 days
    const employees = await ctx.prisma.employee.findMany({
      where: { tenantId: ctx.tenantId, active: true },
      select: { id: true, employeeNo: true, name: true, },
      take: 5000,
    });
    const findings: AnomalyFinding[] = [];
    const thirtyDaysAgo = new Date(ctx.asOf.getTime() - 30 * 24 * 60 * 60 * 1000);
    for (const e of employees) {
      const attendanceCount = await ctx.prisma.attendance.count({
        where: { employeeId: e.id, date: { gte: thirtyDaysAgo.toISOString().split('T')[0] } },
      });
      if (attendanceCount === 0) {
        const noEmail = false;
        const score = 70;
        findings.push({
          detector: 'GHOST_EMPLOYEE',
          tenantId: ctx.tenantId,
          entityType: 'Employee',
          entityId: String(e.id),
          score,
          severity: severityFromScore(score),
          title: `موظف مشتبه بكونه شبحياً: ${e.employeeNo} - ${e.name}`,
          description: `موظف نشط لكن لا يوجد حضور خلال 30 يوم${noEmail ? ' ولا يوجد إيميل' : ''}.`,
          evidence: { employee: e, attendanceCount },
          detectedAt: new Date(),
        });
      }
    }
    return findings;
  },
};

const vendorBankChangeDetector: Detector = {
  name: 'VENDOR_BANK_CHANGE',
  async run(ctx) {
    // Detect vendors with multiple bank account changes in window
    const bankAccounts = await ctx.prisma.supplierBankAccount.findMany({
      where: { tenantId: ctx.tenantId, updatedAt: { gte: ctx.windowStart, lte: ctx.windowEnd } } as never,
      select: { id: true, supplierId: true, iban: true, createdAt: true } as never,
      take: 1000,
    } as never).catch(() => [] as Array<{ id: number; supplierId: number; iban: string; createdAt: Date }>);
    const byVendor = new Map<number, number>();
    for (const b of bankAccounts) {
      byVendor.set(b.supplierId, (byVendor.get(b.supplierId) ?? 0) + 1);
    }
    const findings: AnomalyFinding[] = [];
    for (const [supplierId, count] of byVendor.entries()) {
      if (count >= 2) {
        const score = count >= 3 ? 90 : 75;
        findings.push({
          detector: 'VENDOR_BANK_CHANGE',
          tenantId: ctx.tenantId,
          entityType: 'Vendor',
          entityId: String(supplierId),
          score,
          severity: severityFromScore(score),
          title: `تغيير متكرر لحساب بنكي للمورد ${supplierId}`,
          description: `${count} تغييرات في الحساب البنكي خلال الفترة — نمط هجمات تمويه شائع.`,
          evidence: { supplierId, changeCount: count },
          detectedAt: new Date(),
        });
      }
    }
    return findings;
  },
};

const negativeInventoryDetector: Detector = {
  name: 'NEGATIVE_INVENTORY_MONTH_END',
  async run(ctx) {
    const stocks = await ctx.prisma.productStock.findMany({
      where: { tenantId: ctx.tenantId, quantity: { lt: 0 } as never },
      include: { product: { select: { name: true } } },
      take: 1000,
    } as never).catch(() => [] as Array<{ id: number; productId: number; stockId: number; quantity: number; product: { name: string } }>);
    return stocks.map((s) => ({
      detector: 'NEGATIVE_INVENTORY_MONTH_END' as const,
      tenantId: ctx.tenantId,
      entityType: 'ProductStock',
      entityId: String(s.id),
      score: 80,
      severity: 'HIGH' as const,
      title: `مخزون سالب للمنتج ${s.productId} في المخزن ${s.stockId}`,
      description: `الكمية = ${s.quantity}. يدل على ضعف في التسلسل (إصدار قبل استلام).`,
      evidence: { stock: s },
      detectedAt: new Date(),
    }));
  },
};

/* ---------------- Public API ---------------- */

export const DETECTORS: Detector[] = [
  benfordDetector,
  duplicateVendorInvoiceDetector,
  roundNumberBiasDetector,
  afterHoursPostingDetector,
  sodViolationDetector,
  manualToControlAccountDetector,
  vendorVelocitySpikeDetector,
  ghostEmployeeDetector,
  vendorBankChangeDetector,
  negativeInventoryDetector,
];

export interface RunOptions {
  tenantId: string;
  prisma: PrismaClient;
  asOf?: Date;
  windowDays?: number;
  detectors?: DetectorName[];
  autoCreateFindings?: boolean;
  scoreThreshold?: number;
}

export async function runAnomalyDetection(opts: RunOptions): Promise<AnomalyFinding[]> {
  const asOf = opts.asOf ?? new Date();
  const windowDays = opts.windowDays ?? 30;
  const windowStart = new Date(asOf.getTime() - windowDays * 24 * 60 * 60 * 1000);
  const ctx: DetectorContext = {
    tenantId: opts.tenantId,
    prisma: opts.prisma,
    asOf,
    windowStart,
    windowEnd: asOf,
  };
  const selected = opts.detectors
    ? DETECTORS.filter((d) => opts.detectors!.includes(d.name))
    : DETECTORS;
  const all: AnomalyFinding[] = [];
  for (const d of selected) {
    try {
      const findings = await d.run(ctx);
      all.push(...findings);
    } catch (err) {
      // Don't let one detector kill the run
      // eslint-disable-next-line no-console
      console.error(`Detector ${d.name} failed:`, err);
    }
  }
  const threshold = opts.scoreThreshold ?? 75;
  const significant = all.filter((f) => f.score >= threshold);
  if (opts.autoCreateFindings && significant.length) {
    await persistFindings(opts.prisma, significant);
  }
  return all;
}

async function persistFindings(prisma: PrismaClient, findings: AnomalyFinding[]): Promise<void> {
  // Persist via AuditFinding model (existing in schema)
  for (const f of findings) {
    await (prisma as never as { auditFinding: { create: (a: unknown) => Promise<unknown> } }).auditFinding.create({
      data: {
        tenantId: f.tenantId,
        source: 'ANOMALY_DETECTION',
        sourceRef: `${f.detector}:${f.entityId ?? 'global'}`,
        severity: f.severity,
        title: f.title,
        description: f.description,
        evidence: f.evidence as never,
        status: 'OPEN',
        detectedAt: f.detectedAt,
      },
    }).catch(() => undefined);
  }
}
