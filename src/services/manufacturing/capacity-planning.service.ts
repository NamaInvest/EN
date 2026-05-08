export class CapacityPlanningService {
  async getWorkCenterLoad(workCenterId: string, periodStart: Date, periodEnd: Date) {
    // Stub: Available capacity vs Loading
    return { available: 0, required: 0, loadPercentage: 0 };
  }

  async identifyBottlenecks(tenantId: string) {
    // Stub: Bottleneck identification
    return { bottlenecks: [] };
  }
}
