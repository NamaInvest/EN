export class ShopFloorService {
  async clockInOperation(operatorId: string, woId: string, operationId: string) {
    // Stub: Operation start
    return { success: true };
  }

  async clockOutOperation(operatorId: string, woId: string, operationId: string, qtyProduced: number) {
    // Stub: Operation stop
    return { success: true };
  }
}
