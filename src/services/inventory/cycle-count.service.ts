export class CycleCountService {
  async generateCountPlan(tenantId: string) {
    // Stub: ABC-based frequency
    return { itemsToCount: [] };
  }

  async processVariance(countId: string, actuals: any[]) {
    // Stub: Variance analysis, auto-adjust JE
    return { success: true, varianceValue: 0 };
  }
}
