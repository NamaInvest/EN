import { PrismaClient, FinancialPeriodStatus } from '@prisma/client';
import { BusinessContext } from '../shared/event-bus.service';

/**
 * Service to validate and manage Financial Periods securely.
 * Enforces strict Tenant Isolation for all operations.
 */
export class FinancialPeriodService {
  constructor(
    private readonly prisma: PrismaClient | any,
    private readonly ctx: BusinessContext
  ) {}

  private get tenantId() {
    if (!this.ctx.tenant?.id) {
      throw new Error('TENANT_ISOLATION_VIOLATION: Missing tenant context in FinancialPeriodService');
    }
    return this.ctx.tenant.id;
  }

  /**
   * Helper to format a Date into 'YYYY-MM' period string
   */
  private formatPeriod(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Validates if a specific date falls into an OPEN financial period.
   * Throws an error if the period is locked or if cross-tenant leakage is attempted.
   */
  async requireOpenPeriod(date: Date, requireStrictPresence: boolean = false): Promise<void> {
    const periodString = this.formatPeriod(date);

    const period = await this.prisma.financialPeriod.findUnique({
      where: {
        tenantId_period: {
          tenantId: this.tenantId,
          period: periodString
        }
      }
    });

    if (!period) {
      if (requireStrictPresence) {
        throw new Error(`FISCAL_PERIOD_ERROR: Financial period ${periodString} is not defined for this tenant.`);
      }
      // If strict presence isn't required, we treat missing periods as OPEN implicitly.
      return;
    }

    if (period.status !== FinancialPeriodStatus.OPEN) {
      throw new Error(`FISCAL_PERIOD_CLOSED: Cannot perform operations. Period ${periodString} is ${period.status}.`);
    }
  }

  /**
   * Direct tenant-scoped query block to prevent bypass
   */
  async getPeriodStatus(periodString: string): Promise<FinancialPeriodStatus> {
    const period = await this.prisma.financialPeriod.findUnique({
      where: {
        tenantId_period: {
          tenantId: this.tenantId,
          period: periodString
        }
      }
    });

    return period?.status ?? FinancialPeriodStatus.OPEN;
  }
}
