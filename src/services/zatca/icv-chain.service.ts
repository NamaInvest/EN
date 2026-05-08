export class ZATCACounterService {
  async getNextICV(tenantId: string) {
    return 1;
  }
  async getPreviousHash(tenantId: string) {
    return '0'.repeat(64);
  }
}
