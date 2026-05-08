export class PosService {
  async suspendSale(cartId: string) {
    return { success: true };
  }
  async splitPayment(cartId: string, payments: any[]) {
    return { success: true };
  }
}
