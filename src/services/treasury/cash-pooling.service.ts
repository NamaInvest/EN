export class CashPoolingService {
  async calculatePosition(tenantId: string) {
    // Stub: Multi-account positions
    return { totalPosition: 0 };
  }

  async executeSweepRules() {
    // Stub: Auto-transfer to main account
    return { transfersExecuted: 0 };
  }
}
