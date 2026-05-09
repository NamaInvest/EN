/**
 * Lease Accounting Service — IFRS 16
 * Uses actual IfrsLeaseContract and IfrsLeaseSchedule models
 */
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface LeaseScheduleRow {
  period: number;
  date: Date;
  openingLiability: number;
  interestCharge: number;
  payment: number;
  principal: number;
  closingLiability: number;
  rouDepreciation: number;
  rouClosingNbv: number;
}

export interface LeaseCalculationResult {
  contractId: number;
  rightOfUseAsset: number;
  leaseLiability: number;
  periodRate: number;
  schedule: LeaseScheduleRow[];
  journalEntries: {
    date: Date;
    description: string;
    debit: { account: string; amount: number };
    credit: { account: string; amount: number };
  }[];
}

export class IFRS16LeaseService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Calculate ROU and schedule for an IfrsLeaseContract
   */
  async calculateROU(tenantId: string, contractId: number): Promise<LeaseCalculationResult> {
    const contract = await this.prisma.ifrsLeaseContract.findFirstOrThrow({
      where: { id: contractId, tenantId },
    });

    const periodsPerYear = this.getPeriodsPerYear(contract.paymentFrequency);
    const totalPeriods = Math.ceil((contract.termMonths / 12) * periodsPerYear);
    const paymentPerPeriod = Number(contract.paymentAmount);
    const periodRate = Number(contract.ibr) / 100 / periodsPerYear;

    const leaseLiability = this.presentValueAnnuity(paymentPerPeriod, periodRate, totalPeriods);
    const rightOfUseAsset = leaseLiability
      + Number(contract.initialDirectCosts ?? 0)
      - Number(contract.leaseIncentive ?? 0);

    const schedule = this.buildSchedule(
      leaseLiability,
      rightOfUseAsset,
      paymentPerPeriod,
      periodRate,
      totalPeriods,
      contract.startDate,
    );

    // Persist calculated values
    await this.prisma.ifrsLeaseContract.update({
      where: { id: contractId },
      data: {
        pvOfPayments: new Decimal(leaseLiability),
        rouAssetValue: new Decimal(rightOfUseAsset),
        liabilityValue: new Decimal(leaseLiability),
        currentRouNbv: new Decimal(rightOfUseAsset),
        currentLiability: new Decimal(leaseLiability),
        status: 'ACTIVE',
      },
    });

    // Persist schedule
    const existingSchedule = await this.prisma.ifrsLeaseSchedule.findUnique({
      where: { contractId },
    });

    if (existingSchedule) {
      await this.prisma.ifrsLeaseSchedule.update({
        where: { contractId },
        data: {
          totalPayments: new Decimal(paymentPerPeriod * totalPeriods),
          totalInterest: new Decimal(paymentPerPeriod * totalPeriods - leaseLiability),
          pvAtGeneration: new Decimal(leaseLiability),
          versionNumber: { increment: 1 },
        },
      });
    } else {
      const sched = await this.prisma.ifrsLeaseSchedule.create({
        data: {
          tenantId,
          contractId,
          totalPayments: new Decimal(paymentPerPeriod * totalPeriods),
          totalInterest: new Decimal(paymentPerPeriod * totalPeriods - leaseLiability),
          pvAtGeneration: new Decimal(leaseLiability),
        },
      });

      await this.prisma.ifrsLeaseScheduleLine.createMany({
        data: schedule.map((row) => ({
          tenantId,
          scheduleId: sched.id,
          periodNumber: row.period,
          periodDate: row.date,
          openingLiability: new Decimal(row.openingLiability),
          interestExpense: new Decimal(row.interestCharge),
          payment: new Decimal(row.payment),
          principal: new Decimal(row.principal),
          closingLiability: new Decimal(row.closingLiability),
          rouDepreciation: new Decimal(row.rouDepreciation),
          rouOpeningNbv: new Decimal(row.rouClosingNbv + row.rouDepreciation),
          rouClosingNbv: new Decimal(row.rouClosingNbv),
        })),
      });
    }

    const journalEntries = [{
      date: contract.startDate,
      description: 'IFRS 16 — Lease Commencement',
      debit: { account: 'Right-of-Use Asset', amount: rightOfUseAsset },
      credit: { account: 'Lease Liability', amount: leaseLiability },
    }];

    return { contractId, rightOfUseAsset, leaseLiability, periodRate, schedule, journalEntries };
  }

  /**
   * Get schedule for a contract
   */
  async getSchedule(tenantId: string, contractId: number): Promise<LeaseScheduleRow[]> {
    const schedule = await this.prisma.ifrsLeaseSchedule.findUnique({
      where: { contractId },
      include: { lines: { orderBy: { periodNumber: 'asc' } } },
    });

    if (!schedule) return [];

    return schedule.lines.map((l) => ({
      period: l.periodNumber,
      date: l.periodDate,
      openingLiability: Number(l.openingLiability),
      interestCharge: Number(l.interestExpense),
      payment: Number(l.payment),
      principal: Number(l.principal),
      closingLiability: Number(l.closingLiability),
      rouDepreciation: Number(l.rouDepreciation),
      rouClosingNbv: Number(l.rouClosingNbv),
    }));
  }

  // ─── Private ────────────────────────────────────────────────────────────────
  private presentValueAnnuity(payment: number, rate: number, periods: number): number {
    if (rate === 0) return payment * periods;
    return payment * (1 - Math.pow(1 + rate, -periods)) / rate;
  }

  private getPeriodsPerYear(freq: string): number {
    return freq === 'MONTHLY' ? 12 : freq === 'QUARTERLY' ? 4 : freq === 'SEMI_ANNUAL' ? 2 : 1;
  }

  private buildSchedule(
    liability: number,
    rou: number,
    payment: number,
    rate: number,
    periods: number,
    start: Date,
  ): LeaseScheduleRow[] {
    const rouDepreciation = rou / periods;
    const rows: LeaseScheduleRow[] = [];
    let openingLiability = liability;
    let rouNbv = rou;

    for (let i = 1; i <= periods; i++) {
      const interestCharge = openingLiability * rate;
      const principal = payment - interestCharge;
      const closingLiability = Math.max(0, openingLiability - principal);
      rouNbv = Math.max(0, rouNbv - rouDepreciation);

      const date = new Date(start);
      date.setMonth(date.getMonth() + (i - 1));

      rows.push({
        period: i,
        date,
        openingLiability,
        interestCharge,
        payment,
        principal,
        closingLiability,
        rouDepreciation,
        rouClosingNbv: rouNbv,
      });

      openingLiability = closingLiability;
    }
    return rows;
  }
}
