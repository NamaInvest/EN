export class LotSerialService {
  async trackSerialLifecycle(serialNumber: string) {
    // Stub: Lifecycle receive -> store -> sell -> return
    return { history: [] };
  }

  async getExpiryAlerts(tenantId: string, daysAhead: number = 30) {
    // Stub: Expiry alerts
    return { alerts: [] };
  }
}
