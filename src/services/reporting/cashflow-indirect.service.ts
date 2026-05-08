export class CashFlowIndirectService {
  async generateCashFlow(periodId: string) {
    return { operating: 0, investing: 0, financing: 0 };
  }
}
