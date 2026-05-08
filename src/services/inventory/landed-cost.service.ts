export class LandedCostService {
  async allocateCosts(poId: string, additionalCosts: any[], method: 'QUANTITY' | 'VALUE' | 'WEIGHT') {
    // Stub: Allocate freight, insurance, customs
    return { success: true, allocatedCostPerItem: [] };
  }
}
