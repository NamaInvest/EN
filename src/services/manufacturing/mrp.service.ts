export class MrpService {
  async runMrp(tenantId: string) {
    // Stub: MRP Engine
    // Demand (Sales orders + Forecast) -> Net Requirements -> Suggested PRs + WOs
    return { suggestedPrs: [], suggestedWos: [] };
  }
}
