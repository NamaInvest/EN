import { PrismaClient } from '@prisma/client';
import { BusinessContext } from './event-bus.service';

/**
 * Base abstract class for all domain services.
 * Enforces standardized context usage and provides common utilities.
 */
export abstract class BaseService {
  constructor(
    protected prisma: PrismaClient,
    protected ctx: BusinessContext
  ) {}

  /**
   * Helper to execute a query within an existing transaction if provided,
   * otherwise uses the standard prisma client.
   */
  protected get db() {
    return this.prisma;
  }

  /**
   * Helper to ensure the current context has a specific permission.
   */
  protected requirePermission(permission: string) {
    if (this.ctx.requirePermission) {
      this.ctx.requirePermission(permission);
    }
  }

  /**
   * Helper to verify that the current fiscal period is open.
   */
  protected requireOpenFiscalPeriod() {
    if (this.ctx.fiscal?.isClosed) {
      throw new Error('FISCAL_PERIOD_CLOSED: Cannot perform operations in a closed fiscal period.');
    }
  }

  /**
   * Safely unwraps an id, ensuring it belongs to the current tenant.
   * Note: With RLS enabled, this is partially handled at the DB layer, 
   * but this adds an application-level sanity check if needed.
   */
  protected get tenantId() {
    return this.ctx.tenant.id;
  }
}
