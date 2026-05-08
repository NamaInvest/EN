export class BomService {
  async getExplodedBom(itemId: string, qty: number) {
    // Stub: Multi-level BOM with phantom assemblies
    return { components: [] };
  }

  async calculateStandardCost(itemId: string) {
    // Stub: Cost roll-up from components + operations
    return { standardCost: 0 };
  }
}
