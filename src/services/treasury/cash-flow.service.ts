export class CashFlowService {
  async generateForecast(tenantId: string, weeks: number = 13) {
    // Stub: 13-week rolling forecast
    // AR collections forecast, AP payments forecast
    // Payroll, taxes, fixed expenses
    // Scenario analysis
    return { forecast: [], accuracy: 0.85 };
  }
}
