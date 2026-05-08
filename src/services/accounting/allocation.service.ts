import { Decimal } from '@prisma/client/runtime/library';

export interface AllocationRule {
  id: string;
  sourceAccount: string;
  destinations: { account: string; costCenter: string; percentage: Decimal }[];
}

export class AllocationService {
  async runAllocation(rule: AllocationRule, periodId: string, tenantId: string, dryRun = true) {
    // Stub: Allocate expenses to cost centers based on rule
    return { success: true, dryRun, allocatedAmount: new Decimal(0) };
  }
}
