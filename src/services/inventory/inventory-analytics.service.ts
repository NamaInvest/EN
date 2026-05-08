export class InventoryAnalyticsService {
  async runAbcAnalysis(tenantId: string) {
    // Stub: 80/15/5 ABC classification
    return { A: [], B: [], C: [] };
  }

  async getSlowMovingStock(tenantId: string, days: number = 90) {
    // Stub: No movement in 90+ days
    return { slowItems: [] };
  }

  async getTurnoverRatio(tenantId: string) {
    // Stub: Stock turnover ratio calculation
    return { ratio: 0 };
  }
}
