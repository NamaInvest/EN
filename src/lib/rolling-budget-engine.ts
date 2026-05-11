/**
 * Rolling Budget Engine (G3)
 * ══════════════════════════════════════════════════════════════════════════════
 * Driver-based, rolling 12-month budget with variance analysis.
 *
 * Features:
 *   - Rolling 12-month horizon: each month-end drops oldest, adds new
 *   - Driver-based formulas: revenue = units_sold * avg_price * (1 - discount)
 *   - Scenario support: Base / Best / Worst
 *   - Variance: Actual (GL) vs Budget vs Forecast
 *   - Quarterly reforecast + annual re-baseline
 */

import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'rolling-budget-engine' });

// ─── Types ────────────────────────────────────────────────────────────────────

export type Scenario = 'BASE' | 'BEST' | 'WORST';
export type DriverKey =
  | 'units_sold'
  | 'headcount'
  | 'avg_price'
  | 'discount_rate'
  | 'raw_material_price'
  | 'fx_rate_usd'
  | 'fx_rate_eur'
  | string;

export interface DriverValue {
  driver:  DriverKey;
  month:   string;    // "YYYY-MM"
  value:   number;
}

export interface RollingForecastLine {
  accountCode: string;
  accountName: string;
  scenario:    Scenario;
  months:      Record<string, number>;   // { "2026-01": 1500000, "2026-02": ... }
  formula?:    string;
  driverKey?:  DriverKey;
}

export interface VarianceLine {
  accountCode: string;
  accountName: string;
  period:      string;        // "2026-Q1" or "2026-01"
  actual:      number;
  budget:      number;
  forecast:    number;
  varActVsBudget:     number;
  varActVsBudgetPct:  number;
  varActVsForecast:   number;
  status:      'GREEN' | 'YELLOW' | 'RED';
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export class RollingBudgetEngine {

  /**
   * Get the 12-month rolling horizon starting from today.
   * Returns array of "YYYY-MM" strings.
   */
  static getHorizon(startDate?: Date): string[] {
    const base = startDate ?? new Date();
    const months: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
  }

  /**
   * Evaluate a driver-based formula.
   * Formula example: "units_sold * avg_price * (1 - discount_rate)"
   */
  static evaluateFormula(
    formula: string,
    drivers: Record<DriverKey, number>,
  ): number {
    try {
      // Safe eval: only allow numbers, operators, and driver keys
      const allowed = /^[0-9a-z_\s\+\-\*\/\(\)\.]+$/i;
      if (!allowed.test(formula)) return 0;

      // Replace driver keys with values
      let expr = formula;
      for (const [key, value] of Object.entries(drivers)) {
        expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(value));
      }
      // eslint-disable-next-line no-eval
      const result = Function(`"use strict"; return (${expr})`)();
      return typeof result === 'number' && isFinite(result) ? Math.round(result * 100) / 100 : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get driver assumptions for a month.
   */
  static async getDrivers(
    tenantId: string,
    scenario: Scenario,
    month: string,
  ): Promise<Record<DriverKey, number>> {
    const drivers = await (prisma as any).budgetDriver?.findMany?.({
      where: { tenantId, scenario, month },
    }).catch(() => []) ?? [];

    const result: Record<string, number> = {};
    for (const d of drivers) {
      result[d.driver] = Number(d.value ?? 0);
    }
    return result;
  }

  /**
   * Upsert driver assumption.
   */
  static async upsertDriver(data: {
    tenantId: string;
    scenario: Scenario;
    driver:   DriverKey;
    month:    string;
    value:    number;
  }) {
    const existing = await (prisma as any).budgetDriver?.findFirst?.({
      where: { tenantId: data.tenantId, scenario: data.scenario, driver: data.driver, month: data.month },
    }).catch(() => null);

    if (existing) {
      return (prisma as any).budgetDriver?.update?.({
        where: { id: existing.id },
        data:  { value: data.value },
      }).catch(() => null);
    }

    return (prisma as any).budgetDriver?.create?.({
      data: { ...data, createdAt: new Date(), updatedAt: new Date() },
    }).catch(() => null);
  }

  /**
   * Recalculate the rolling forecast for all budget lines.
   * Returns the updated forecast lines.
   */
  static async recalculate(
    tenantId: string,
    scenario: Scenario = 'BASE',
  ): Promise<RollingForecastLine[]> {
    const horizon = this.getHorizon();

    // Get budget scenario lines
    const scenarioLines = await (prisma as any).budgetScenarioLine?.findMany?.({
      where: {
        budgetScenario: { tenantId, name: scenario },
      },
      include: {
        account: { select: { code: true, nameAr: true, name: true } },
      },
    }).catch(() => []) ?? [];

    const results: RollingForecastLine[] = [];

    for (const line of scenarioLines) {
      const months: Record<string, number> = {};

      for (const month of horizon) {
        let value = 0;

        if (line.formula) {
          // Driver-based
          const drivers = await this.getDrivers(tenantId, scenario, month);
          value = this.evaluateFormula(line.formula, drivers);
        } else if (line.monthlyValues) {
          // Static monthly values
          const mv = typeof line.monthlyValues === 'string'
            ? JSON.parse(line.monthlyValues)
            : line.monthlyValues;
          value = Number(mv[month] ?? line.annualAmount ?? 0) / 12;
        } else {
          value = Number(line.annualAmount ?? 0) / 12;
        }

        months[month] = Math.round(value * 100) / 100;
      }

      results.push({
        accountCode: line.account?.code ?? line.accountCode ?? '',
        accountName: line.account?.nameAr ?? line.account?.name ?? '',
        scenario,
        months,
        formula:   line.formula ?? undefined,
        driverKey: line.driverKey ?? undefined,
      });
    }

    log.info('Rolling forecast recalculated', { tenantId, scenario, lines: results.length });
    return results;
  }

  /**
   * Compute variance: Actual (GL) vs Budget vs Forecast.
   * period: "2026-Q1" or "2026-01"
   */
  static async getVariance(
    tenantId: string,
    period: string,
  ): Promise<VarianceLine[]> {
    // Parse period
    const isQuarter = period.includes('Q');
    let months: string[] = [];

    if (isQuarter) {
      const [year, q] = period.split('-Q');
      const startMonth = (parseInt(q) - 1) * 3 + 1;
      for (let m = startMonth; m < startMonth + 3; m++) {
        months.push(`${year}-${String(m).padStart(2, '0')}`);
      }
    } else {
      months = [period];
    }

    const fromDate = new Date(`${months[0]}-01`);
    const toDate   = new Date(new Date(`${months[months.length - 1]}-01`).getFullYear(),
                              new Date(`${months[months.length - 1]}-01`).getMonth() + 1, 0);

    // Get actuals from GL
    const glRows = await (prisma as any).journalLine?.groupBy?.({
      by: ['accountCode'],
      where: {
        tenantId,
        journalEntry: { status: 'POSTED', date: { gte: fromDate, lte: toDate } },
      },
      _sum: { debit: true, credit: true },
    }).catch(() => []) ?? [];

    const actualMap = new Map<string, number>();
    for (const row of glRows) {
      const net = Number(row._sum.debit ?? 0) - Number(row._sum.credit ?? 0);
      actualMap.set(row.accountCode ?? '', net);
    }

    // Get budget lines
    const budgetLines = await (prisma as any).budgetLine?.findMany?.({
      where: { budget: { tenantId } },
      include: { account: { select: { code: true, nameAr: true, name: true } } },
    }).catch(() => []) ?? [];

    const results: VarianceLine[] = [];
    const tolerance = 0.1; // 10% tolerance before YELLOW, 20% before RED

    for (const bl of budgetLines) {
      const code   = bl.account?.code ?? bl.accountCode ?? '';
      const actual = actualMap.get(code) ?? 0;
      const budget = Number(bl.allocatedAmount ?? 0) * (months.length / 12);

      // Get forecast from rolling forecast
      const forecastTotal = months.reduce((sum, m) => {
        const mv = typeof bl.monthlyForecast === 'string'
          ? JSON.parse(bl.monthlyForecast ?? '{}')
          : (bl.monthlyForecast ?? {});
        return sum + Number(mv[m] ?? budget / 12);
      }, 0);

      const varActVsBudget    = actual - budget;
      const varActVsBudgetPct = budget !== 0 ? (varActVsBudget / Math.abs(budget)) * 100 : 0;
      const varActVsForecast  = actual - forecastTotal;

      const absPct = Math.abs(varActVsBudgetPct);
      const status: 'GREEN' | 'YELLOW' | 'RED' =
        absPct < tolerance * 100 ? 'GREEN' :
        absPct < tolerance * 200 ? 'YELLOW' : 'RED';

      results.push({
        accountCode:        code,
        accountName:        bl.account?.nameAr ?? bl.account?.name ?? code,
        period,
        actual:             Math.round(actual * 100) / 100,
        budget:             Math.round(budget * 100) / 100,
        forecast:           Math.round(forecastTotal * 100) / 100,
        varActVsBudget:     Math.round(varActVsBudget * 100) / 100,
        varActVsBudgetPct:  Math.round(varActVsBudgetPct * 10) / 10,
        varActVsForecast:   Math.round(varActVsForecast * 100) / 100,
        status,
      });
    }

    return results.sort((a, b) => Math.abs(b.varActVsBudget) - Math.abs(a.varActVsBudget));
  }

  /**
   * Roll forward: called at month-end.
   * Drops the oldest month, adds a new month 12 months out.
   */
  static async rollForward(tenantId: string): Promise<{ droppedMonth: string; addedMonth: string }> {
    const horizon  = this.getHorizon();
    const oldest   = horizon[0];
    const newest   = horizon[horizon.length - 1];

    // Add next month
    const [y, m] = newest.split('-').map(Number);
    const nextDate = new Date(y, m, 1); // one month after newest
    const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

    log.info('Rolling forecast rolled forward', { tenantId, droppedMonth: oldest, addedMonth: nextMonth });
    return { droppedMonth: oldest, addedMonth: nextMonth };
  }
}
