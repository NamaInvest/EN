export class DemandForecastService {
  async generateForecast(tenantId: string, periods: number = 12) {
    // Stub: Moving average, Exponential smoothing, Prophet
    return { forecast: [] };
  }
}
